import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const STRATEGY_ENGINE_ADDRESS = "0x51Ae3bf6A3f38d6c6cF503aF3b8d04B0C878f881";

const STRATEGY_ENGINE_ABI = [
  "function updateYieldData() external returns (bool)",
  "function getOptimalStrategy(uint256 amount, uint256 riskTolerance) external view returns (address bestProtocol, uint256 expectedApy, uint256 confidence)",
  "function getActiveProtocols() external view returns (address[] addresses, string[] names, uint256[] apys, uint256[] tvls)",
  "function getUSDCPrice() external view returns (int256)",
  "function currentYields(address) external view returns (uint256 apy, uint256 tvl, uint256 utilizationRate, uint256 timestamp)"
];

export default function EnhancedAIOptimization({ signer, userBalance }) {
  const [protocols, setProtocols] = useState([]);
  const [optimalStrategy, setOptimalStrategy] = useState(null);
  const [riskTolerance, setRiskTolerance] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [usdcPrice, setUsdcPrice] = useState(1.0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load protocol data
  const loadProtocolData = async () => {
    if (!signer) return;

    try {
      const strategy = new ethers.Contract(
        STRATEGY_ENGINE_ADDRESS,
        STRATEGY_ENGINE_ABI,
        signer
      );

      // Get active protocols
      const protocolData = await strategy.getActiveProtocols();
      const protocolList = [];

      for (let i = 0; i < protocolData.names.length; i++) {
        const yieldData = await strategy.currentYields(protocolData.addresses[i]);
        
        protocolList.push({
          address: protocolData.addresses[i],
          name: protocolData.names[i],
          apy: protocolData.apys[i].toNumber() / 100,
          tvl: parseFloat(ethers.utils.formatUnits(protocolData.tvls[i], 6)),
          utilizationRate: yieldData.utilizationRate.toNumber() / 100,
          lastUpdate: new Date(yieldData.timestamp.toNumber() * 1000),
          risk: _calculateRiskLevel(protocolData.names[i])
        });
      }

      setProtocols(protocolList);

      // Get USDC price
      const price = await strategy.getUSDCPrice();
      setUsdcPrice(price.toNumber() / 1e8);

      // Calculate optimal strategy
      if (userBalance > 0) {
        const amount = ethers.utils.parseUnits(userBalance.toString(), 6);
        const optimal = await strategy.getOptimalStrategy(amount, riskTolerance);
        
        const protocolName = protocolList.find(p => 
          p.address.toLowerCase() === optimal.bestProtocol.toLowerCase()
        )?.name || 'Unknown';

        setOptimalStrategy({
          protocol: protocolName,
          address: optimal.bestProtocol,
          apy: optimal.expectedApy.toNumber() / 100,
          confidence: optimal.confidence.toNumber(),
          estimatedYearly: (userBalance * optimal.expectedApy.toNumber() / 10000).toFixed(2)
        });
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error loading protocol data:", error);
    }
  };

  // Update yield data on-chain
  const updateYieldData = async () => {
    if (!signer) return;

    setLoading(true);
    try {
      const strategy = new ethers.Contract(
        STRATEGY_ENGINE_ADDRESS,
        STRATEGY_ENGINE_ABI,
        signer
      );

      const tx = await strategy.updateYieldData();
      await tx.wait();
      
      // Reload data
      await loadProtocolData();
    } catch (error) {
      console.error("Error updating yield data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate risk level
  const _calculateRiskLevel = (protocolName) => {
    if (protocolName.includes('Aave')) return 'Low';
    if (protocolName.includes('Compound')) return 'Low';
    if (protocolName.includes('Spark')) return 'Medium';
    return 'Unknown';
  };

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && signer) {
      const interval = setInterval(() => {
        loadProtocolData();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, signer]);

  useEffect(() => {
    loadProtocolData();
  }, [signer, riskTolerance]);

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
            USDC: ${usdcPrice.toFixed(4)}
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
      {optimalStrategy && (
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
                  background: optimalStrategy?.address === protocol.address ? 
                    'rgba(16, 185, 129, 0.1)' : 'transparent',
                  transition: 'background 0.3s ease'
                }}>
                  <td style={{ 
                    color: '#fff', 
                    padding: '16px 12px',
                    fontWeight: optimalStrategy?.address === protocol.address ? 'bold' : 'normal'
                  }}>
                    {protocol.name}
                    {optimalStrategy?.address === protocol.address && (
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
                    {protocol.utilizationRate.toFixed(1)}%
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
          onClick={() => window.open(`https://sepolia.etherscan.io/address/${STRATEGY_ENGINE_ADDRESS}`, '_blank')}
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

      {lastUpdate && (
        <p style={{ 
          color: '#94a3b8', 
          fontSize: '14px', 
          textAlign: 'center',
          marginTop: '20px'
        }}>
          Last updated: {lastUpdate.toLocaleTimeString()} | 
          Next update: {autoRefresh ? 'in 30s' : 'manual'}
        </p>
      )}
    </div>
  );
}