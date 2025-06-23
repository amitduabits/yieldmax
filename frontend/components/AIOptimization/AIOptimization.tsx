import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Shield, Activity, RefreshCw } from 'lucide-react';

const CONTRACTS = {
  sepolia: {
    strategyEngine: '0x467B0446a4628F83DEA0fd82cB83f8ef8140fC30',
  }
};

const STRATEGY_ABI = [
  'function protocolData(uint256) view returns (uint256 apy, uint256 tvl, uint256 utilization, uint256 lastUpdate, bool active)',
  'function getCurrentStrategy() view returns (string memory, uint256, uint256, uint256, uint256, uint256)',
  'function shouldRebalance() view returns (bool, string memory)',
  'function rebalanceThreshold() view returns (uint256)'
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
    font-size: 2.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const AIInsightCard = styled(motion.div)`
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  
  h2 {
    color: #f1f5f9;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
`;

const Metric = styled.div`
  text-align: center;
  
  .label {
    color: #94a3b8;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }
  
  .value {
    color: #f1f5f9;
    font-size: 1.5rem;
    font-weight: 600;
  }
`;

const ProtocolGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const ProtocolCard = styled(motion.div)<{ isOptimal?: boolean }>`
  background: ${props => props.isOptimal 
    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
    : 'rgba(255, 255, 255, 0.05)'
  };
  border: 1px solid ${props => props.isOptimal 
    ? 'rgba(34, 197, 94, 0.5)' 
    : 'rgba(255, 255, 255, 0.1)'
  };
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  
  ${props => props.isOptimal && `
    &::before {
      content: '✓ OPTIMAL';
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #22c55e;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }
  `}
  
  h3 {
    color: #f1f5f9;
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
  
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    
    .stat {
      .label {
        color: #64748b;
        font-size: 0.75rem;
        margin-bottom: 0.25rem;
      }
      
      .value {
        color: #f1f5f9;
        font-size: 1rem;
        font-weight: 600;
      }
    }
  }
`;

const RebalanceAlert = styled(motion.div)`
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%);
  border: 1px solid rgba(251, 146, 60, 0.5);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .content {
    flex: 1;
    
    h3 {
      color: #fb923c;
      margin-bottom: 0.5rem;
    }
    
    p {
      color: #fed7aa;
      font-size: 0.875rem;
    }
  }
  
  button {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.4);
    }
  }
`;

interface ProtocolData {
  name: string;
  apy: number;
  tvl: number;
  utilization: number;
  score: number;
  isOptimal: boolean;
}

export default function AIOptimization({ account }: { account: string | null }) {
  const [protocols, setProtocols] = useState<ProtocolData[]>([]);
  const [currentStrategy, setCurrentStrategy] = useState<any>(null);
  const [shouldRebalance, setShouldRebalance] = useState(false);
  const [rebalanceReason, setRebalanceReason] = useState('');
  const [loading, setLoading] = useState(false);
  
  const loadProtocolData = async () => {
    if (!account) return;
    
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACTS.sepolia.strategyEngine,
        STRATEGY_ABI,
        provider
      );
      
      // Load current strategy
      const strategy = await contract.getCurrentStrategy();
      setCurrentStrategy({
        protocol: strategy[0],
        allocation: Number(strategy[1]) / 100,
        apy: Number(strategy[2]) / 100,
        riskScore: Number(strategy[3]),
        confidence: Number(strategy[4]),
        timestamp: Number(strategy[5])
      });
      
      // Check if rebalance needed
      const [needsRebalance, reason] = await contract.shouldRebalance();
      setShouldRebalance(needsRebalance);
      setRebalanceReason(reason);
      
      // Load all protocol data
      const protocolNames = ['Aave', 'Compound', 'Yearn', 'Curve'];
      const protocolsData: ProtocolData[] = [];
      
      for (let i = 1; i <= 4; i++) {
        const data = await contract.protocolData(i);
        const score = calculateScore(
          Number(data.apy),
          Number(data.tvl),
          Number(data.utilization)
        );
        
        protocolsData.push({
          name: protocolNames[i - 1],
          apy: Number(data.apy) / 100,
          tvl: Number(data.tvl) / 1e9, // Convert to billions
          utilization: Number(data.utilization) / 100,
          score,
          isOptimal: protocolNames[i - 1] === strategy[0]
        });
      }
      
      // Sort by score
      protocolsData.sort((a, b) => b.score - a.score);
      setProtocols(protocolsData);
      
    } catch (error) {
      console.error('Failed to load protocol data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateScore = (apy: number, tvl: number, utilization: number): number => {
    // Weighted scoring: 70% APY, 20% TVL, 10% (100 - utilization)
    const apyScore = (apy * 70) / 100;
    const tvlScore = (tvl / 100000000 * 20) / 100;
    const utilizationScore = ((10000 - utilization) * 10) / 10000;
    return Math.round(apyScore + tvlScore + utilizationScore);
  };
  
  useEffect(() => {
    loadProtocolData();
    const interval = setInterval(loadProtocolData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [account]);
  
  const handleRebalance = () => {
    // This would trigger the rebalance through the keeper
    console.log('Triggering rebalance...');
  };
  
  if (!account) {
    return (
      <Container>
        <Header>
          <h1>AI Optimization</h1>
          <p>Connect your wallet to view AI insights</p>
        </Header>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <h1>AI-Powered Optimization</h1>
        <p>Real-time yield optimization using machine learning</p>
      </Header>
      
      {shouldRebalance && (
        <RebalanceAlert
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="content">
            <h3>Rebalance Opportunity Detected</h3>
            <p>{rebalanceReason}</p>
          </div>
          <button onClick={handleRebalance}>
            Execute Rebalance
          </button>
        </RebalanceAlert>
      )}
      
      <AIInsightCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2><Brain size={24} /> AI Analysis</h2>
        
        {currentStrategy && (
          <>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
              Current strategy is allocated to <strong>{currentStrategy.protocol}</strong> with{' '}
              <strong>{currentStrategy.confidence}%</strong> confidence score.
            </p>
            
            <MetricGrid>
              <Metric>
                <div className="label">Current APY</div>
                <div className="value">{currentStrategy.apy.toFixed(2)}%</div>
              </Metric>
              <Metric>
                <div className="label">Risk Score</div>
                <div className="value">{currentStrategy.riskScore}/100</div>
              </Metric>
              <Metric>
                <div className="label">Allocation</div>
                <div className="value">{currentStrategy.allocation}%</div>
              </Metric>
              <Metric>
                <div className="label">Last Update</div>
                <div className="value">
                  {new Date(currentStrategy.timestamp * 1000).toLocaleTimeString()}
                </div>
              </Metric>
            </MetricGrid>
          </>
        )}
      </AIInsightCard>
      
      <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={24} /> Protocol Analysis
      </h2>
      
      <ProtocolGrid>
        {protocols.map((protocol, index) => (
          <ProtocolCard
            key={protocol.name}
            isOptimal={protocol.isOptimal}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <h3>{protocol.name}</h3>
            <div className="stats">
              <div className="stat">
                <div className="label">APY</div>
                <div className="value">{protocol.apy.toFixed(2)}%</div>
              </div>
              <div className="stat">
                <div className="label">TVL</div>
                <div className="value">${protocol.tvl.toFixed(1)}B</div>
              </div>
              <div className="stat">
                <div className="label">Utilization</div>
                <div className="value">{protocol.utilization.toFixed(1)}%</div>
              </div>
              <div className="stat">
                <div className="label">AI Score</div>
                <div className="value">{protocol.score}</div>
              </div>
            </div>
          </ProtocolCard>
        ))}
      </ProtocolGrid>
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={loadProtocolData}
          disabled={loading}
          style={{
            padding: '0.75rem 2rem',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: '0 auto'
          }}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      
      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
}