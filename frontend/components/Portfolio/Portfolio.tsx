import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ethers } from 'ethers';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Activity, Shield, RefreshCw } from 'lucide-react';

// Contract configuration
const CONTRACTS = {
  sepolia: {
    vault: '0xECbA31cf51F88BA5193186abf35225ECE097df44',
    strategyEngine: '0x467B0446a4628F83DEA0fd82cB83f8ef8140fC30',
    usdc: '0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d'
  }
};

const VAULT_ABI = [
  'function deposit(uint256 assets, address receiver) returns (uint256 shares)',
  'function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)',
  'function totalAssets() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function convertToAssets(uint256 shares) view returns (uint256)',
  'function maxWithdraw(address owner) view returns (uint256)',
  'function previewDeposit(uint256 assets) view returns (uint256)',
  'function previewWithdraw(uint256 assets) view returns (uint256)'
];

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

const STRATEGY_ABI = [
  'function getCurrentStrategy() view returns (string memory, uint256, uint256, uint256, uint256, uint256)',
  'function shouldRebalance() view returns (bool, string memory)'
];

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
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

const Tab = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  background: ${props => props.active ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.active ? 
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

export default function Portfolio() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Vault data
  const { data: totalAssets } = useContractRead({
    address: CONTRACTS.sepolia.vault,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
    watch: true,
  });
  
  const { data: userShares } = useContractRead({
    address: CONTRACTS.sepolia.vault,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    watch: true,
  });
  
  const { data: userBalance } = useContractRead({
    address: CONTRACTS.sepolia.usdc,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    watch: true,
  });
  
  const { data: strategyData } = useContractRead({
    address: CONTRACTS.sepolia.strategyEngine,
    abi: STRATEGY_ABI,
    functionName: 'getCurrentStrategy',
    watch: true,
  });
  
  // Contract writes
  const { write: approve, data: approveData } = useContractWrite({
    address: CONTRACTS.sepolia.usdc,
    abi: ERC20_ABI,
    functionName: 'approve',
  });
  
  const { write: deposit, data: depositData } = useContractWrite({
    address: CONTRACTS.sepolia.vault,
    abi: VAULT_ABI,
    functionName: 'deposit',
  });
  
  const { write: withdraw, data: withdrawData } = useContractWrite({
    address: CONTRACTS.sepolia.vault,
    abi: VAULT_ABI,
    functionName: 'withdraw',
  });
  
  // Wait for transactions
  const { isLoading: isApproving } = useWaitForTransaction({
    hash: approveData?.hash,
  });
  
  const { isLoading: isDepositing } = useWaitForTransaction({
    hash: depositData?.hash,
  });
  
  const { isLoading: isWithdrawing } = useWaitForTransaction({
    hash: withdrawData?.hash,
  });
  
  // Calculations
  const userAssetValue = userShares && totalAssets && Number(userShares) > 0
    ? (Number(userShares) * Number(totalAssets)) / (10 ** 18)
    : 0;
  
  const currentAPY = strategyData ? Number(strategyData[2]) / 100 : 0;
  const currentProtocol = strategyData ? strategyData[0] : 'Loading...';
  const riskScore = strategyData ? Number(strategyData[3]) : 0;
  
  const handleDeposit = async () => {
    if (!amount || !address) return;
    
    try {
      setIsLoading(true);
      const parsedAmount = parseUnits(amount, 6); // USDC has 6 decimals
      
      // First approve
      await approve({
        args: [CONTRACTS.sepolia.vault, parsedAmount],
      });
      
      // Wait for approval
      setTimeout(async () => {
        // Then deposit
        await deposit({
          args: [parsedAmount, address],
        });
      }, 5000);
      
    } catch (error) {
      console.error('Deposit failed:', error);
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
      
    } catch (error) {
      console.error('Withdraw failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
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
            {userShares ? formatUnits(userShares, 18) : '0'} ymUSDC
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
          <Tab active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')}>
            Deposit
          </Tab>
          <Tab active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')}>
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
                  onClick={handleDeposit}
                  disabled={isLoading || isApproving || isDepositing || !amount}
                >
                  {isApproving ? 'Approving...' : isDepositing ? 'Depositing...' : 'Deposit USDC'}
                </button>
              </div>
              <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                Available: {userBalance ? formatUnits(userBalance, 6) : '0'} USDC
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
                  disabled={isLoading || isWithdrawing || !amount}
                >
                  {isWithdrawing ? 'Withdrawing...' : 'Withdraw USDC'}
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
            <p>${totalAssets ? formatUnits(totalAssets, 6) : '0'}</p>
          </div>
          <div className="stat">
            <h4>Strategy Confidence</h4>
            <p>{strategyData ? Number(strategyData[4]) : 0}%</p>
          </div>
          <div className="stat">
            <h4>Last Update</h4>
            <p>{strategyData ? new Date(Number(strategyData[5]) * 1000).toLocaleString() : 'N/A'}</p>
          </div>
        </div>
      </ProtocolInfo>
    </Container>
  );
}