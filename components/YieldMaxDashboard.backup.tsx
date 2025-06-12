import React from 'react';
import styled from 'styled-components';

// Styled Components
const DashboardContainer = styled.div`
  min-height: 100vh;
  background: #09090B;
  color: #FAFAFA;
  padding: 2rem;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #FAFAFA 0%, #199BFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
`;

const StatLabel = styled.p`
  color: #A1A1AA;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  color: #FAFAFA;
`;

const YieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

const YieldCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const ProtocolInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ProtocolName = styled.span`
  font-weight: 600;
  color: #FAFAFA;
`;

const ChainName = styled.span`
  font-size: 0.875rem;
  color: #71717A;
`;

const APYValue = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: #22C55E;
`;

const ConnectButton = styled.button`
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  margin-top: 4rem;
  padding: 2rem;
`;

const EmptyStateTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #FAFAFA;
`;

// Mock data
const mockYields = [
  { protocol: 'Aave V3', chain: 'Ethereum', apy: 5.23 },
  { protocol: 'Compound', chain: 'Ethereum', apy: 4.87 },
  { protocol: 'Morpho', chain: 'Base', apy: 6.92 },
  { protocol: 'Spark', chain: 'Gnosis', apy: 7.15 },
];

// Utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

// Main Dashboard Component
export default function YieldMaxDashboard() {
  const [isConnected, setIsConnected] = React.useState(false);
  
  // Mock data
  const totalValue = 125430;
  const avgAPY = mockYields.reduce((acc, y) => acc + y.apy, 0) / mockYields.length;
  const positions = 3;
  const gasPrice = 25;

  return (
    <DashboardContainer>
      <Header>
        <div>
          <Title>YieldMax</Title>
          <p style={{ color: '#71717A' }}>Cross-Chain DeFi Yield Optimizer</p>
        </div>
        <ConnectButton onClick={() => setIsConnected(!isConnected)}>
          {isConnected ? 'Disconnect' : 'Connect Wallet'}
        </ConnectButton>
      </Header>

      {isConnected ? (
        <>
          <StatsGrid>
            <StatCard>
              <StatLabel>Total Portfolio Value</StatLabel>
              <StatValue>{formatCurrency(totalValue)}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Average APY</StatLabel>
              <StatValue>{formatPercentage(avgAPY)}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Active Positions</StatLabel>
              <StatValue>{positions}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Gas Price</StatLabel>
              <StatValue>{gasPrice} Gwei</StatValue>
            </StatCard>
          </StatsGrid>

          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Available Yields</h2>
          <YieldGrid>
            {mockYields.map((yield, index) => (
              <YieldCard key={index}>
                <ProtocolInfo>
                  <ProtocolName>{yield.protocol}</ProtocolName>
                  <ChainName>{yield.chain}</ChainName>
                </ProtocolInfo>
                <APYValue>{formatPercentage(yield.apy)}</APYValue>
              </YieldCard>
            ))}
          </YieldGrid>
        </>
      ) : (
        <EmptyState>
          <EmptyStateTitle>Connect your wallet to get started</EmptyStateTitle>
          <ConnectButton onClick={() => setIsConnected(true)}>
            Connect Wallet
          </ConnectButton>
        </EmptyState>
      )}
    </DashboardContainer>
  );
}