const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Created: ${filePath}`);
}

// Create basic dashboard component
const dashboardComponent = `import React from 'react';
import styled from 'styled-components';
import { useWeb3 } from '@/hooks/useWeb3';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { formatCurrency, formatPercentage } from '@/utils/format';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const DashboardContainer = styled.div\`
  min-height: 100vh;
  background: #09090B;
  color: #FAFAFA;
  padding: 2rem;
\`;

const Header = styled.header\`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
\`;

const Title = styled.h1\`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #FAFAFA 0%, #199BFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
\`;

const StatsGrid = styled.div\`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
\`;

const StatCard = styled.div\`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
\`;

const StatLabel = styled.p\`
  color: #A1A1AA;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
\`;

const StatValue = styled.h2\`
  font-size: 2rem;
  font-weight: 600;
  color: #FAFAFA;
\`;

const YieldGrid = styled.div\`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
\`;

const YieldCard = styled.div\`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
  }
\`;

const ProtocolInfo = styled.div\`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
\`;

const ProtocolName = styled.span\`
  font-weight: 600;
  color: #FAFAFA;
\`;

const ChainName = styled.span\`
  font-size: 0.875rem;
  color: #71717A;
\`;

const APYValue = styled.span\`
  font-size: 1.5rem;
  font-weight: 700;
  color: #22C55E;
\`;

export default function YieldMaxDashboard() {
  const { account, isConnected } = useWeb3();
  const { yields, portfolio, gasPrice } = useRealTimeData();

  const totalValue = portfolio?.totalValue || 0;
  const avgAPY = yields.length > 0 
    ? yields.reduce((acc, y) => acc + y.apy, 0) / yields.length 
    : 0;

  return (
    <DashboardContainer>
      <Header>
        <div>
          <Title>YieldMax</Title>
          <p style={{ color: '#71717A' }}>Cross-Chain DeFi Yield Optimizer</p>
        </div>
        <ConnectButton />
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
              <StatValue>{portfolio.positions?.length || 0}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Gas Price</StatLabel>
              <StatValue>{gasPrice.toFixed(0)} Gwei</StatValue>
            </StatCard>
          </StatsGrid>

          <h2 style={{ marginBottom: '1rem' }}>Available Yields</h2>
          <YieldGrid>
            {yields.map((yield, index) => (
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
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>Connect your wallet to get started</h2>
          <ConnectButton />
        </div>
      )}
    </DashboardContainer>
  );
}
`;

writeFile('frontend/src/components/Dashboard/YieldMaxDashboard.tsx', dashboardComponent);

// Create globals import for layout
const globalsImport = `import '@/styles/globals.css';
`;

// Update layout.tsx to import globals
const layoutPath = 'frontend/src/app/layout.tsx';
if (fs.existsSync(layoutPath)) {
  let layoutContent = fs.readFileSync(layoutPath, 'utf8');
  if (!layoutContent.includes('globals.css')) {
    layoutContent = globalsImport + layoutContent;
    fs.writeFileSync(layoutPath, layoutContent);
    console.log('✅ Updated layout.tsx with globals import');
  }
}

console.log('✅ Dashboard component created!');