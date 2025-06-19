// pages/EnhancedAIOptimization.jsx
import React from 'react';
import styled from 'styled-components';
import { useEnhancedStrategy } from '../hooks/useEnhancedStrategy';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 48px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
`;

const Subtitle = styled.p`
  color: #a0aec0;
  font-size: 18px;
  margin-bottom: 24px;
`;

const StatusCard = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 32px;
  border: 1px solid #2d3748;
  text-align: center;
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.status === 'optimal' 
      ? 'linear-gradient(90deg, #48bb78 0%, #38a169 100%)'
      : 'linear-gradient(90deg, #f56565 0%, #e53e3e 100%)'
    };
  }
`;

const BigMetric = styled.div`
  font-size: 48px;
  font-weight: 700;
  color: ${props => props.color || '#48bb78'};
  margin: 16px 0;
`;

const ProtocolGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const ProtocolCard = styled.div`
  background: ${props => props.isSelected 
    ? 'linear-gradient(135deg, rgba(72, 187, 120, 0.2) 0%, rgba(56, 161, 105, 0.2) 100%)'
    : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
  };
  border: 1px solid ${props => props.isSelected ? '#48bb78' : '#2d3748'};
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  ${props => props.isSelected && `
    &::before {
      content: '✅ SELECTED';
      position: absolute;
      top: 12px;
      right: 12px;
      background: #48bb78;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
    }
  `}
`;

const ProtocolName = styled.h3`
  color: #e2e8f0;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const ProtocolAPY = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${props => props.isSelected ? '#48bb78' : '#667eea'};
  margin-bottom: 8px;
`;

const ProtocolDetails = styled.div`
  color: #a0aec0;
  font-size: 14px;
  line-height: 1.5;
`;

const OptimizationInsights = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #2d3748;
`;

const InsightTitle = styled.h3`
  color: #e2e8f0;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const InsightList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InsightItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
`;

const InsightIcon = styled.div`
  font-size: 24px;
  margin-top: 2px;
`;

const InsightContent = styled.div`
  flex: 1;
`;

const InsightLabel = styled.div`
  color: #e2e8f0;
  font-weight: 600;
  margin-bottom: 4px;
`;

const InsightDescription = styled.div`
  color: #a0aec0;
  font-size: 14px;
  line-height: 1.5;
`;

export const EnhancedAIOptimization = () => {
  const {
    currentAPY,
    bestProtocol,
    riskScore,
    confidence,
    shouldRebalance,
    totalAssets,
    protocolYields,
    isLoading,
    error
  } = useEnhancedStrategy();

  if (error) {
    return (
      <PageContainer>
        <Header>
          <Title>⚠️ AI Optimization Unavailable</Title>
          <Subtitle>Error loading enhanced strategy data: {error}</Subtitle>
        </Header>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <Header>
          <Title>🤖 AI Optimization Loading...</Title>
          <Subtitle>Analyzing DeFi protocols for optimal yield...</Subtitle>
        </Header>
      </PageContainer>
    );
  }

  const protocols = [
    { 
      name: 'Aave V3', 
      key: 'aave', 
      apy: protocolYields.aave,
      risk: 'Low',
      description: 'Leading decentralized lending protocol with institutional adoption'
    },
    { 
      name: 'Compound V3', 
      key: 'compound', 
      apy: protocolYields.compound,
      risk: 'Low',
      description: 'Pioneer in algorithmic money markets with proven track record'
    },
    { 
      name: 'Yearn Finance', 
      key: 'yearn', 
      apy: protocolYields.yearn,
      risk: 'Medium',
      description: 'Automated yield farming with sophisticated strategy optimization'
    },
    { 
      name: 'Curve 3Pool', 
      key: 'curve', 
      apy: protocolYields.curve,
      risk: 'Low-Medium',
      description: 'Specialized stablecoin trading with low impermanent loss'
    }
  ];

  const selectedProtocol = protocols.find(p => 
    bestProtocol.toLowerCase().includes(p.key) || 
    p.key === bestProtocol.toLowerCase()
  );

  const potentialYearlyYield = (parseFloat(totalAssets) * currentAPY) / 100;
  const worstAPY = Math.min(...protocols.map(p => p.apy));
  const worstYearlyYield = (parseFloat(totalAssets) * worstAPY) / 100;
  const yieldImprovement = ((potentialYearlyYield - worstYearlyYield) / worstYearlyYield * 100);

  return (
    <PageContainer>
      <Header>
        <Title>🤖 Real-Time Yield Optimization</Title>
        <Subtitle>AI-powered analysis across {protocols.length} DeFi protocols</Subtitle>
      </Header>

      <StatusCard status={shouldRebalance ? 'rebalance' : 'optimal'}>
        <div style={{ color: '#a0aec0', fontSize: '14px', marginBottom: '8px' }}>
          AI SELECTED STRATEGY
        </div>
        <BigMetric color="#48bb78">
          {currentAPY.toFixed(2)}% APY
        </BigMetric>
        <div style={{ color: '#e2e8f0', fontSize: '18px', marginBottom: '16px' }}>
          via {bestProtocol} • ${potentialYearlyYield.toFixed(2)} potential yearly yield
        </div>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px',
          background: shouldRebalance ? 'rgba(245, 101, 101, 0.2)' : 'rgba(72, 187, 120, 0.2)',
          padding: '8px 16px',
          borderRadius: '20px',
          color: shouldRebalance ? '#f56565' : '#48bb78',
          fontWeight: '600'
        }}>
          {shouldRebalance ? '🔄 Rebalance Available' : '✅ Currently Optimal'}
        </div>
      </StatusCard>

      <ProtocolGrid>
        {protocols.map(protocol => {
          const isSelected = selectedProtocol?.key === protocol.key;
          const yearlyYield = (parseFloat(totalAssets) * protocol.apy) / 100;
          
          return (
            <ProtocolCard key={protocol.key} isSelected={isSelected}>
              <ProtocolName>{protocol.name}</ProtocolName>
              <ProtocolAPY isSelected={isSelected}>
                {protocol.apy.toFixed(2)}%
              </ProtocolAPY>
              <ProtocolDetails>
                <div style={{ marginBottom: '8px' }}>
                  Risk Level: <strong>{protocol.risk}</strong>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  Potential Yearly: <strong>${yearlyYield.toFixed(2)}</strong>
                </div>
                <div>{protocol.description}</div>
              </ProtocolDetails>
            </ProtocolCard>
          );
        })}
      </ProtocolGrid>

      <OptimizationInsights>
        <InsightTitle>
          🧠 AI Optimization Insights
        </InsightTitle>
        
        <InsightList>
          <InsightItem>
            <InsightIcon>🎯</InsightIcon>
            <InsightContent>
              <InsightLabel>Smart Protocol Selection</InsightLabel>
              <InsightDescription>
                AI selected {bestProtocol} with {currentAPY.toFixed(2)}% APY over {protocols.length - 1} alternatives. 
                This choice balances yield potential with risk assessment.
              </InsightDescription>
            </InsightContent>
          </InsightItem>

          <InsightItem>
            <InsightIcon>⚖️</InsightIcon>
            <InsightContent>
              <InsightLabel>Risk-Adjusted Decision</InsightLabel>
              <InsightDescription>
                Risk score of {riskScore}/100 indicates {riskScore <= 30 ? 'low' : riskScore <= 60 ? 'medium' : 'high'} risk exposure. 
                AI prioritizes sustainable returns over maximum yield chasing.
              </InsightDescription>
            </InsightContent>
          </InsightItem>

          <InsightItem>
            <InsightIcon>📈</InsightIcon>
            <InsightContent>
              <InsightLabel>Yield Optimization Impact</InsightLabel>
              <InsightDescription>
                Current strategy outperforms worst option by {yieldImprovement.toFixed(1)}%, 
                generating ${(potentialYearlyYield - worstYearlyYield).toFixed(2)} additional yearly yield.
              </InsightDescription>
            </InsightContent>
          </InsightItem>

          <InsightItem>
            <InsightIcon>🤖</InsightIcon>
            <InsightContent>
              <InsightLabel>AI Confidence Level</InsightLabel>
              <InsightDescription>
                {confidence}% confidence in current strategy based on historical performance, 
                current market conditions, and risk-adjusted analysis.
              </InsightDescription>
            </InsightContent>
          </InsightItem>

          <InsightItem>
            <InsightIcon>🔄</InsightIcon>
            <InsightContent>
              <InsightLabel>Continuous Monitoring</InsightLabel>
              <InsightDescription>
                System continuously monitors all protocols for better opportunities. 
                {shouldRebalance 
                  ? 'A better strategy has been identified and is available for execution.'
                  : 'Current allocation remains optimal based on latest market data.'
                }
              </InsightDescription>
            </InsightContent>
          </InsightItem>
        </InsightList>
      </OptimizationInsights>
    </PageContainer>
  );
};