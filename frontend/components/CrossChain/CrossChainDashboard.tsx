import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Globe, ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const ChainGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const ChainCard = styled(motion.div)<{ active?: boolean }>`
  background: ${props => props.active 
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)'
    : 'rgba(255, 255, 255, 0.05)'
  };
  border: 1px solid ${props => props.active 
    ? 'rgba(6, 182, 212, 0.5)' 
    : 'rgba(255, 255, 255, 0.1)'
  };
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  
  h3 {
    color: #f1f5f9;
    font-size: 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .stats {
    display: grid;
    gap: 0.75rem;
    
    .stat {
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 0.875rem;
      
      .value {
        color: #f1f5f9;
        font-weight: 600;
      }
    }
  }
`;

const BridgeSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const RouteDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
  
  .chain {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem 2rem;
    text-align: center;
    
    h4 {
      color: #94a3b8;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    
    p {
      color: #f1f5f9;
      font-size: 1.25rem;
      font-weight: 600;
    }
  }
  
  .arrow {
    color: #06b6d4;
    animation: pulse 2s infinite;
  }
  
@keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
`;

const InputSection = styled.div`
  margin: 2rem 0;
  
  label {
    display: block;
    color: #94a3b8;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }
  
  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: white;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #06b6d4;
    }
  }
`;

const BridgeButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FeeEstimate = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  
  h4 {
    color: #94a3b8;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }
  
  .fee-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    
    .label {
      color: #64748b;
      font-size: 0.875rem;
    }
    
    .value {
      color: #f1f5f9;
      font-weight: 600;
    }
  }
`;

interface ChainData {
  name: string;
  chainId: number;
  icon: string;
  tvl: string;
  apy: string;
  gasPrice: string;
  active: boolean;
}

export default function CrossChainDashboard({ account }: { account: string | null }) {
  const [selectedSource, setSelectedSource] = useState<string>('Ethereum');
  const [selectedDestination, setSelectedDestination] = useState<string>('Arbitrum');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const chains: ChainData[] = [
    {
      name: 'Ethereum',
      chainId: 1,
      icon: '🔷',
      tvl: '$2.5B',
      apy: '5.2%',
      gasPrice: '25 gwei',
      active: true
    },
    {
      name: 'Arbitrum',
      chainId: 42161,
      icon: '🔵',
      tvl: '$1.8B',
      apy: '6.8%',
      gasPrice: '0.1 gwei',
      active: true
    },
    {
      name: 'Polygon',
      chainId: 137,
      icon: '🟣',
      tvl: '$900M',
      apy: '7.5%',
      gasPrice: '30 gwei',
      active: true
    },
    {
      name: 'Optimism',
      chainId: 10,
      icon: '🔴',
      tvl: '$600M',
      apy: '6.2%',
      gasPrice: '0.001 gwei',
      active: false
    }
  ];
  
  const handleBridge = async () => {
    if (!amount || !account) return;
    
    setIsLoading(true);
    // Implement CCIP bridge logic here
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };
  
  const estimateFees = () => {
    if (!amount) return { bridgeFee: '0', gasEstimate: '0', total: '0' };
    
    const bridgeFee = (parseFloat(amount) * 0.001).toFixed(2); // 0.1% fee
    const gasEstimate = '5.00'; // $5 gas estimate
    const total = (parseFloat(bridgeFee) + parseFloat(gasEstimate)).toFixed(2);
    
    return { bridgeFee, gasEstimate, total };
  };
  
  const fees = estimateFees();
  
  return (
    <Container>
      <Header>
        <h1>Cross-Chain Operations</h1>
        <p>Seamlessly move funds across chains with Chainlink CCIP</p>
      </Header>
      
      <ChainGrid>
        {chains.map((chain, index) => (
          <ChainCard
            key={chain.name}
            active={chain.active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => chain.active && setSelectedSource(chain.name)}
          >
            <h3>
              <span style={{ fontSize: '2rem' }}>{chain.icon}</span>
              {chain.name}
            </h3>
            <div className="stats">
              <div className="stat">
                <span>TVL</span>
                <span className="value">{chain.tvl}</span>
              </div>
              <div className="stat">
                <span>APY</span>
                <span className="value">{chain.apy}</span>
              </div>
              <div className="stat">
                <span>Gas Price</span>
                <span className="value">{chain.gasPrice}</span>
              </div>
              <div className="stat">
                <span>Status</span>
                <span className="value" style={{ 
                  color: chain.active ? '#10b981' : '#ef4444' 
                }}>
                  {chain.active ? 'Active' : 'Coming Soon'}
                </span>
              </div>
            </div>
          </ChainCard>
        ))}
      </ChainGrid>
      
      <BridgeSection>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          Bridge Funds
        </h2>
        
        <RouteDisplay>
          <div className="chain">
            <h4>From</h4>
            <p>{selectedSource}</p>
          </div>
          <ArrowRight size={32} className="arrow" />
          <div className="chain">
            <h4>To</h4>
            <p>{selectedDestination}</p>
          </div>
        </RouteDisplay>
        
        <InputSection>
          <label>Amount to Bridge</label>
          <input
            type="number"
            placeholder="0.00 USDC"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </InputSection>
        
        <FeeEstimate>
          <h4>Fee Estimate</h4>
          <div className="fee-row">
            <span className="label">Bridge Fee (0.1%)</span>
            <span className="value">${fees.bridgeFee}</span>
          </div>
          <div className="fee-row">
            <span className="label">Gas Estimate</span>
            <span className="value">${fees.gasEstimate}</span>
          </div>
          <div className="fee-row" style={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
            paddingTop: '0.5rem' 
          }}>
            <span className="label"><strong>Total Cost</strong></span>
            <span className="value"><strong>${fees.total}</strong></span>
          </div>
        </FeeEstimate>
        
        <BridgeButton
          onClick={handleBridge}
          disabled={!amount || !account || isLoading}
          style={{ marginTop: '1.5rem' }}
        >
          {isLoading ? 'Processing...' : 'Bridge Funds'}
        </BridgeButton>
      </BridgeSection>
    </Container>
  );
}