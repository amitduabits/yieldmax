import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Shield, Activity } from 'lucide-react';
import { useAccount } from 'wagmi';

const Container = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    color: #64748b;
    font-size: 1.125rem;
    margin-bottom: 1rem;
  }
`;

const RefreshButton = styled.button`
  padding: 0.5rem 1.5rem;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 8px;
  color: #60a5fa;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: rgba(59, 130, 246, 0.3);
    transform: translateY(-1px);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled(motion.div)`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  
  h3 {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .value {
    font-size: 2.5rem;
    font-weight: bold;
    color: #f8fafc;
    margin-bottom: 0.5rem;
    line-height: 1;
  }
  
  .subtext {
    color: #475569;
    font-size: 0.875rem;
  }
`;

const ActionCard = styled.div`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 2rem;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  padding: 0.25rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  background: ${props => props.$active ? 
    'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.$active ? 'white' : '#94a3b8'};
  }
`;

const InputGroup = styled.div`
  .label {
    color: #94a3b8;
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
    display: block;
  }
  
  .input-container {
    display: flex;
    align-items: center;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 0.25rem;
    margin-bottom: 1rem;
    transition: all 0.2s;
    
    &:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
  
  input {
    flex: 1;
    padding: 1rem;
    background: transparent;
    border: none;
    color: white;
    font-size: 1.25rem;
    font-weight: 500;
    
    &:focus {
      outline: none;
    }
    
    &::placeholder {
      color: #475569;
    }
  }
  
  .currency {
    padding: 0 1rem;
    color: #64748b;
    font-weight: 500;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 1rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BalanceInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 8px;
  
  .label {
    color: #64748b;
    font-size: 0.875rem;
  }
  
  .balance {
    color: #f8fafc;
    font-weight: 500;
  }
  
  .max-button {
    color: #3b82f6;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s;
    
    &:hover {
      color: #60a5fa;
    }
  }
`;

export default function Portfolio() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock data
  const userBalance = 80.46;
  const ymUSDCBalance = 0.0000000897;
  const currentAPY = 5.20;
  const currentProtocol = 'Aave';
  const riskScore = 20;
  
  const handleMaxClick = () => {
    if (activeTab === 'deposit') {
      setAmount(userBalance.toString());
    } else {
      setAmount(ymUSDCBalance.toString());
    }
  };
  
  const handleAction = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsLoading(true);
    try {
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`${activeTab === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);
      setAmount('');
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed. Please try again.');
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
        <RefreshButton onClick={() => window.location.reload()}>
          <span>📊</span> Refresh Data
        </RefreshButton>
      </Header>
      
      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3><DollarSign size={16} /> Your Balance</h3>
          <div className="value">${userBalance.toFixed(2)}</div>
          <div className="subtext">{ymUSDCBalance} ymUSDC</div>
        </StatCard>
        
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3><TrendingUp size={16} /> Current APY</h3>
          <div className="value">{currentAPY}%</div>
          <div className="subtext">Auto-compounding</div>
        </StatCard>
        
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3><Activity size={16} /> Active Protocol</h3>
          <div className="value">{currentProtocol}</div>
          <div className="subtext">Optimized hourly</div>
        </StatCard>
        
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3><Shield size={16} /> Risk Score</h3>
          <div className="value">{riskScore}/100</div>
          <div className="subtext">Low Risk</div>
        </StatCard>
      </StatsGrid>
      
      <ActionCard>
        <TabContainer>
          <Tab $active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')}>
            Deposit
          </Tab>
          <Tab $active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')}>
            Withdraw
          </Tab>
        </TabContainer>
        
        <div>
          <InputGroup>
            <label className="label">
              Amount ({activeTab === 'deposit' ? 'USDC' : 'ymUSDC'})
            </label>
            <div className="input-container">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
              />
              <span className="currency">
                {activeTab === 'deposit' ? 'USDC' : 'ymUSDC'}
              </span>
            </div>
          </InputGroup>
          
          <BalanceInfo>
            <span className="label">Available Balance</span>
            <div>
              <span className="balance">
                {activeTab === 'deposit' 
                  ? `${userBalance} USDC` 
                  : `${ymUSDCBalance} ymUSDC`
                }
              </span>
              <span className="max-button" onClick={handleMaxClick}>
                {' '}• MAX
              </span>
            </div>
          </BalanceInfo>
          
          <ActionButton 
            onClick={handleAction}
            disabled={!amount || parseFloat(amount) <= 0 || isLoading}
          >
            {isLoading 
              ? 'Processing...' 
              : activeTab === 'deposit' ? 'Deposit' : 'Withdraw'
            }
          </ActionButton>
        </div>
      </ActionCard>
    </Container>
  );
}