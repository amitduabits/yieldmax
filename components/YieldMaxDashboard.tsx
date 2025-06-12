import React from 'react';
import styled from 'styled-components';

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
`;

export default function YieldMaxDashboard() {
  const [isConnected, setIsConnected] = React.useState(false);
  
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
        <StatsGrid>
          <StatCard>
            <StatLabel>Total Portfolio Value</StatLabel>
            <StatValue>$125,430</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Average APY</StatLabel>
            <StatValue>5.79%</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Active Positions</StatLabel>
            <StatValue>3</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Gas Price</StatLabel>
            <StatValue>25 Gwei</StatValue>
          </StatCard>
        </StatsGrid>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>
            Connect your wallet to get started
          </h2>
          <ConnectButton onClick={() => setIsConnected(true)}>
            Connect Wallet
          </ConnectButton>
        </div>
      )}
    </DashboardContainer>
  );
}
