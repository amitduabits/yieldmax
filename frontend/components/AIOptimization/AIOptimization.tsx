// components/AIOptimization/AIOptimization.tsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ENHANCED_CONTRACTS, ENHANCED_STRATEGY_ABI, ORACLE_MANAGER_ABI } from '../../lib/contracts/enhanced-contracts';

interface Protocol {
  name: string;
  apy: number;
  tvl: number;
  utilization: number;
  risk: string;
  lastUpdate: Date;
  address: string;
}

interface OptimalStrategy {
  protocol: string;
  apy: number;
  confidence: number;
  estimatedYearly: string;
  riskScore: number;
}

export default function AIOptimization({ account, userBalance }: { account: string | null; userBalance: number }) {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [optimalStrategy, setOptimalStrategy] = useState<OptimalStrategy | null>(null);
  const [riskTolerance, setRiskTolerance] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');

  const loadProtocolData = async () => {
    if (!account) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const strategyEngine = new ethers.Contract(
        ENHANCED_CONTRACTS.sepolia.strategyEngine,
        ENHANCED_STRATEGY_ABI,
        provider
      );
      const oracleManager = new ethers.Contract(
        ENHANCED_CONTRACTS.sepolia.oracleManager,
        ORACLE_MANAGER_ABI,
        provider
      );

      // Get yield data
      const yieldData = await oracleManager.getLatestYieldData();
      const currentStrategy = await strategyEngine.getCurrentStrategy();

      // Protocol data
      const protocolList = [
        {
          name: 'Aave V3',
          apy: Number(yieldData.aaveAPY) / 100,
          tvl: 11100,
          utilization: 77.1,
          risk: 'Low',
          lastUpdate: new Date(),
          address: ENHANCED_CONTRACTS.sepolia.mockAave || '0x...'
        },
        {
          name: 'Compound V3',
          apy: Number(yieldData.compoundAPY) / 100,
          tvl: 8880,
          utilization: 77.1,
          risk: 'Low',
          lastUpdate: new Date(),
          address: ENHANCED_CONTRACTS.sepolia.mockCompound || '0x...'
        },
        {
          name: 'Yearn Finance',
          apy: Number(yieldData.yearnAPY) / 100,
          tvl: 5550,
          utilization: 77.1,
          risk: 'Medium',
          lastUpdate: new Date(),
          address: ENHANCED_CONTRACTS.sepolia.mockYearn || '0x...'
        },
        {
          name: 'Curve 3Pool',
          apy: Number(yieldData.curveAPY) / 100,
          tvl: 16650,
          utilization: 77.1,
          risk: 'Low',
          lastUpdate: new Date(),
          address: ENHANCED_CONTRACTS.sepolia.mockCurve || '0x...'
        }
      ];

      setProtocols(protocolList);

      // Calculate optimal strategy
      if (userBalance > 0) {
        const amount = ethers.utils.parseUnits(userBalance.toString(), 6);
        const bestYield = await strategyEngine.getBestYield(amount);
        
        setOptimalStrategy({
          protocol: currentStrategy.protocolName,
          apy: Number(currentStrategy.expectedAPY) / 100,
          confidence: Number(currentStrategy.confidence),
          estimatedYearly: (userBalance * Number(currentStrategy.expectedAPY) / 10000).toFixed(2),
          riskScore: Number(currentStrategy.riskScore)
        });
      }

    } catch (error) {
      console.error("Error loading protocol data:", error);
    }
  };

  const updateYieldData = async () => {
    if (!account) return;

    setLoading(true);
    setUpdateStatus('Fetching latest yield data...');
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const oracleManager = new ethers.Contract(
        ENHANCED_CONTRACTS.sepolia.oracleManager,
        ORACLE_MANAGER_ABI,
        signer
      );

      const tx = await oracleManager.updateYieldData();
      setUpdateStatus('Updating on-chain data...');
      await tx.wait();
      
      setUpdateStatus('Success! Data updated');
      await loadProtocolData();
      
      setTimeout(() => setUpdateStatus(''), 3000);
    } catch (error) {
      console.error("Error updating yield data:", error);
      setUpdateStatus('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProtocolData();
  }, [account, riskTolerance, userBalance]);

  useEffect(() => {
    if (autoRefresh && account) {
      const interval = setInterval(() => {
        loadProtocolData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, account]);

  if (!account) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        <h2 style={{ marginBottom: '20px' }}>🤖 AI Yield Optimization</h2>
        <p>Connect your wallet to view optimization strategies</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center' }}>
          🤖 Real-Time Yield Optimization
        </h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ 
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '5px 15px',
            borderRadius: '20px',
            fontSize: '14px'
          }}>
            USDC: $1.0000
          </span>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
        </div>
      </div>

      {/* Optimal Strategy Card */}
      {optimalStrategy && userBalance > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 5px 15px rgba(16, 185, 129, 0.3)'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '20px' }}>
            🎯 Optimal Strategy for ${userBalance.toLocaleString()}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                Best Protocol
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                {optimalStrategy.protocol}
              </p>
            </div>
            <div>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                Expected APY
              </p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
                {optimalStrategy.apy.toFixed(2)}%
              </p>
            </div>
            <div>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                Confidence Score
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '150px',
                  height: '10px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '5px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${optimalStrategy.confidence}%`,
                    height: '100%',
                    background: '#fff',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <span style={{ fontWeight: 'bold' }}>{optimalStrategy.confidence}%</span>
              </div>
            </div>
            <div>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                Estimated Yearly
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                ${optimalStrategy.estimatedYearly}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Tolerance Slider */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#3b82f6', marginBottom: '15px' }}>
          ⚖️ Risk Tolerance
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#94a3b8' }}>Conservative</span>
          <input
            type="range"
            min="0"
            max="10000"
            value={riskTolerance}
            onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
            style={{
              flex: 1,
              height: '8px',
              background: 'linear-gradient(to right, #10b981 0%, #eab308 50%, #ef4444 100%)',
              outline: 'none',
              borderRadius: '4px'
            }}
          />
          <span style={{ color: '#94a3b8' }}>Aggressive</span>
          <span style={{ 
            color: '#fff', 
            minWidth: '60px',
            textAlign: 'right',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>
            {(riskTolerance / 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Live Protocol Data */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '20px' }}>
          📊 Live Protocol Analysis
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ color: '#94a3b8', padding: '12px', textAlign: 'left' }}>
                  Protocol
                </th>
                <th style={{ color: '#94a3b8', padding: '12px', textAlign: 'right' }}>
                  APY
                </th>
                <th style={{ color: '#94a3b8', padding: '12px', textAlign: 'right' }}>
                  TVL
                </th>
                <th style={{ color: '#94a3b8', padding: '12px', textAlign: 'right' }}>
                  Utilization
                </th>
                <th style={{ color: '#94a3b8', padding: '12px', textAlign: 'right' }}>
                  Risk
                </th>
                <th style={{ color: '#94a3b8', padding: '12px', textAlign: 'right' }}>
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {protocols.map((protocol, idx) => (
                <tr key={idx} style={{ 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  background: optimalStrategy?.protocol === protocol.name ? 
                    'rgba(16, 185, 129, 0.1)' : 'transparent',
                  transition: 'background 0.3s ease'
                }}>
                  <td style={{ 
                    color: '#fff', 
                    padding: '16px 12px',
                    fontWeight: optimalStrategy?.protocol === protocol.name ? 'bold' : 'normal'
                  }}>
                    {protocol.name}
                    {optimalStrategy?.protocol === protocol.name && (
                      <span style={{ 
                        marginLeft: '10px',
                        color: '#10b981',
                        fontSize: '12px'
                      }}>
                        ✓ OPTIMAL
                      </span>
                    )}
                  </td>
                  <td style={{ 
                    color: '#10b981', 
                    padding: '16px 12px', 
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}>
                    {protocol.apy.toFixed(2)}%
                  </td>
                  <td style={{ 
                    color: '#fff', 
                    padding: '16px 12px', 
                    textAlign: 'right' 
                  }}>
                    ${protocol.tvl.toLocaleString()}M
                  </td>
                  <td style={{ 
                    color: '#fff', 
                    padding: '16px 12px', 
                    textAlign: 'right' 
                  }}>
                    {protocol.utilization.toFixed(1)}%
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                    <span style={{
                      color: protocol.risk === 'Low' ? '#10b981' : 
                             protocol.risk === 'Medium' ? '#eab308' : '#ef4444',
                      fontWeight: 'bold',
                      background: protocol.risk === 'Low' ? 'rgba(16, 185, 129, 0.1)' : 
                                 protocol.risk === 'Medium' ? 'rgba(234, 179, 8, 0.1)' : 
                                 'rgba(239, 68, 68, 0.1)',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {protocol.risk}
                    </span>
                  </td>
                  <td style={{ 
                    color: '#94a3b8', 
                    padding: '16px 12px', 
                    textAlign: 'right',
                    fontSize: '12px'
                  }}>
                    {protocol.lastUpdate.toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Message */}
      {updateStatus && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          background: updateStatus.includes('Success') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
          border: `1px solid ${updateStatus.includes('Success') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
          borderRadius: '8px',
          color: updateStatus.includes('Success') ? '#10b981' : '#3b82f6',
          textAlign: 'center'
        }}>
          {updateStatus}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '15px' }}>
        <button
          onClick={updateYieldData}
          disabled={loading}
          style={{
            flex: 1,
            padding: '15px',
            background: loading ? '#4b5563' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? '🔄 Updating...' : '🔄 Update Yields'}
        </button>

        <button
          onClick={() => window.open(`https://sepolia.etherscan.io/address/${ENHANCED_CONTRACTS.sepolia.strategyEngine}`, '_blank')}
          style={{
            padding: '15px 30px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          📋 View Contract
        </button>
      </div>

      <p style={{ 
        color: '#94a3b8', 
        fontSize: '14px', 
        textAlign: 'center',
        marginTop: '20px'
      }}>
        Last updated: {new Date().toLocaleTimeString()} | 
        Next update: {autoRefresh ? 'in 30s' : 'manual'}
      </p>
    </div>
  );
}