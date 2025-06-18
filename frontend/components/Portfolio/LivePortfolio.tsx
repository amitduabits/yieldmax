import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract addresses - Update these after deployment
const VAULT_ADDRESS = "0xECbA31cf51F88BA5193186abf35225ECE097df44";
const USDC_ADDRESS = "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d";
const STRATEGY_ENGINE_ADDRESS = "0x..."; // Add after deployment

// ABIs
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

export default function LivePortfolio({ signer, provider, onBalanceUpdate }) {
  // Portfolio states
  const [totalValue, setTotalValue] = useState('0.00');
  const [userShares, setUserShares] = useState('0.00');
  const [userUSDC, setUserUSDC] = useState('0.00');
  const [vaultAssets, setVaultAssets] = useState('0.00');
  const [currentAPY, setCurrentAPY] = useState('8.20');
  const [activeChains, setActiveChains] = useState(1);
  const [riskScore, setRiskScore] = useState('Low');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Load portfolio data
  const loadPortfolioData = async () => {
    if (!signer || !provider) return;

    try {
      setRefreshing(true);
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
      const userAddress = await signer.getAddress();

      // Get user's USDC balance
      const usdcBalance = await usdc.balanceOf(userAddress);
      const usdcFormatted = ethers.utils.formatUnits(usdcBalance, 6);
      setUserUSDC(usdcFormatted);
      
      // Pass balance to parent
      if (onBalanceUpdate) {
        onBalanceUpdate(parseFloat(usdcFormatted));
      }

      // Get vault data
      const shares = await vault.getUserShares(userAddress);
      const totalAssets = await vault.totalAssets();
      const totalShares = await vault.totalShares();
      
      // Calculate user's value
      let userValue = '0.00';
      if (totalShares.gt(0)) {
        const userValueBN = shares.mul(totalAssets).div(totalShares);
        userValue = ethers.utils.formatUnits(userValueBN, 6);
      }

      setUserShares(ethers.utils.formatUnits(shares, 6));
      setTotalValue(userValue);
      setVaultAssets(ethers.utils.formatUnits(totalAssets, 6));
      
      // Update APY based on strategy (if deployed)
      if (STRATEGY_ENGINE_ADDRESS !== "0x...") {
        // Fetch from strategy engine
        // const strategy = new ethers.Contract(STRATEGY_ENGINE_ADDRESS, STRATEGY_ABI, provider);
        // const currentStrategy = await strategy.getCurrentStrategy();
        // setCurrentAPY((currentStrategy.expectedYield / 100).toFixed(2));
      }
      
      setRefreshing(false);
    } catch (err) {
      console.error("Error loading portfolio:", err);
      setRefreshing(false);
    }
  };

  // Get test USDC from faucet
  const handleFaucet = async () => {
    if (!signer) return;
    
    setLoading(true);
    setError('');
    
    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      const tx = await usdc.faucet(ethers.utils.parseUnits('1000', 6));
      setTxHash(tx.hash);
      
      await tx.wait();
      await loadPortfolioData();
      
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Faucet failed');
      setLoading(false);
    }
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!signer || !depositAmount) return;
    
    setLoading(true);
    setError('');
    
    try {
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      const userAddress = await signer.getAddress();
      
      const amount = ethers.utils.parseUnits(depositAmount, 6);
      
      // Check allowance
      const allowance = await usdc.allowance(userAddress, VAULT_ADDRESS);
      
      if (allowance.lt(amount)) {
        const approveTx = await usdc.approve(VAULT_ADDRESS, ethers.constants.MaxUint256);
        await approveTx.wait();
      }
      
      // Deposit
      const tx = await vault.deposit(amount, userAddress);
      setTxHash(tx.hash);
      
      await tx.wait();
      await loadPortfolioData();
      
      setDepositAmount('');
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Deposit failed');
      setLoading(false);
    }
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!signer || !withdrawAmount) return;
    
    setLoading(true);
    setError('');
    
    try {
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      const shares = ethers.utils.parseUnits(withdrawAmount, 6);
      
      const tx = await vault.withdraw(shares);
      setTxHash(tx.hash);
      
      await tx.wait();
      await loadPortfolioData();
      
      setWithdrawAmount('');
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Withdrawal failed');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();
    const interval = setInterval(loadPortfolioData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [signer, provider]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          ⚡ YieldMax
        </h2>
        <div style={{
          padding: '8px 16px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#10b981'
        }}>
          {refreshing ? '🔄 Updating...' : '🟢 Live'}
        </div>
      </div>

      {/* Profit Display */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        padding: '30px',
        background: 'rgba(16, 185, 129, 0.05)',
        borderRadius: '15px',
        border: '1px solid rgba(16, 185, 129, 0.2)'
      }}>
        <p style={{ color: '#94a3b8', marginBottom: '10px', fontSize: '16px' }}>
          Today's Profit
        </p>
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 'bold',
          color: '#10b981',
          margin: '0 0 10px 0'
        }}>
          +$0.00
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Projected Monthly: +${(parseFloat(totalValue) * parseFloat(currentAPY) / 100 / 12).toFixed(2)}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Total Value */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>💰</span>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Total Value</span>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0' }}>
            ${totalValue}
          </h3>
          <p style={{ color: '#64748b', fontSize: '12px', marginTop: '5px' }}>
            +0.000%
          </p>
        </div>

        {/* Current APY */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '15px',
          padding: '20px',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>📈</span>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Current APY</span>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#3b82f6' }}>
            {currentAPY}%
          </h3>
          <p style={{ color: '#64748b', fontSize: '12px', marginTop: '5px' }}>
            Effective: 0.00%
          </p>
        </div>

        {/* Active Chains */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '15px',
          padding: '20px',
          border: '1px solid rgba(139, 92, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>🔗</span>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Active Chains</span>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#8b5cf6' }}>
            {activeChains}
          </h3>
          <p style={{ color: '#64748b', fontSize: '12px', marginTop: '5px' }}>
            ETH
          </p>
        </div>

        {/* Risk Score */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '15px',
          padding: '20px',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>🛡️</span>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Risk Score</span>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#10b981' }}>
            {riskScore}
          </h3>
          <p style={{ color: '#64748b', fontSize: '12px', marginTop: '5px' }}>
            Diversified across protocols
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <button
          onClick={() => document.getElementById('depositModal').style.display = 'block'}
          style={{
            padding: '15px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          💰 Deposit
        </button>

        <button
          onClick={() => document.getElementById('withdrawModal').style.display = 'block'}
          style={{
            padding: '15px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          💸 Withdraw
        </button>

        <button
          onClick={handleFaucet}
          disabled={loading}
          style={{
            padding: '15px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          🎁 Get Test USDC
        </button>

        <button
          onClick={loadPortfolioData}
          disabled={refreshing}
          style={{
            padding: '15px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            opacity: refreshing ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          🔄 {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Vault Data */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginTop: '30px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ color: '#3b82f6', marginBottom: '15px' }}>Live Vault Data</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#94a3b8' }}>Your USDC Balance</span>
            <span style={{ fontWeight: 'bold' }}>{userUSDC} USDC</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#94a3b8' }}>Your Vault Shares</span>
            <span style={{ fontWeight: 'bold' }}>{userShares}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Total Vault Assets</span>
            <span style={{ fontWeight: 'bold' }}>{vaultAssets} USDC</span>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ color: '#10b981', marginBottom: '15px' }}>Contract Information</h3>
          <div style={{ marginBottom: '10px' }}>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '5px' }}>Vault Address</p>
            <p style={{ fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {VAULT_ADDRESS}
            </p>
          </div>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '5px' }}>USDC Address</p>
            <p style={{ fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {USDC_ADDRESS}
            </p>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          color: '#ef4444'
        }}>
          ❌ {error}
        </div>
      )}

      {txHash && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          color: '#10b981'
        }}>
          ✅ Transaction: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" style={{ color: '#10b981' }}>
            {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </a>
        </div>
      )}

      {/* Deposit Modal */}
      <div id="depositModal" style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: '#1a1a2e',
          padding: '30px',
          borderRadius: '20px',
          width: '90%',
          maxWidth: '400px',
          margin: 'auto',
          marginTop: '100px'
        }}>
          <h3 style={{ marginBottom: '20px' }}>Deposit USDC</h3>
          <input
            type="number"
            placeholder="Amount to deposit"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            style={{
              width: '100%',
              padding: '15px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '16px',
              marginBottom: '20px'
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleDeposit}
              disabled={loading || !depositAmount}
              style={{
                flex: 1,
                padding: '15px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading || !depositAmount ? 'not-allowed' : 'pointer',
                opacity: loading || !depositAmount ? 0.6 : 1
              }}
            >
              {loading ? 'Processing...' : 'Confirm Deposit'}
            </button>
            <button
              onClick={() => {
                document.getElementById('depositModal').style.display = 'none';
                setDepositAmount('');
              }}
              style={{
                padding: '15px 30px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      <div id="withdrawModal" style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: '#1a1a2e',
          padding: '30px',
          borderRadius: '20px',
          width: '90%',
          maxWidth: '400px',
          margin: 'auto',
          marginTop: '100px'
        }}>
          <h3 style={{ marginBottom: '20px' }}>Withdraw Shares</h3>
          <input
            type="number"
            placeholder="Shares to withdraw"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            style={{
              width: '100%',
              padding: '15px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '16px',
              marginBottom: '20px'
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleWithdraw}
              disabled={loading || !withdrawAmount}
              style={{
                flex: 1,
                padding: '15px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading || !withdrawAmount ? 'not-allowed' : 'pointer',
                opacity: loading || !withdrawAmount ? 0.6 : 1
              }}
            >
              {loading ? 'Processing...' : 'Confirm Withdraw'}
            </button>
            <button
              onClick={() => {
                document.getElementById('withdrawModal').style.display = 'none';
                setWithdrawAmount('');
              }}
              style={{
                padding: '15px 30px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}