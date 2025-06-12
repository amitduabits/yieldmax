// frontend/components/CrossChainFlow.tsx
import React from 'react';
import styled from 'styled-components';

const FlowContainer = styled.div`
  position: relative;
  height: 400px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  overflow: hidden;
  margin: 2rem 0;
`;

const Chain = styled.div<{ x: number; y: number; color: string }>`
  position: absolute;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  box-shadow: 0 0 30px rgba(0, 200, 255, 0.5);
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  background: ${props => props.color};
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const FlowLine = styled.path`
  stroke: #00d4ff;
  stroke-width: 3;
  fill: none;
  filter: drop-shadow(0 0 10px #00d4ff);
`;

interface CrossChainFlowProps {
  isActive: boolean;
}

export const CrossChainFlow: React.FC<CrossChainFlowProps> = ({ isActive }) => {
  const chains = [
    { id: 'eth', name: 'Ethereum', x: 100, y: 100, color: '#627EEA' },
    { id: 'arb', name: 'Arbitrum', x: 400, y: 100, color: '#28A0F0' },
    { id: 'poly', name: 'Polygon', x: 250, y: 250, color: '#8247E5' }
  ];
  
  return (
    <FlowContainer>
      <svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <FlowLine
          d="M 175 175 Q 250 100 325 175"
          style={{
            strokeDasharray: isActive ? 1000 : 0,
            strokeDashoffset: isActive ? 0 : 1000,
            transition: 'all 3s ease'
          }}
        />
      </svg>
      
      {chains.map((chain) => (
        <Chain
          key={chain.id}
          x={chain.x}
          y={chain.y}
          color={chain.color}
          style={{
            animation: isActive ? 'pulse 2s infinite' : 'none'
          }}
        >
          {chain.name}
        </Chain>
      ))}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </FlowContainer>
  );
};

export default CrossChainFlow;