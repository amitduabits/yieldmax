import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ethers } from 'ethers';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Activity, Shield, RefreshCw } from 'lucide-react';
import { VAULT_ABI, ERC20_ABI, STRATEGY_ABI } from '../../lib/contracts/addresses';

// Helper to safely format bigint values
const formatBigIntValue = (value: any, decimals: number = 18): string => {
  if (!value || typeof value !== 'bigint') return '0';
  return formatUnits(value, decimals);
};

// Add totalSupply to VAULT_ABI
const EXTENDED_VAULT_ABI = [
  ...VAULT_ABI,
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract configuration
const CONTRACTS = {
  vault: '0x8B388c1E9f6b3Ef66f5D3E81d90CD1e5d65AC0BC',
  strategyEngine: '0xE113312320A6Fb5cf78ac7e0C8B72E9bc788aC4f',
  usdc: '0x99f8B38514d22c54982b4be93495735bfcCE23b9'
};

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    color: #94a3b8;
    font-size: 1.125rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    color: #94a3b8;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .value {
    font-size: 2rem;
    font-weight: bold;
    color: #f1f5f9;
  }
  
  .subtext {
    color: #64748b;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }
`;

const ActionSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  background: ${props => props.$active ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$active ? 
      'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 
      'rgba(255, 255, 255, 0.15)'
    };
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    color: #94a3b8;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }
  
  .input-wrapper {
    display: flex;
    gap: 1rem;
  }
  
  input {
    flex: 1;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: white;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
  }
  
  button {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const ProtocolInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
  
  h3 {
    color: #f1f5f9;
    margin-bottom: 1rem;
  }
  
  .protocol-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    
    .stat {
      h4 {
        color: #94a3b8;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }
      
      p {
        color: #f1f5f9;
        font-size: 1.25rem;
        font-weight: 600;
      }
    }
  }
`;

const RefreshButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 8px;
  color: #60a5fa;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem auto 0;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(59, 130, 246, 0.3);
    transform: translateY(-1px);
  }
`;

export default function Portfolio() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Handle SSR/Hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Vault data reads
  const { data: totalAssets, refetch: refetchAssets } = useContractRead({
    address: CONTRACTS.vault as `0x${string}`,
    abi: EXTENDED_VAULT_ABI,
    functionName: 'totalAssets',
    watch: true,
  });
  
  const { data: totalShares, refetch: refetchTotalShares } = useContractRead({
    address: CONTRACTS.vault as `0x${string}`,
    abi: EXTENDED_VAULT_ABI,
    functionName: 'totalSupply',
    watch: true,
  });
  
  const { data: userShares, refetch: refetchShares } = useContractRead({
    address: CONTRACTS.vault as `0x${string}`,
    abi: EXTENDED_VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    watch: true,
  });
  
  const { data: userBalance, refetch: refetchBalance } = useContractRead({
    address: CONTRACTS.usdc as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    watch: true,
  });
  
  const { data: strategyData } = useContractRead({
    address: CONTRACTS.strategyEngine as `0x${string}`,
    abi: STRATEGY_ABI,
    functionName: 'getCurrentStrategy',
    watch: true,
  });
  
  // Contract writes
  const { write: approve } = useContractWrite({
    address: CONTRACTS.usdc as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'approve',
  });
  
  const { write: deposit } = useContractWrite({
    address: CONTRACTS.vault as `0x${string}`,
    abi: EXTENDED_VAULT_ABI,
    functionName: 'deposit',
  });
  
  const { write: withdraw } = useContractWrite({
    address: CONTRACTS.vault as `0x${string}`,
    abi: EXTENDED_VAULT_ABI,
    functionName: 'withdraw',
  });
  
  // Calculate user's vault balance
  const calculateUserBalance = () => {
    if (!userShares || !totalAssets || !totalShares) return 0;
    
    // Simple calculation: (userShares / totalShares) * totalAssets
    const userSharesBN = BigInt(userShares.toString());
    const totalSharesBN = BigInt(totalShares.toString());
    const totalAssetsBN = BigInt(totalAssets.toString());
    
    if (totalSharesBN === BigInt(0)) return 0;
    
    // Calculate user's portion of total assets
    const userAssets = (userSharesBN * totalAssetsBN) / totalSharesBN;
    
    // Convert from 6 decimals (USDC) to human readable
    return Number(formatUnits(userAssets, 6));
  };
  
  const userAssetValue = calculateUserBalance();
  const currentAPY = strategyData ? Number(strategyData[2]) / 100 : 5.20;
  const currentProtocol = strategyData ? strategyData[0] : 'Aave';
  const riskScore = strategyData ? Number(strategyData[3]) : 20;
  
  // Direct deposit using ethers.js and MetaMask
  const handleDirectDeposit = async () => {
    if (!window.ethereum || !amount) return;
    
    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Create contract instances
      const vaultContract = new ethers.Contract(
        CONTRACTS.vault,
        ['function deposit(uint256 assets, address receiver) returns (uint256)'],
        signer
      );
      
      const usdcContract = new ethers.Contract(
        CONTRACTS.usdc,
        [
          'function approve(address spender, uint256 amount) returns (bool)',
          'function allowance(address owner, address spender) view returns (uint256)'
        ],
        signer
      );
      
      // Parse amount (USDC has 6 decimals)
      const amountWei = ethers.utils.parseUnits(amount, 6);
      
      // Check current allowance
      const currentAllowance = await usdcContract.allowance(userAddress, CONTRACTS.vault);
      
      // If allowance is insufficient, approve first
      if (currentAllowance.lt(amountWei)) {
        console.log('Approving USDC...');
        const approveTx = await usdcContract.approve(CONTRACTS.vault, amountWei);
        await approveTx.wait();
        console.log('Approval confirmed!');
      }
      
      // Now deposit
      console.log('Depositing', amount, 'USDC...');
      const depositTx = await vaultContract.deposit(amountWei, userAddress);
      const receipt = await depositTx.wait();
      console.log('Deposit confirmed!', receipt);
      
      // Clear the form and refresh
      setAmount('');
      alert('Deposit successful!');
      setTimeout(() => refreshData(), 2000);
      
    } catch (error) {
      console.error('Deposit error:', error);
      alert('Deposit failed: ' + (error as any).message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleWithdraw = async () => {
    if (!amount || !address) return;
    
    try {
      setIsLoading(true);
      const parsedAmount = parseUnits(amount, 6);
      
      await withdraw({
        args: [parsedAmount, address, address],
      });
      
      setAmount('');
      setTimeout(() => {
        refreshData();
      }, 5000);
      
    } catch (error) {
      console.error('Withdraw failed:', error);
      alert('Withdraw failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshData = () => {
    refetchBalance();
    refetchShares();
    refetchAssets();
    refetchTotalShares();
  };
  
  // Don't render wallet-dependent content until mounted
  if (!mounted) {
    return (
      <Container>
        <Header>
          <h1>YieldMax Portfolio</h1>
          <p>Loading...</p>
        </Header>
      </Container>
    );
  }
  
  if (!isConnected) {
    return (
      <Container>
        <Header>
          <h1>YieldMax Portfolio</h1>
          <p>Please connect your wallet to continue</p>
        </Header>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <h1>YieldMax Portfolio</h1>
        <p>Automated yield optimization across DeFi protocols</p>
        <RefreshButton onClick={refreshData}>
          <RefreshCw size={16} /> Refresh Data
        </RefreshButton>
      </Header>
      
      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3><DollarSign size={20} /> Your Balance</h3>
          <div className="value">
            ${userAssetValue.toFixed(2)}
          </div>
          <div className="subtext">
            {Number(formatBigIntValue(userShares, 18)).toFixed(8)} ymUSDC
          </div>
        </StatCard>
        
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3><TrendingUp size={20} /> Current APY</h3>
          <div className="value">{currentAPY.toFixed(2)}%</div>
          <div className="subtext">Auto-compounding</div>
        </StatCard>
        
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3><Activity size={20} /> Active Protocol</h3>
          <div className="value">{currentProtocol}</div>
          <div className="subtext">Optimized hourly</div>
        </StatCard>
        
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3><Shield size={20} /> Risk Score</h3>
          <div className="value">{riskScore}/100</div>
          <div className="subtext">
            {riskScore <= 30 ? 'Low Risk' : riskScore <= 60 ? 'Medium Risk' : 'High Risk'}
          </div>
        </StatCard>
      </StatsGrid>
      
      <ActionSection>
        <TabContainer>
          <Tab $active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')}>
            Deposit
          </Tab>
          <Tab $active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')}>
            Withdraw
          </Tab>
        </TabContainer>
        
        {activeTab === 'deposit' ? (
          <div>
            <InputGroup>
              <label>Amount to Deposit</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <button
                  onClick={handleDirectDeposit}
                  disabled={!amount || isLoading}
                >
                  {isLoading ? 'Processing...' : 'Deposit USDC'}
                </button>
              </div>
              <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                Available: {formatBigIntValue(userBalance, 6)} USDC
              </div>
            </InputGroup>
          </div>
        ) : (
          <div>
            <InputGroup>
              <label>Amount to Withdraw</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <button
                  onClick={handleWithdraw}
                  disabled={isLoading || !amount}
                >
                  {isLoading ? 'Processing...' : 'Withdraw USDC'}
                </button>
              </div>
              <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                Available: ${userAssetValue.toFixed(2)}
              </div>
            </InputGroup>
          </div>
        )}
      </ActionSection>
      
      <ProtocolInfo>
        <h3>Protocol Information</h3>
        <div className="protocol-stats">
          <div className="stat">
            <h4>Total Value Locked</h4>
              <p>${formatBigIntValue(totalAssets, 6) || '8970'}</p>
          </div>
          <div className="stat">
            <h4>Strategy Confidence</h4>
            <p>{strategyData ? Number(strategyData[4]) : 85}%</p>
          </div>
          <div className="stat">
            <h4>Last Update</h4>
            <p>{strategyData ? new Date(Number(strategyData[5]) * 1000).toLocaleString() : new Date().toLocaleString()}</p>
          </div>
        </div>
      </ProtocolInfo>
    </Container>
  );
}

