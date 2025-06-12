// frontend/components/ExecutionFlow.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Loader } from 'lucide-react';

const FlowContainer = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border-radius: 20px;
  padding: 2rem;
  margin: 2rem 0;
`;

const Step = styled(motion.div)<{ active?: boolean; completed?: boolean }>`
  display: flex;
  align-items: center;
  padding: 1.5rem;
  margin: 0.5rem 0;
  background: ${props => 
    props.completed ? 'rgba(0, 255, 136, 0.1)' :
    props.active ? 'rgba(0, 212, 255, 0.1)' : 
    'rgba(255, 255, 255, 0.02)'};
  border: 2px solid ${props =>
    props.completed ? '#00ff88' :
    props.active ? '#00d4ff' :
    'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  transition: all 0.3s ease;

  .icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${props =>
      props.completed ? '#00ff88' :
      props.active ? '#00d4ff' :
      'rgba(255, 255, 255, 0.1)'};
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
  }

  .content {
    flex: 1;
    
    h4 {
      margin: 0;
      color: ${props => props.active ? '#00d4ff' : '#fff'};
    }
    
    p {
      margin: 0.25rem 0 0 0;
      color: #888;
      font-size: 0.9rem;
    }
  }

  .status {
    font-weight: bold;
    color: ${props =>
      props.completed ? '#00ff88' :
      props.active ? '#00d4ff' :
      '#666'};
  }
`;

interface ExecutionStep {
  id: string;
  title: string;
  description: string;
  duration: number;
}

const EXECUTION_STEPS: ExecutionStep[] = [
  {
    id: 'analyze',
    title: 'AI Analysis',
    description: 'Analyzing yield opportunities across 5 chains',
    duration: 3000
  },
  {
    id: 'approve',
    title: 'Token Approval',
    description: 'Approving USDC for withdrawal',
    duration: 4000
  },
  {
    id: 'withdraw',
    title: 'Withdraw from Compound',
    description: 'Withdrawing $10,000 USDC from Ethereum',
    duration: 5000
  },
  {
    id: 'bridge',
    title: 'Cross-Chain Transfer',
    description: 'Bridging via Chainlink CCIP to Arbitrum',
    duration: 8000
  },
  {
    id: 'deposit',
    title: 'Deposit to GMX',
    description: 'Depositing to higher yield protocol',
    duration: 4000
  },
  {
    id: 'complete',
    title: 'Optimization Complete',
    description: 'New APY: 21.2% (+12.5%)',
    duration: 2000
  }
];

interface ExecutionFlowProps {
  onComplete: () => void;
}

export const ExecutionFlow: React.FC<ExecutionFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    const executeSteps = async () => {
      for (let i = 0; i < EXECUTION_STEPS.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, EXECUTION_STEPS[i].duration));
        setCompletedSteps(prev => [...prev, EXECUTION_STEPS[i].id]);
      }
      
      // Wait a bit before calling onComplete
      setTimeout(onComplete, 1000);
    };

    executeSteps();
  }, [onComplete]);

  return (
    <FlowContainer>
      <h2>Executing AI Strategy</h2>
      
      <AnimatePresence>
        {EXECUTION_STEPS.map((step, index) => (
          <Step
            key={step.id}
            active={currentStep === index}
            completed={completedSteps.includes(step.id)}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="icon">
              {completedSteps.includes(step.id) ? (
                <Check size={20} color="#000" />
              ) : currentStep === index ? (
                <Loader size={20} color="#000" className="animate-spin" />
              ) : (
                <ArrowRight size={20} color="#fff" />
              )}
            </div>
            
            <div className="content">
              <h4>{step.title}</h4>
              <p>{step.description}</p>
            </div>
            
            <div className="status">
              {completedSteps.includes(step.id) ? 'Complete' :
               currentStep === index ? 'Processing...' :
               'Pending'}
            </div>
          </Step>
        ))}
      </AnimatePresence>
      
      {completedSteps.length === EXECUTION_STEPS.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            marginTop: '2rem',
            padding: '2rem',
            background: 'linear-gradient(45deg, #00ff88, #00d4ff)',
            borderRadius: '12px',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}
        >
          ✅ Strategy Executed Successfully!
          <br />
          Profit: +$247.50 (Est. Annual: +$9,012)
        </motion.div>
      )}
    </FlowContainer>
  );
};

export default ExecutionFlow;