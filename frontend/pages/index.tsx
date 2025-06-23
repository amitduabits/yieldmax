import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import styled from 'styled-components';

// Dynamic imports to avoid SSR issues
const Portfolio = dynamic(() => import('../components/Portfolio/Portfolio'), {
  ssr: false,
});

const AIOptimization = dynamic(() => import('../components/AIOptimization/AIOptimization'), {
  ssr: false,
});

const CrossChainDashboard = dynamic(() => import('../components/CrossChain/CrossChainDashboard'), {
  ssr: false,
});

const AppContainer = styled.div`
  min-height: 100vh;
  background: #0f172a;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #1e293b;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 50;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  
  span {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const NavTabs = styled.nav`
  display: flex;
  gap: 0.5rem;
`;

const TabButton = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${({ active }) => active 
    ? 'rgba(59, 130, 246, 0.2)' 
    : 'transparent'
  };
  border: 1px solid ${({ active }) => active 
    ? 'rgba(59, 130, 246, 0.5)' 
    : 'transparent'
  };
  border-radius: 0.5rem;
  color: ${({ active }) => active ? '#60a5fa' : '#94a3b8'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #60a5fa;
  }
`;

type TabType = 'portfolio' | 'ai' | 'crosschain';

export default function Home() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  
  const renderContent = () => {
    switch (activeTab) {
      case 'portfolio':
        return <Portfolio />;
      case 'ai':
        return <AIOptimization account={address} />;
      case 'crosschain':
        return <CrossChainDashboard account={address} />;
      default:
        return <Portfolio />;
    }
  };
  
  return (
    <AppContainer>
      <Header>
        <Logo>
          ⚡ <span>YieldMax</span>
        </Logo>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <NavTabs>
            <TabButton 
              active={activeTab === 'portfolio'} 
              onClick={() => setActiveTab('portfolio')}
            >
              📊 Portfolio
            </TabButton>
            <TabButton 
              active={activeTab === 'ai'} 
              onClick={() => setActiveTab('ai')}
            >
              🧠 AI Optimization
            </TabButton>
            <TabButton 
              active={activeTab === 'crosschain'} 
              onClick={() => setActiveTab('crosschain')}
            >
              🔗 Cross-Chain
            </TabButton>
          </NavTabs>
          
          <ConnectButton />
        </div>
      </Header>
      
      <main>
        {renderContent()}
      </main>
    </AppContainer>
  );
}