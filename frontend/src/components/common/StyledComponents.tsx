// components/common/StyledComponents.tsx - Complete Styled Components
import styled from 'styled-components';
import { motion } from 'framer-motion';

// Layout Components
export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(55, 65, 81, 0.5);
  position: sticky;
  top: 0;
  z-index: 40;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 1rem;
  }
`;

export const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  span {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

export const NavTabs = styled.nav`
  display: flex;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export const NavTab = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${({ active }) => active ? 'rgba(59, 130, 246, 0.2)' : 'transparent'};
  color: ${({ active }) => active ? '#3B82F6' : '#9CA3AF'};
  border: 1px solid ${({ active }) => active ? 'rgba(59, 130, 246, 0.5)' : 'transparent'};
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #60A5FA;
    border-color: rgba(59, 130, 246, 0.3);
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const MainContent = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

// UI Components
export const Badge = styled.span<{ variant?: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  
  ${({ variant }) => {
    switch (variant) {
      case 'success':
        return `
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        `;
      case 'error':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        `;
      case 'warning':
        return `
          background: rgba(245, 158, 11, 0.1);
          color: #F59E0B;
          border: 1px solid rgba(245, 158, 11, 0.3);
        `;
      default:
        return `
          background: rgba(59, 130, 246, 0.1);
          color: #3B82F6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        `;
    }
  }}
`;

export const ConnectButton = styled.button`
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

// Gas Indicator Component
export const GasIndicator = ({ data }: any) => {
  const currentGas = data?.prices?.ethereum?.current || 0;
  const getGasColor = () => {
    if (currentGas < 30) return '#10B981';
    if (currentGas < 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <GasIndicatorWrapper>
      <GasIcon color={getGasColor()}>⛽</GasIcon>
      <div>
        <GasLabel>Gas</GasLabel>
        <GasValue color={getGasColor()}>{currentGas.toFixed(0)} gwei</GasValue>
      </div>
    </GasIndicatorWrapper>
  );
};

const GasIndicatorWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
`;

const GasIcon = styled.span<{ color: string }>`
  font-size: 1.25rem;
  filter: drop-shadow(0 0 4px ${({ color }) => color});
`;

const GasLabel = styled.span`
  display: block;
  font-size: 0.625rem;
  color: #9CA3AF;
  text-transform: uppercase;
`;

const GasValue = styled.span<{ color: string }>`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ color }) => color};
`;

// Notification Button
export const NotificationButton = () => {
  return (
    <NotificationButtonWrapper>
      <Bell className="w-5 h-5" />
      <NotificationDot />
    </NotificationButtonWrapper>
  );
};

const NotificationButtonWrapper = styled.button`
  position: relative;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #9CA3AF;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }
`;

const NotificationDot = styled.span`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 0.5rem;
  height: 0.5rem;
  background: #EF4444;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.8);
    }
  }
`;

// Wallet Info Component
export const WalletInfo = ({ address }: { address?: string }) => {
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <WalletInfoWrapper>
      <WalletIcon>
        <Wallet className="w-4 h-4" />
      </WalletIcon>
      <WalletAddress>{address ? formatAddress(address) : 'Not Connected'}</WalletAddress>
    </WalletInfoWrapper>
  );
};

const WalletInfoWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 0.5rem;
`;

const WalletIcon = styled.div`
  color: #10B981;
`;

const WalletAddress = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #10B981;
`;

// Empty State Component
export const EmptyState = ({ onConnect }: { onConnect: () => void }) => {
  return (
    <EmptyStateWrapper>
      <EmptyStateContent
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <EmptyStateIcon>
          <Layers className="w-16 h-16 text-blue-500" />
        </EmptyStateIcon>
        <EmptyStateTitle>Welcome to YieldMax</EmptyStateTitle>
        <EmptyStateDescription>
          The most advanced AI-powered cross-chain yield optimizer in DeFi.
          Connect your wallet to start maximizing your yields.
        </EmptyStateDescription>
        <EmptyStateFeatures>
          <Feature>
            <FeatureIcon>
              <Zap className="w-5 h-5" />
            </FeatureIcon>
            <FeatureText>AI-Powered Optimization</FeatureText>
          </Feature>
          <Feature>
            <FeatureIcon>
              <Link className="w-5 h-5" />
            </FeatureIcon>
            <FeatureText>Chainlink CCIP Integration</FeatureText>
          </Feature>
          <Feature>
            <FeatureIcon>
              <Shield className="w-5 h-5" />
            </FeatureIcon>
            <FeatureText>Audited & Secure</FeatureText>
          </Feature>
          <Feature>
            <FeatureIcon>
              <TrendingUp className="w-5 h-5" />
            </FeatureIcon>
            <FeatureText>Real-Time Yield Tracking</FeatureText>
          </Feature>
        </EmptyStateFeatures>
        <ConnectButtonLarge onClick={onConnect}>
          Connect Wallet to Get Started
        </ConnectButtonLarge>
      </EmptyStateContent>
    </EmptyStateWrapper>
  );
};

const EmptyStateWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
`;

const EmptyStateContent = styled(motion.div)`
  text-align: center;
  max-width: 600px;
  padding: 2rem;
`;

const EmptyStateIcon = styled.div`
  margin-bottom: 2rem;
  display: inline-flex;
  padding: 2rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 50%;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: -1px;
    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
    border-radius: 50%;
    padding: 1px;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: exclude;
    mask-composite: exclude;
    opacity: 0.5;
  }
`;

const EmptyStateTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const EmptyStateDescription = styled.p`
  font-size: 1.125rem;
  color: #9CA3AF;
  margin-bottom: 3rem;
  line-height: 1.7;
`;

const EmptyStateFeatures = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
`;

const FeatureIcon = styled.div`
  color: #3B82F6;
`;

const FeatureText = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
`;

const ConnectButtonLarge = styled(ConnectButton)`
  padding: 1rem 2rem;
  font-size: 1rem;
`;

// Import required icons
import { Bell, Wallet, Layers, Zap, Link, Shield, TrendingUp } from 'lucide-react';