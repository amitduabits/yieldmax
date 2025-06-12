// frontend/components/LiveYieldChart.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const ChartContainer = styled(motion.div)`
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #00d4ff, #0099ff, #00d4ff);
    border-radius: 16px;
    opacity: 0.5;
    z-index: -1;
    animation: pulse 3s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }
`;

const LiveIndicator = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #00ff88;
  font-weight: bold;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    background: #00ff88;
    border-radius: 50%;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

const YieldMetric = styled(motion.div)<{ isPositive?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 1rem;

  .protocol {
    font-weight: bold;
    color: #00d4ff;
  }

  .apy {
    font-size: 1.5rem;
    font-weight: bold;
    color: #00ff88;
  }

  .change {
    font-size: 0.9rem;
    color: ${props => props.isPositive ? '#00ff88' : '#ff4444'};
  }
`;

interface YieldData {
  protocol: string;
  chain: string;
  apy: number;
  change: number;
  isSpike?: boolean;
}

export const LiveYieldChart: React.FC = () => {
  const [liveData, setLiveData] = useState<any[]>([]);
  const [topYields, setTopYields] = useState<YieldData[]>([]);

  useEffect(() => {
    // Initialize with mock data
    generateInitialData();

    // Connect to WebSocket for live updates
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'YIELD_UPDATE') {
            updateYieldData(data.payload);
          } else if (data.type === 'YIELD_SPIKE') {
            handleYieldSpike(data.payload);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket closed, reconnecting in 5s...');
          setTimeout(connectWebSocket, 5000);
        };

        return () => ws.close();
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
      }
    };

    const cleanup = connectWebSocket();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const generateInitialData = () => {
    const mockYields: YieldData[] = [
      { protocol: 'Aave V3', chain: 'Arbitrum', apy: 8.2, change: 0.3 },
      { protocol: 'GMX', chain: 'Arbitrum', apy: 15.7, change: -0.5 },
      { protocol: 'Compound', chain: 'Ethereum', apy: 6.8, change: 0.1 },
      { protocol: 'Curve', chain: 'Polygon', apy: 11.3, change: 0.8 },
      { protocol: 'Yearn', chain: 'Ethereum', apy: 12.5, change: -0.2 }
    ];

    setTopYields(mockYields.sort((a, b) => b.apy - a.apy).slice(0, 3));
  };

  const updateYieldData = (data: any) => {
    setLiveData(prev => [...prev.slice(-20), data]);
    
    // Update top yields if necessary
    setTopYields(prev => {
      const updated = [...prev];
      const index = updated.findIndex(y => y.protocol === data.protocol);
      if (index >= 0) {
        updated[index] = { ...updated[index], ...data };
      }
      return updated.sort((a, b) => b.apy - a.apy);
    });
  };

  const handleYieldSpike = (spike: any) => {
    // Animate the spike
    setTopYields(prev => {
      const spikeYield: YieldData = {
        protocol: spike.protocol,
        chain: spike.chain,
        apy: spike.newApy,
        change: spike.newApy - spike.previousApy,
        isSpike: true
      };
      return [spikeYield, ...prev.slice(0, 2)];
    });
  };

  return (
    <ChartContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <LiveIndicator>LIVE</LiveIndicator>
      
      <h2>Top Yield Opportunities</h2>
      
      {topYields.map((yieldItem, index) => (
        <YieldMetric
          key={`${yieldItem.protocol}-${yieldItem.chain}`}
          isPositive={yieldItem.change > 0}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          style={{
            border: yieldItem.isSpike ? '2px solid #00ff88' : 'none',
            animation: yieldItem.isSpike ? 'glow 2s infinite' : 'none'
          }}
        >
          <div>
            <div className="protocol">{yieldItem.protocol}</div>
            <div style={{ fontSize: '0.9rem', color: '#888' }}>{yieldItem.chain}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="apy">{yieldItem.apy.toFixed(2)}%</div>
            <div className="change">
              {yieldItem.change > 0 ? '+' : ''}{yieldItem.change.toFixed(2)}%
            </div>
          </div>
        </YieldMetric>
      ))}
    </ChartContainer>
  );
};

export default LiveYieldChart;