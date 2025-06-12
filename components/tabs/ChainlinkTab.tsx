// components/tabs/ChainlinkTab.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Link, GitBranch, Activity, Clock, Shield, Zap,
  ArrowRight, CheckCircle, AlertCircle, DollarSign
} from 'lucide-react';
import styled from 'styled-components';

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const HeroSection = styled.div`
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
  border: 1px solid rgba(37, 99, 235, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ServiceCard = styled(motion.div)<{ status?: string }>`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid ${({ status }) => 
    status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 
    status === 'pending' ? 'rgba(245, 158, 11, 0.3)' : 
    'rgba(255, 255, 255, 0.08)'};
  border-radius: 1rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: ${({ status }) => 
      status === 'active' ? 'radial-gradient(circle, rgba(16, 185, 129, 0.2), transparent)' : 
      status === 'pending' ? 'radial-gradient(circle, rgba(245, 158, 11, 0.2), transparent)' : 
      'transparent'};
  }
`;

const CCIPLanes = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const LaneCard = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${({ active }) => active ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${({ active }) => active ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 0.75rem;
  
  .chain-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
`;

export const ChainlinkTab = ({ chainlinkData, portfolioData }: any) => {
  const [selectedLane, setSelectedLane] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <Container
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Hero Section */}
      <HeroSection>
        <Link className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">Powered by Chainlink</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          YieldMax leverages Chainlink's industry-leading oracle network for secure cross-chain 
          communication, real-time price feeds, and automated yield optimization.
        </p>
      </HeroSection>

      {/* Chainlink Services */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Active Chainlink Services</h3>
        <ServicesGrid>
          {/* CCIP Service */}
          <ServiceCard status="active" whileHover={{ scale: 1.02 }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-blue-400" />
                  Cross-Chain Protocol (CCIP)
                </h4>
                <p className="text-sm text-gray-400 mt-1">Secure cross-chain messaging</p>
              </div>
              <StatusBadge status="active">Active</StatusBadge>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className="text-green-400">Operational</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Messages (24h)</span>
                <span>{chainlinkData?.ccip?.messagesProcessed24h?.toLocaleString() || '15,420'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Value Bridged (24h)</span>
                <span>{formatCurrency(chainlinkData?.ccip?.totalValueBridged24h || 125000000)}</span>
              </div>
            </div>
          </ServiceCard>

          {/* Price Feeds */}
          <ServiceCard status="active" whileHover={{ scale: 1.02 }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Price Feeds
                </h4>
                <p className="text-sm text-gray-400 mt-1">Real-time asset prices</p>
              </div>
              <StatusBadge status="active">Active</StatusBadge>
            </div>
            
            <div className="space-y-3">
              {Object.entries(chainlinkData?.prices || {}).map(([pair, data]: any) => (
                <div key={pair} className="flex justify-between text-sm">
                  <span className="text-gray-400">{pair}</span>
                  <span className="font-medium">{formatCurrency(data.price)}</span>
                </div>
              ))}
            </div>
          </ServiceCard>

          {/* Automation */}
          <ServiceCard status="active" whileHover={{ scale: 1.02 }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Automation (Keepers)
                </h4>
                <p className="text-sm text-gray-400 mt-1">Automated rebalancing</p>
              </div>
              <StatusBadge status="active">Active</StatusBadge>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Active Keepers</span>
                <span>{chainlinkData?.automation?.keepersActive || 12}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Uptime</span>
                <span className="text-green-400">{chainlinkData?.automation?.uptime || 99.9}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Next Execution</span>
                <span>~5 minutes</span>
              </div>
            </div>
          </ServiceCard>

          {/* VRF */}
          <ServiceCard status="pending" whileHover={{ scale: 1.02 }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-400" />
                  VRF (Randomness)
                </h4>
                <p className="text-sm text-gray-400 mt-1">For future features</p>
              </div>
              <StatusBadge status="pending">Coming Soon</StatusBadge>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Verifiable Random Function will be used for fair reward distribution 
                and gamified yield strategies.
              </p>
              <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-xs text-yellow-400">
                  Available in Q2 2025
                </p>
              </div>
            </div>
          </ServiceCard>
        </ServicesGrid>
      </div>

      {/* CCIP Lanes */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Active CCIP Lanes</h3>
        <CCIPLanes>
          {chainlinkData?.ccip?.lanes?.map((lane: any, index: number) => (
            <LaneCard 
              key={index} 
              active={lane.active}
              onClick={() => setSelectedLane(lane)}
            >
              <div className="chain-icon">
                {getChainEmoji(lane.from)}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="chain-icon">
                {getChainEmoji(lane.to)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {lane.from} → {lane.to}
                </p>
                <p className="text-xs text-gray-400">
                  {lane.avgTime || '15 min'}
                </p>
              </div>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </LaneCard>
          ))}
        </CCIPLanes>
      </div>

      {/* Cross-Chain Costs */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Cross-Chain Transfer Costs</h3>
        <StatsGrid>
          {Object.entries(chainlinkData?.ccip?.costs || {}).map(([route, cost]: any) => (
            <StatCard key={route}>
              <p className="text-xs text-gray-400 mb-1">{route}</p>
              <p className="text-lg font-bold">{formatCurrency(cost.totalUSD)}</p>
              <p className="text-xs text-gray-500 mt-1">~{cost.estimatedTime}</p>
            </StatCard>
          ))}
        </StatsGrid>
      </div>

      {/* Integration Benefits */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
        <h3 className="text-xl font-semibold mb-4">How Chainlink Powers YieldMax</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <BenefitItem
            icon={<GitBranch className="w-6 h-6 text-blue-400" />}
            title="Seamless Cross-Chain Yields"
            description="Move funds between chains without leaving the platform using CCIP's secure messaging."
          />
          <BenefitItem
            icon={<Activity className="w-6 h-6 text-green-400" />}
            title="Real-Time Price Accuracy"
            description="Get accurate yield calculations with Chainlink's decentralized price feeds."
          />
          <BenefitItem
            icon={<Clock className="w-6 h-6 text-purple-400" />}
            title="Automated Rebalancing"
            description="Keepers monitor and rebalance your portfolio 24/7 for optimal yields."
          />
          <BenefitItem
            icon={<Shield className="w-6 h-6 text-yellow-400" />}
            title="Security First"
            description="Battle-tested oracle network securing billions in DeFi value."
          />
        </div>
      </div>
    </Container>
  );
};

// Helper Components
const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  
  ${({ status }) => {
    switch (status) {
      case 'active':
        return `
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        `;
      case 'pending':
        return `
          background: rgba(245, 158, 11, 0.1);
          color: #F59E0B;
          border: 1px solid rgba(245, 158, 11, 0.3);
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.1);
          color: #9CA3AF;
          border: 1px solid rgba(156, 163, 175, 0.3);
        `;
    }
  }}
`;

const BenefitItem = ({ icon, title, description }: any) => {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
};

// Helper function
function getChainEmoji(chain: string): string {
  const emojis: Record<string, string> = {
    ethereum: '⟠',
    arbitrum: '🔷',
    polygon: '🟣',
    optimism: '🔴',
    avalanche: '🔺'
  };
  return emojis[chain] || '🌐';
}