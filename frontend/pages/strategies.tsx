import React from 'react';
import dynamic from 'next/dynamic';
import Layout from '../components/common/Layout';
import { useAccount } from 'wagmi';
import styled from 'styled-components';

// Dynamic imports to prevent SSR issues
const AIOptimization = dynamic(() => import('../components/AIOptimization/AIOptimization'), {
  ssr: false,
  loading: () => <LoadingMessage>Loading AI Optimization...</LoadingMessage>
});

const AutomationDashboard = dynamic(() => import('../components/Automation/AutomationDashboard'), {
  ssr: false,
  loading: () => <LoadingMessage>Loading Automation Dashboard...</LoadingMessage>
});

const PageContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #1e293b;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 1rem 2rem;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#3b82f6' : 'transparent'};
  color: ${props => props.active ? '#3b82f6' : '#94a3b8'};
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #3b82f6;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
`;

export default function Strategies() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = React.useState<'ai' | 'automation'>('ai');
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <Layout>
        <PageContainer>
          <LoadingMessage>Loading strategies...</LoadingMessage>
        </PageContainer>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <PageContainer>
        <TabContainer>
          <Tab 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')}
          >
            AI Optimization
          </Tab>
          <Tab 
            active={activeTab === 'automation'} 
            onClick={() => setActiveTab('automation')}
          >
            Automation
          </Tab>
        </TabContainer>
        
        {activeTab === 'ai' ? (
        <AIOptimization account={address || null} />
        ) : (
        <AutomationDashboard account={address || null} />
        )}
      </PageContainer>
    </Layout>
  );
}
