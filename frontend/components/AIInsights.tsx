// components/AIInsights.tsx
import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Zap } from 'lucide-react';

const InsightsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
`;

const InsightCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    color: #00d4ff;
  }
  
  .prediction {
    font-size: 2rem;
    font-weight: bold;
    color: #00ff88;
    margin: 1rem 0;
  }
  
  .confidence {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #888;
  }
`;

const ActionButton = styled(motion.button)`
  background: linear-gradient(45deg, #00d4ff, #0099ff);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
`;

export const AIInsights: React.FC<{
  totalValue: number;
  recommendations: any;
}> = ({ totalValue, recommendations }) => {
  const insights = [
    {
      icon: <TrendingUp />,
      title: 'Yield Spike Detected',
      prediction: '+12.5%',
      confidence: 94,
      protocol: 'Aave V3',
      chain: 'Arbitrum',
      action: 'Move 30% of funds',
    },
    {
      icon: <AlertTriangle />,
      title: 'Risk Alert',
      prediction: '-8.2%',
      confidence: 87,
      protocol: 'Anchor',
      chain: 'Ethereum',
      action: 'Withdraw immediately',
    },
    {
      icon: <Zap />,
      title: 'Gas Optimization',
      prediction: '$45',
      confidence: 99,
      protocol: 'Batch Transaction',
      chain: 'Multi-chain',
      action: 'Execute in 2 hours',
    },
  ];
  
  return (
    <InsightsContainer>
      {insights.map((insight, index) => (
        <InsightCard
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          <h3>
            {insight.icon}
            {insight.title}
          </h3>
          
          <div className="prediction">
            {insight.prediction}
          </div>
          
          <p>{insight.protocol} on {insight.chain}</p>
          
          <div className="confidence">
            <span>AI Confidence:</span>
            <strong>{insight.confidence}%</strong>
          </div>
          
          <ActionButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {insight.action}
          </ActionButton>
        </InsightCard>
      ))}
    </InsightsContainer>
  );
};