import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Line } from 'react-chartjs-2';
import { formatUnits } from 'ethers/lib/utils';

const DashboardContainer = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 24px;
  margin: 24px 0;
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin: 12px 0;
`;

const MetricValue = styled.h2`
  color: #4CAF50;
  font-size: 36px;
  margin: 8px 0;
`;

const MetricLabel = styled.p`
  color: #888;
  font-size: 14px;
`;

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalDeposits: 0,
    totalUsers: 0,
    crossChainVolume: 0,
    avgGasCost: 0,
    totalYieldGenerated: 0
  });
  
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    // Fetch metrics every 30 seconds
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/monitoring/metrics');
        const data = await response.json();
        setMetrics(data.metrics);
        setEvents(data.recentEvents);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <DashboardContainer>
      <h2>📊 YieldMax Analytics</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <MetricCard>
          <MetricLabel>Total Value Locked</MetricLabel>
          <MetricValue>${(metrics.totalDeposits / 1e6).toFixed(2)}M</MetricValue>
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>Active Users</MetricLabel>
          <MetricValue>{metrics.totalUsers.toLocaleString()}</MetricValue>
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>Cross-Chain Volume (24h)</MetricLabel>
          <MetricValue>${(metrics.crossChainVolume / 1e6).toFixed(2)}M</MetricValue>
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>Avg Gas Cost Saved</MetricLabel>
          <MetricValue>{metrics.avgGasCost}%</MetricValue>
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>Total Yield Generated</MetricLabel>
          <MetricValue>${(metrics.totalYieldGenerated / 1e6).toFixed(2)}M</MetricValue>
        </MetricCard>
      </div>
      
      <h3 style={{ marginTop: '32px' }}>Recent Activity</h3>
      <div style={{ maxHeight: '300px', overflow: 'auto' }}>
        {events.map((event: any, index: number) => (
          <div key={index} style={{ 
            padding: '12px', 
            background: 'rgba(255,255,255,0.03)', 
            margin: '8px 0',
            borderRadius: '8px' 
          }}>
            <span style={{ color: '#4CAF50' }}>{event.type}</span> - 
            {event.network} - ${formatUnits(event.amount, 6)}
          </div>
        ))}
      </div>
    </DashboardContainer>
  );
};