// components/YieldMaxDashboard.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Zap, 
  AlertCircle,
  ArrowUpRight,
  Loader,
  Check
} from 'lucide-react';
import { useAIOptimization } from '../hooks/useAIOptimization';
import { CrossChainFlow } from './CrossChainFlow';
import { AIInsights } from './AIInsights';
import { LiveYieldChart } from './LiveYieldChart';
import { ExecutionFlow } from './ExecutionFlow';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Styled Components
const DashboardContainer = styled(motion.div)`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
  padding: 2rem;
  position: relative;
  overflow-x: hidden;
`;

const BackgroundAnimation = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
  pointer-events: none;
  
  &::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, #00d4ff 0%, transparent 70%);
    top: -300px;
    right: -300px;
    animation: float 20s infinite ease-in-out;
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #0099ff 0%, transparent 70%);
    bottom: -200px;
    left: -200px;
    animation: float 15s infinite ease-in-out reverse;
  }
  
  @keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(50px, 30px) scale(1.1); }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
`;

const Logo = styled(motion.div)`
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(90deg, #00d4ff, #0099ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &::before {
    content: '⚡';
    font-size: 1.5rem;
  }
`;

const AIBanner = styled(motion.div)`
  background: linear-gradient(90deg, #00d4ff, #0099ff, #0066ff);
  padding: 1.5rem 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: sweep 3s infinite;
  }
  
  @keyframes sweep {
    0% { left: -100%; }
    100% { left: 100%; }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  
  h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #888;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  
  .value {
    font-size: 2rem;
    font-weight: bold;
    color: ${props => props.isProfit ? '#00ff88' : '#fff'};
    margin-bottom: 0.5rem;
  }
  
  .change {
    font-size: 0.9rem;
    color: ${props => props.isPositive ? '#00ff88' : '#ff4444'};
  }
`;

const ProfitCounter = styled(motion.div)`
  text-align: center;
  margin: 3rem 0;
  
  .label {
    font-size: 1.2rem;
    color: #888;
    margin-bottom: 0.5rem;
  }
  
  .value {
    font-size: 4rem;
    font-weight: bold;
    background: linear-gradient(90deg, #00ff88, #00d4ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .subtext {
    font-size: 1rem;
    color: #666;
    margin-top: 0.5rem;
  }
`;

const ActionButton = styled(motion.button)`
  background: linear-gradient(45deg, #00d4ff, #0099ff);
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ExecutionModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
`;

const ModalContent = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a3e 0%, #0f0f23 100%);
  border-radius: 24px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid rgba(0, 212, 255, 0.3);
`;

// Main Component
export const YieldMaxDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { 
    aiRecommendation, 
    isOptimizing, 
    executeStrategy,
    profitEstimate,
    requestImmediateAnalysis 
  } = useAIOptimization();
  
  // State
  const [totalValue, setTotalValue] = useState(10000);
  const [currentProfit, setCurrentProfit] = useState(0);
  const [dailyProfit, setDailyProfit] = useState(0);
  const [currentAPY, setCurrentAPY] = useState(8.2);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  
  // Simulate live profit updates
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      // Calculate profit per second based on APY
      const yearlyProfit = (totalValue * currentAPY) / 100;
      const profitPerSecond = yearlyProfit / 365 / 24 / 60 / 60;
      
      setCurrentProfit(prev => prev + profitPerSecond);
      setDailyProfit(prev => prev + profitPerSecond);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isConnected, totalValue, currentAPY]);
  
  // Handle AI rebalance
  const handleAIRebalance = async () => {
    setShowExecutionModal(true);
    setIsRebalancing(true);
    
    try {
      const result = await executeStrategy();
      
      if (result.success) {
        // Update APY after successful rebalance
        setCurrentAPY(prev => prev + profitEstimate);
        
        // Show success animation
        setTimeout(() => {
          setShowExecutionModal(false);
          setIsRebalancing(false);
          toast.success(`Successfully optimized! New APY: ${(currentAPY + profitEstimate).toFixed(2)}%`, {
            position: "top-center",
            autoClose: 5000,
          });
        }, 2000);
      }
    } catch (error) {
      setShowExecutionModal(false);
      setIsRebalancing(false);
      toast.error('Optimization failed. Please try again.', {
        position: "top-center",
      });
    }
  };
  
  // Calculate stats
  const totalPortfolioValue = totalValue + currentProfit;
  const dailyAPY = (dailyProfit / totalValue) * 365 * 100;
  const monthlyProjection = dailyProfit * 30;
  
  return (
    <DashboardContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackgroundAnimation />
      <ToastContainer theme="dark" />
      
      <Header>
        <Logo
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          YieldMax
        </Logo>
        
        <ConnectButton />
      </Header>
      
      {isConnected ? (
        <>
          {/* AI Recommendation Banner */}
          <AnimatePresence>
            {aiRecommendation && (
              <AIBanner
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                <div>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={24} />
                    AI Optimization Available!
                  </h3>
                  <p style={{ margin: '0.5rem 0 0 0' }}>
                    Potential gain: <strong>+{profitEstimate.toFixed(2)}% APY</strong> | 
                    Confidence: <strong>{aiRecommendation.confidence}%</strong>
                  </p>
                </div>
                <ActionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAIRebalance}
                  disabled={isRebalancing}
                >
                  {isRebalancing ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      Execute Now
                      <ArrowUpRight size={20} />
                    </>
                  )}
                </ActionButton>
              </AIBanner>
            )}
          </AnimatePresence>
          
          {/* Profit Counter */}
          <ProfitCounter
            animate={{ 
              scale: currentProfit > 100 ? [1, 1.02, 1] : 1 
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="label">Today's Profit</div>
            <div className="value">+${currentProfit.toFixed(2)}</div>
            <div className="subtext">
              Projected Monthly: +${monthlyProjection.toFixed(2)}
            </div>
          </ProfitCounter>
          
          {/* Stats Grid */}
          <StatsGrid>
            <StatCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <h3><DollarSign size={20} /> Total Value</h3>
              <div className="value">${totalPortfolioValue.toFixed(2)}</div>
              <div className="change">+{((currentProfit / totalValue) * 100).toFixed(3)}%</div>
            </StatCard>
            
            <StatCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              isProfit
            >
              <h3><TrendingUp size={20} /> Current APY</h3>
              <div className="value">{currentAPY.toFixed(2)}%</div>
              <div className="change">Effective: {dailyAPY.toFixed(2)}%</div>
            </StatCard>
            
            <StatCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <h3><Activity size={20} /> Active Chains</h3>
              <div className="value">3</div>
              <div className="change">ETH, ARB, POLY</div>
            </StatCard>
            
            <StatCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
            >
              <h3><AlertCircle size={20} /> Risk Score</h3>
              <div className="value">Low</div>
              <div className="change" style={{ color: '#00ff88' }}>
                Diversified across protocols
              </div>
            </StatCard>
          </StatsGrid>
          
          {/* Cross-Chain Flow Visualization */}
          <CrossChainFlow isActive={isRebalancing} />
          
          {/* AI Insights */}
          <AIInsights 
            totalValue={totalPortfolioValue}
            recommendations={aiRecommendation}
          />
          
          {/* Live Yield Chart */}
          <LiveYieldChart />
          
          {/* Execution Modal */}
          <AnimatePresence>
            {showExecutionModal && (
              <ExecutionModal
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ModalContent
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <ExecutionFlow onComplete={() => {
                    // Execution complete
                  }} />
                </ModalContent>
              </ExecutionModal>
            )}
          </AnimatePresence>
          
          {/* Manual Analysis Button */}
          {!aiRecommendation && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <ActionButton
                onClick={requestImmediateAnalysis}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Activity size={20} />
                Run AI Analysis Now
              </ActionButton>
            </div>
          )}
        </>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '10rem',
          color: '#888'
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Welcome to YieldMax
          </h2>
          <p style={{ marginBottom: '2rem' }}>
            Connect your wallet to start earning optimized yields across chains
          </p>
        </div>
      )}
    </DashboardContainer>
  );
};

export default YieldMaxDashboard;