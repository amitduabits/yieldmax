import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAccount } from 'wagmi';
import styled from 'styled-components';
import Layout from '../components/common/Layout';

// Dynamic imports to avoid SSR issues
const Portfolio = dynamic(() => import('../components/Portfolio/Portfolio'), {
  ssr: false,
  loading: () => <LoadingSpinner>Loading Portfolio...</LoadingSpinner>
});

const AutomationDashboard = dynamic(() => import('../components/Automation/AutomationDashboard'), {
  ssr: false,
  loading: () => <LoadingSpinner>Loading Automation...</LoadingSpinner>
});

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #64748b;
`;

const TabContainer = styled.div`
  margin-bottom: 2rem;
`;

const TabList = styled.div`
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 2rem;
`;

// Use transient props to avoid DOM warnings
const TabButton = styled.button<{ $active?: boolean }>`
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid ${({ $active }) => $active ? '#3b82f6' : 'transparent'};
  color: ${({ $active }) => $active ? '#3b82f6' : '#64748b'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #3b82f6;
  }
`;

const Content = styled.div`
  animation: fadeIn 0.3s ease-in-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const WelcomeSection = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  
  h1 {
    font-size: 3rem;
    font-weight: bold;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    font-size: 1.25rem;
    color: #94a3b8;
    margin-bottom: 2rem;
  }
`;

type TabType = 'portfolio' | 'automation';

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

  if (!address) {
    return (
      <Layout>
        <WelcomeSection>
          <h1>Welcome to YieldMax</h1>
          <p>Connect your wallet to start optimizing your DeFi yields</p>
        </WelcomeSection>
      </Layout>
    );
  }

  return (
    <Layout>
      <TabContainer>
        <TabList>
          <TabButton 
            $active={activeTab === 'portfolio'} 
            onClick={() => setActiveTab('portfolio')}
          >
            Portfolio
          </TabButton>
          <TabButton 
            $active={activeTab === 'automation'} 
            onClick={() => setActiveTab('automation')}
          >
            Automation
          </TabButton>
        </TabList>
      </TabContainer>

      <Content>
        {activeTab === 'portfolio' && <Portfolio />}
        {activeTab === 'automation' && <AutomationDashboard account={address} />}
      </Content>
    </Layout>
  );
}