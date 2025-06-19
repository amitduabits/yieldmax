// components/EnhancedDashboard.jsx
import React from 'react';
import styled from 'styled-components';
import { useEnhancedStrategy } from '../hooks/useEnhancedStrategy';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Card = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #2d3748;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.gradient || 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'};
  }
`;

const CardTitle = styled.h3`
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetricValue = styled.div`
  color: ${props => props.color || '#48bb78'};
  font-size: ${props => props.size || '32px'};
  font-weight: 700;
  margin: 8px 0;
`;

const MetricLabel = styled.div`
  color: #a0aec0;
  font-size: 14px;
  margin-top: 8px;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    if (props.status === 'optimal') return 'rgba(72, 187, 120, 0.2)';
    if (props.status === 'rebalance') return 'rgba(245, 101, 101, 0.2)';
    return 'rgba(160, 174, 192, 0.2)';
  }};
  color: ${props => {
    if (props.status === 'optimal') return '#48bb78';
    if (props.status === 'rebalance') return '#f56565';
    return '#a0aec0';
  }};
  border: 1px solid ${props => {
    if (props.status === 'optimal') return 'rgba(72, 187, 120, 0.3)';
    if (props.status === 'rebalance') return 'rgba(245, 101, 101, 0.3)';
    return 'rgba(160, 174, 192, 0.3)';
  }};
`;

const ProtocolTable = styled.div`
  margin-top: 20px;
`;

const ProtocolRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #2d3748;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }

  &.selected {
    background: rgba(72, 187, 120, 0.1);
    border-radius: 8px;
    padding: 12px;
    margin: 4px 0;
  }
`;

const ProtocolName = styled.div`
  color: #e2e8f0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProtocolAPY = styled.div`
  color: ${props => props.isSelected ? '#48bb78' : '#cbd5e0'};
  font-weight: ${props => props.isSelected ? '700' : '500'};
  font-size: 16px;
`;

const SelectedBadge = styled.span`
  background: #48bb78;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #4a5568;
  border-radius: 50%;
  border-top-color: #667eea;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const RefreshButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 8px 16px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(245, 101, 101, 0.1);
  border: 1px solid rgba(245, 101, 101, 0.3);
  color: #f56565;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

export const EnhancedDashboard = () => {
  const {
    currentAPY,
    bestProtocol,
    riskScore,
    confidence,
    shouldRebalance,
    rebalanceReason,
    totalAssets,
    userBalance,
    protocolYields,
    isLoading,
    isDataFresh,
    lastUpdate,
    error,
    refreshData,
    executeStrategyUpdate,
    protocolCount
  } = useEnhancedStrategy();

  if (error) {
    return (
      <DashboardContainer>
        <Card>
          <ErrorMessage>
            ⚠️ Error loading enhanced strategy data: {error}
          </ErrorMessage>
          <RefreshButton onClick={refreshData}>
            Retry
          </RefreshButton>
        </Card>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* Current Strategy Overview */}
      <Card gradient="linear-gradient(90deg, #48bb78 0%, #38a169 100%)">
        <CardTitle>🎯 AI Selected Strategy</CardTitle>
        <MetricValue size="28px" color="#48bb78">
          {currentAPY.toFixed(2)}% APY
        </MetricValue>
        <MetricLabel>
          via {bestProtocol} • Risk Score: {riskScore}/100
        </MetricLabel>
        <div style={{ marginTop: '12px' }}>
          <StatusBadge status={shouldRebalance ? 'rebalance' : 'optimal'}>
            {shouldRebalance ? '🔄 Rebalance Available' : '✅ Currently Optimal'}
          </StatusBadge>
        </div>
      </Card>

      {/* Portfolio Value */}
      <Card gradient="linear-gradient(90deg, #667eea 0%, #764ba2 100%)">
        <CardTitle>💰 Portfolio Value</CardTitle>
        <MetricValue color="#667eea">
          ${parseFloat(totalAssets).toFixed(2)}
        </MetricValue>
        <MetricLabel>
          Your Balance: ${parseFloat(userBalance).toFixed(2)} USDC
        </MetricLabel>
      </Card>

      {/* AI Confidence & Risk */}
      <Card gradient="linear-gradient(90deg, #ed8936 0%, #dd6b20 100%)">
        <CardTitle>🧠 AI Analysis</CardTitle>
        <MetricValue color="#ed8936" size="24px">
          {confidence}% Confidence
        </MetricValue>
        <MetricLabel>
          Risk Level: {riskScore <= 30 ? 'Low' : riskScore <= 60 ? 'Medium' : 'High'} ({riskScore}/100)
        </MetricLabel>
      </Card>

      {/* System Status */}
      <Card gradient="linear-gradient(90deg, #38b2ac 0%, #319795 100%)">
        <CardTitle>⚡ System Status</CardTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          {isLoading ? <LoadingSpinner /> : <div style={{ color: '#48bb78' }}>●</div>}
          <span style={{ color: '#e2e8f0' }}>
            {isLoading ? 'Updating...' : isDataFresh ? 'Live Data' : 'Stale Data'}
          </span>
        </div>
        <MetricLabel>
          {protocolCount} Protocols Active • Last Update: {lastUpdate}
        </MetricLabel>
        <RefreshButton 
          onClick={refreshData} 
          disabled={isLoading}
          style={{ marginTop: '12px' }}
        >
          {isLoading ? <LoadingSpinner /> : '🔄'} Refresh
        </RefreshButton>
      </Card>

      {/* Live Protocol Analysis */}
      <Card style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <CardTitle>📊 Live Protocol Analysis</CardTitle>
          {shouldRebalance && (
            <RefreshButton onClick={executeStrategyUpdate}>
              🚀 Execute Rebalance
            </RefreshButton>
          )}
        </div>
        
        <ProtocolTable>
          <ProtocolRow style={{ fontWeight: '600', color: '#a0aec0', fontSize: '12px' }}>
            <div>PROTOCOL</div>
            <div>APY</div>
            <div>RISK</div>
            <div>STATUS</div>
          </ProtocolRow>

          {[
            { name: 'Aave V3', key: 'aave', risk: 'Low' },
            { name: 'Compound V3', key: 'compound', risk: 'Low' },
            { name: 'Yearn Finance', key: 'yearn', risk: 'Medium' },
            { name: 'Curve 3Pool', key: 'curve', risk: 'Low-Medium' }
          ].map(protocol => {
            const isSelected = bestProtocol.toLowerCase() === protocol.key || 
                             bestProtocol.toLowerCase().includes(protocol.key);
            
            return (
              <ProtocolRow 
                key={protocol.key} 
                className={isSelected ? 'selected' : ''}
              >
                <ProtocolName>
                  {protocol.name}
                  {isSelected && <SelectedBadge>SELECTED</SelectedBadge>}
                </ProtocolName>
                <ProtocolAPY isSelected={isSelected}>
                  {protocolYields[protocol.key].toFixed(2)}%
                </ProtocolAPY>
                <div style={{ color: '#a0aec0' }}>{protocol.risk}</div>
                <div style={{ color: isSelected ? '#48bb78' : '#a0aec0' }}>
                  {isSelected ? '✅ Active' : '⚪ Available'}
                </div>
              </ProtocolRow>
            );
          })}
        </ProtocolTable>

        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: 'rgba(72, 187, 120, 0.1)', 
          borderRadius: '8px',
          border: '1px solid rgba(72, 187, 120, 0.2)'
        }}>
          <div style={{ color: '#48bb78', fontWeight: '600', marginBottom: '8px' }}>
            🎯 AI Recommendation: {bestProtocol} at {currentAPY.toFixed(2)}% APY
          </div>
          <div style={{ color: '#a0aec0', fontSize: '14px' }}>
            {rebalanceReason} • Confidence: {confidence}% • Risk Score: {riskScore}/100
          </div>
        </div>
      </Card>
    </DashboardContainer>
  );
};