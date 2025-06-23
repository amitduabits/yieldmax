import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const StatusCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  
  h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #f1f5f9;
  }
`;

const StatusBadge = styled.div<{ status: 'active' | 'paused' | 'error' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${({ status }) => {
    switch (status) {
      case 'active': return 'rgba(16, 185, 129, 0.2)';
      case 'paused': return 'rgba(251, 146, 60, 0.2)';
      case 'error': return 'rgba(239, 68, 68, 0.2)';
    }
  }};
  color: ${({ status }) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'paused': return '#fb923c';
      case 'error': return '#ef4444';
    }
  }};
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Metric = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  
  .label {
    color: #64748b;
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }
  
  .value {
    color: #f1f5f9;
    font-size: 1.25rem;
    font-weight: 600;
  }
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  td {
    padding: 0.75rem;
    color: #f1f5f9;
    font-size: 0.875rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface AutomationData {
  upkeepId: string;
  status: 'active' | 'paused' | 'error';
  lastExecution: Date;
  nextExecution: Date;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  balance: string;
  minBalance: string;
}

export default function AutomationDashboard({ account }: { account: string | null }) {
  const [automationData, setAutomationData] = useState<AutomationData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (account) {
      loadAutomationData();
    }
  }, [account]);
  
  const loadAutomationData = async () => {
    // Mock data - replace with actual contract calls
    setAutomationData({
      upkeepId: '12345',
      status: 'active',
      lastExecution: new Date(Date.now() - 3600000),
      nextExecution: new Date(Date.now() + 3600000),
      totalExecutions: 156,
      successfulExecutions: 154,
      failedExecutions: 2,
      balance: '8.5',
      minBalance: '5.0'
    });
    
    setHistory([
      {
        id: 1,
        timestamp: new Date(Date.now() - 3600000),
        action: 'Rebalance',
        status: 'Success',
        gasUsed: '145,232',
        txHash: '0x1234...5678'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 7200000),
        action: 'Check',
        status: 'Success',
        gasUsed: '45,232',
        txHash: '0x8765...4321'
      }
    ]);
  };
  
  const handleManualTrigger = async () => {
    setLoading(true);
    // Implement manual trigger logic
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };
  
  if (!account) {
    return (
      <Container>
        <Header>
          <h1>Automation Dashboard</h1>
          <p>Connect your wallet to view automation status</p>
        </Header>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <h1>Automation Dashboard</h1>
        <p>Monitor and manage your automated yield optimization</p>
      </Header>
      
      {automationData && (
        <>
          <StatusCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StatusHeader>
              <h2><Clock size={24} /> Chainlink Automation Status</h2>
              <StatusBadge status={automationData.status}>
                {automationData.status === 'active' && <CheckCircle size={16} />}
                {automationData.status === 'paused' && <AlertCircle size={16} />}
                {automationData.status === 'error' && <AlertCircle size={16} />}
                {automationData.status.toUpperCase()}
              </StatusBadge>
            </StatusHeader>
            
            <MetricsGrid>
              <Metric>
                <div className="label">Upkeep ID</div>
                <div className="value">#{automationData.upkeepId}</div>
              </Metric>
              <Metric>
                <div className="label">Last Execution</div>
                <div className="value">{automationData.lastExecution.toLocaleTimeString()}</div>
              </Metric>
              <Metric>
                <div className="label">Next Execution</div>
                <div className="value">{automationData.nextExecution.toLocaleTimeString()}</div>
              </Metric>
              <Metric>
                <div className="label">Success Rate</div>
                <div className="value">
                  {((automationData.successfulExecutions / automationData.totalExecutions) * 100).toFixed(1)}%
                </div>
              </Metric>
              <Metric>
                <div className="label">LINK Balance</div>
                <div className="value">{automationData.balance} LINK</div>
              </Metric>
              <Metric>
                <div className="label">Total Executions</div>
                <div className="value">{automationData.totalExecutions}</div>
              </Metric>
            </MetricsGrid>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <ActionButton onClick={handleManualTrigger} disabled={loading}>
                <RefreshCw size={16} style={{ marginRight: '0.5rem' }} />
                {loading ? 'Triggering...' : 'Manual Trigger'}
              </ActionButton>
            </div>
          </StatusCard>
          
          <StatusCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 style={{ marginBottom: '1.5rem', color: '#f1f5f9' }}>
              Execution History
            </h2>
            
            <HistoryTable>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Gas Used</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{item.timestamp.toLocaleString()}</td>
                    <td>{item.action}</td>
                    <td>
                      <span style={{ color: item.status === 'Success' ? '#10b981' : '#ef4444' }}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.gasUsed}</td>
                    <td>
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#3b82f6' }}
                      >
                        {item.txHash}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </HistoryTable>
          </StatusCard>
        </>
      )}
    </Container>
  );
}