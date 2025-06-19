import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const AUTOMATED_STRATEGY_ADDRESS = "0x467B0446a4628F83DEA0fd82cB83f8ef8140fC30";

const AUTOMATION_ABI = [
  "function getAutomationStatus() external view returns (bool needsUpkeep, uint256 nextRebalanceTime, uint256 totalRebalances, address currentProtocol, uint256 currentApy)",
  "function getRebalanceHistory(uint256 limit) external view returns (tuple(uint256 timestamp, address fromProtocol, address toProtocol, uint256 amount, uint256 reason)[])",
  "function checkUpkeep(bytes calldata) external view returns (bool upkeepNeeded, bytes memory performData)",
  "function setRebalanceInterval(uint256 interval) external"
];

export default function AutomationDashboard({ signer }) {
  const [automationStatus, setAutomationStatus] = useState(null);
  const [rebalanceHistory, setRebalanceHistory] = useState([]);
  const [timeToNext, setTimeToNext] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAutomationData = async () => {
    if (!signer) return;

    try {
      const contract = new ethers.Contract(
        AUTOMATED_STRATEGY_ADDRESS,
        AUTOMATION_ABI,
        signer
      );

      // Get automation status
      const status = await contract.getAutomationStatus();
      setAutomationStatus({
        needsUpkeep: status.needsUpkeep,
        nextRebalanceTime: new Date(status.nextRebalanceTime.toNumber() * 1000),
        totalRebalances: status.totalRebalances.toNumber(),
        currentProtocol: status.currentProtocol,
        currentApy: status.currentApy.toNumber() / 100
      });

      // Get rebalance history
      const history = await contract.getRebalanceHistory(5);
      setRebalanceHistory(history.map(event => ({
        timestamp: new Date(event.timestamp.toNumber() * 1000),
        from: event.fromProtocol,
        to: event.toProtocol,
        reason: ['Scheduled', 'Yield Opportunity', 'Risk Mitigation'][event.reason]
      })));
    } catch (error) {
      console.error("Error loading automation data:", error);
    }
  };

  // Update countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (automationStatus?.nextRebalanceTime) {
        const now = new Date();
        const next = automationStatus.nextRebalanceTime;
        const diff = next - now;
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeToNext(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeToNext('Rebalancing soon...');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [automationStatus]);

  useEffect(() => {
    loadAutomationData();
    const interval = setInterval(loadAutomationData, 30000);
    return () => clearInterval(interval);
  }, [signer]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: '20px',
      padding: '30px',
      marginTop: '20px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    }}>
      <h2 style={{ color: '#fff', marginBottom: '30px', display: 'flex', alignItems: 'center' }}>
        ⚡ Chainlink Automation
        <span style={{
          marginLeft: 'auto',
          fontSize: '14px',
          color: '#10b981',
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '5px 15px',
          borderRadius: '20px'
        }}>
          {automationStatus?.needsUpkeep ? '🔴 Needs Rebalance' : '🟢 Optimized'}
        </span>
      </h2>

      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '15px',
          padding: '20px'
        }}>
          <p style={{ color: '#94a3b8', marginBottom: '10px' }}>Next Rebalance</p>
          <h3 style={{ color: '#3b82f6', fontSize: '24px', margin: 0 }}>
            {timeToNext || 'Loading...'}
          </h3>
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '15px',
          padding: '20px'
        }}>
          <p style={{ color: '#94a3b8', marginBottom: '10px' }}>Total Rebalances</p>
          <h3 style={{ color: '#10b981', fontSize: '32px', margin: 0 }}>
            {automationStatus?.totalRebalances || 0}
          </h3>
        </div>

        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '15px',
          padding: '20px'
        }}>
          <p style={{ color: '#94a3b8', marginBottom: '10px' }}>Current APY</p>
          <h3 style={{ color: '#8b5cf6', fontSize: '28px', margin: 0 }}>
            {automationStatus?.currentApy?.toFixed(2) || '0.00'}%
          </h3>
        </div>
      </div>

      {/* Rebalance History */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        padding: '20px'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '20px' }}>
          📊 Rebalance History
        </h3>
        
        {rebalanceHistory.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rebalanceHistory.map((event, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
                padding: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ color: '#fff', margin: 0 }}>
                    {event.timestamp.toLocaleString()}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>
                    Reason: {event.reason}
                  </p>
                </div>
                <div style={{
                  color: '#10b981',
                  fontWeight: 'bold'
                }}>
                  Optimized ✓
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>
            No rebalances yet. First one coming soon!
          </p>
        )}
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#3b82f6', margin: 0 }}>
          ⚡ Powered by Chainlink Automation - Rebalancing 24/7
        </p>
      </div>
    </div>
  );
}