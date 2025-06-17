// components/Portfolio/EnhancedPortfolio.tsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const CONTRACTS = {
  sepolia: {
    YieldMaxVault: "0xECbA31cf51F88BA5193186abf35225ECE097df44",
    USDC: "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d",
  }
};

const VAULT_ABI = [
  "function totalAssets() view returns (uint256)",
  "function totalShares() view returns (uint256)", 
  "function getUserShares(address user) view returns (uint256)",
  "function deposit(uint256 amount, address receiver) returns (uint256 shares)",
  "function withdraw(uint256 shares) returns (uint256 amount)",
  "function lastRebalance() view returns (uint256)",
];

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function faucet(uint256 amount)",
];

interface VaultData {
  totalAssets: string;
  totalShares: string;
  userShares: string;
  userBalance: string;
  apy: string;
  todaysProfit: string;
  monthlyProjected: string;
}

export const EnhancedPortfolio = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [vaultData, setVaultData] = useState<VaultData>({
    totalAssets: '0',
    totalShares: '0',
    userShares: '0',
    userBalance: '0',
    apy: '8.20',
    todaysProfit: '0.00',
    monthlyProjected: '0.01',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [activeModal, setActiveModal] = useState<'deposit' | 'withdraw' | null>(null);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setIsConnecting(true);
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
        await fetchVaultData(accounts[0]);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
      setIsConnecting(false);
    } else {
      alert('Please install MetaMask!');
    }
  };

  const fetchVaultData = async (userAddress: string) => {
    if (!userAddress) return;
    
    setIsLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const vaultContract = new ethers.Contract(CONTRACTS.sepolia.YieldMaxVault, VAULT_ABI, provider);
      const usdcContract = new ethers.Contract(CONTRACTS.sepolia.USDC, ERC20_ABI, provider);

      const [totalAssets, totalShares, userShares, userBalance] = await Promise.all([
        vaultContract.totalAssets(),
        vaultContract.totalShares(),
        vaultContract.getUserShares(userAddress),
        usdcContract.balanceOf(userAddress),
      ]);

      const userSharesFormatted = parseFloat(ethers.utils.formatUnits(userShares, 6));
      const dailyRate = 8.20 / 365; // Daily rate from 8.20% APY
      const todaysProfit = (userSharesFormatted * dailyRate / 100).toFixed(2);
      const monthlyProjected = (userSharesFormatted * dailyRate * 30 / 100).toFixed(2);

      setVaultData({
        totalAssets: ethers.utils.formatUnits(totalAssets, 6),
        totalShares: ethers.utils.formatUnits(totalShares, 6),
        userShares: ethers.utils.formatUnits(userShares, 6),
        userBalance: ethers.utils.formatUnits(userBalance, 6),
        apy: '8.20',
        todaysProfit,
        monthlyProjected,
      });
    } catch (error) {
      console.error('Error fetching vault data:', error);
    }
    setIsLoading(false);
  };

  const handleDeposit = async () => {
    if (!account || !depositAmount) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const vaultContract = new ethers.Contract(CONTRACTS.sepolia.YieldMaxVault, VAULT_ABI, signer);
      const usdcContract = new ethers.Contract(CONTRACTS.sepolia.USDC, ERC20_ABI, signer);

      const amount = ethers.utils.parseUnits(depositAmount, 6);
      
      // First approve
      const approveTx = await usdcContract.approve(CONTRACTS.sepolia.YieldMaxVault, amount);
      await approveTx.wait();
      
      // Then deposit
      const depositTx = await vaultContract.deposit(amount, account);
      await depositTx.wait();
      
      setDepositAmount('');
      setActiveModal(null);
      await fetchVaultData(account);
    } catch (error) {
      console.error('Deposit failed:', error);
      alert('Deposit failed. Check console for details.');
    }
  };

  const handleWithdraw = async () => {
    if (!account || !withdrawAmount) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const vaultContract = new ethers.Contract(CONTRACTS.sepolia.YieldMaxVault, VAULT_ABI, signer);

      const shares = ethers.utils.parseUnits(withdrawAmount, 6);
      const withdrawTx = await vaultContract.withdraw(shares);
      await withdrawTx.wait();
      
      setWithdrawAmount('');
      setActiveModal(null);
      await fetchVaultData(account);
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal failed. Check console for details.');
    }
  };

  const mintTestUSDC = async () => {
    if (!account) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const usdcContract = new ethers.Contract(CONTRACTS.sepolia.USDC, ERC20_ABI, signer);

      const amount = ethers.utils.parseUnits("1000", 6); // Mint 1000 USDC
      const tx = await usdcContract.faucet(amount);
      await tx.wait();
      
      await fetchVaultData(account);
      alert('Successfully minted 1000 test USDC!');
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Minting failed. You might have already minted recently.');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            fetchVaultData(accounts[0]);
          }
        });
    }
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (account) {
      const interval = setInterval(() => fetchVaultData(account), 30000);
      return () => clearInterval(interval);
    }
  }, [account]);

  if (!account) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #1e293b 0%, #1e40af 50%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '20px'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold', color: 'white' }}>
          ⚡ YieldMax
        </h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.8, color: 'white', textAlign: 'center' }}>
          Cross-Chain Yield Optimization Protocol
        </p>
        
        <div style={{ 
          background: 'rgba(34, 197, 94, 0.2)', 
          border: '1px solid rgba(34, 197, 94, 0.5)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '2rem',
          color: 'white',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              background: '#22c55e', 
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>🎉 LIVE ON SEPOLIA TESTNET</span>
          </div>
          <p style={{ color: '#dcfce7', fontSize: '1rem' }}>
            Enhanced portfolio dashboard with live contract integration
          </p>
        </div>

        <button
          onClick={connectWallet}
          disabled={isConnecting}
          style={{
            background: isConnecting ? '#6b7280' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 32px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: isConnecting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        borderBottom: '1px solid #1e293b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#38bdf8' }}>YieldMax</h1>
        </div>
        <div style={{
          background: '#1e293b',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontSize: '0.9rem',
          fontFamily: 'monospace'
        }}>
          🟡 {account.slice(0, 6)}...{account.slice(-4)}
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {/* Today's Profit Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Today's Profit</p>
          <h2 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: '#10b981',
            margin: '0 0 0.5rem 0'
          }}>
            +${vaultData.todaysProfit}
          </h2>
          <p style={{ color: '#6b7280' }}>Projected Monthly: +${vaultData.monthlyProjected}</p>
        </div>

        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <MetricCard
            title="Total Value"
            value={`$${parseFloat(vaultData.userShares).toFixed(2)}`}
            change="+0.000%"
            icon="💰"
          />
          <MetricCard
            title="Current APY"
            value={`${vaultData.apy}%`}
            change="Effective: 0.00%"
            icon="📈"
            valueColor="#10b981"
          />
          <MetricCard
            title="Active Chains"
            value="1"
            change="ETH"
            icon="🔗"
          />
          <MetricCard
            title="Risk Score"
            value="Low"
            change="Diversified across protocols"
            icon="🛡️"
            valueColor="#10b981"
          />
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          marginBottom: '3rem'
        }}>
          <button
            onClick={() => setActiveModal('deposit')}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            💰 Deposit
          </button>
          <button
            onClick={() => setActiveModal('withdraw')}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            💸 Withdraw
          </button>
          <button
            onClick={mintTestUSDC}
            style={{
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🎁 Get Test USDC
          </button>
          <button
            onClick={() => fetchVaultData(account)}
            disabled={isLoading}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? '⏳' : '🔄'} Refresh
          </button>
        </div>

        {/* Portfolio Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem'
        }}>
          {/* Live Data Panel */}
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #334155'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#38bdf8' }}>Live Vault Data</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <DataRow label="Your USDC Balance" value={`${parseFloat(vaultData.userBalance).toFixed(2)} USDC`} />
              <DataRow label="Your Vault Shares" value={parseFloat(vaultData.userShares).toFixed(2)} />
              <DataRow label="Total Vault Assets" value={`${parseFloat(vaultData.totalAssets).toFixed(2)} USDC`} />
              <DataRow label="Total Vault Shares" value={parseFloat(vaultData.totalShares).toFixed(2)} />
              <DataRow 
                label="Your Ownership" 
                value={`${parseFloat(vaultData.totalShares) > 0 
                  ? ((parseFloat(vaultData.userShares) / parseFloat(vaultData.totalShares)) * 100).toFixed(2)
                  : '0'
                }%`} 
              />
            </div>
          </div>

          {/* Contract Info */}
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #334155'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#38bdf8' }}>Contract Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Vault Address</p>
                <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#e2e8f0' }}>
                  {CONTRACTS.sepolia.YieldMaxVault}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '0.25rem' }}>USDC Address</p>
                <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#e2e8f0' }}>
                  {CONTRACTS.sepolia.USDC}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Network</p>
                <p style={{ color: '#10b981', fontWeight: 'bold' }}>Sepolia Testnet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <Modal
          title={activeModal === 'deposit' ? 'Deposit USDC' : 'Withdraw Shares'}
          onClose={() => setActiveModal(null)}
        >
          <div style={{ padding: '1rem' }}>
            <input
              type="number"
              placeholder={activeModal === 'deposit' ? 'Amount in USDC' : 'Amount in shares'}
              value={activeModal === 'deposit' ? depositAmount : withdrawAmount}
              onChange={(e) => activeModal === 'deposit' 
                ? setDepositAmount(e.target.value) 
                : setWithdrawAmount(e.target.value)
              }
              style={{
                width: '100%',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                padding: '12px',
                color: 'white',
                fontSize: '1rem',
                marginBottom: '1rem'
              }}
            />
            <button
              onClick={activeModal === 'deposit' ? handleDeposit : handleWithdraw}
              style={{
                width: '100%',
                background: activeModal === 'deposit' ? '#3b82f6' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {activeModal === 'deposit' ? 'Deposit' : 'Withdraw'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Helper Components
const MetricCard = ({ title, value, change, icon, valueColor = '#e2e8f0' }: any) => (
  <div style={{
    background: '#1e293b',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #334155'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{title}</p>
        <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: valueColor, margin: '0 0 0.25rem 0' }}>
          {value}
        </p>
        <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>{change}</p>
      </div>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
    </div>
  </div>
);

const DataRow = ({ label, value }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{label}</span>
    <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{value}</span>
  </div>
);

const Modal = ({ title, onClose, children }: any) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }}>
    <div style={{
      background: '#1e293b',
      borderRadius: '12px',
      maxWidth: '400px',
      width: '90%',
      border: '1px solid #334155'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '1px solid #334155'
      }}>
        <h3 style={{ color: '#e2e8f0' }}>{title}</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>
      {children}
    </div>
  </div>
);