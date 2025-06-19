import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CROSS_CHAIN_ROUTER_ADDRESS = "0x2f9C42AFAF2De4c56Fe37e5fF80a2F80FEc3F589";

const ROUTER_ABI = [
  "function findBestOpportunity(uint256 amount) external view returns (string currentChainName, string targetChainName, uint256 currentApy, uint256 targetApy, uint256 apyImprovement)",
  "function getStats() external view returns (uint256 rebalanceCount, uint256 volume, uint256 chainCount)",
  "function initiateCrossChainTransfer(uint64 targetChain, uint256 amount) external returns (bool)",
  "function getRecentRebalances(uint256 count) external view returns (tuple(uint256 timestamp, string fromChain, string toChain, uint256 amount, uint256 targetApy)[])",
  "function getAllChainData() external view returns (string[] names, uint256[] apys, uint256[] tvls)"
];

const CHAIN_NAMES = {
  "16015286601757825753": { name: "Sepolia", icon: "🔷" },
  "3478487238524512106": { name: "Arbitrum", icon: "🔵" },
  "5224473277236331295": { name: "Optimism", icon: "🔴" },
  "16281711391670634445": { name: "Polygon", icon: "🟣" }
};

export default function CrossChainDashboard({ signer, userBalance }) {
  const [crossChainStats, setCrossChainStats] = useState(null);
  const [bestOpportunity, setBestOpportunity] = useState(null);
  const [rebalanceHistory, setRebalanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');

  const loadCrossChainData = async () => {
    if (!signer) return;

    try {
      const router = new ethers.Contract(
        CROSS_CHAIN_ROUTER_ADDRESS,
        ROUTER_ABI,
        signer
      );

      // Get cross-chain stats
      const stats = await router.getCrossChainStats();
      setCrossChainStats({
        totalRebalances: stats.totalRebalances.toNumber(),
        totalVolume: ethers.utils.formatUnits(stats.totalVolumeRebalanced, 6),
        chains: stats.chains.map((chain, i) => ({
          selector: chain.toString(),
          name: CHAIN_NAMES[chain.toString()]?.name || 'Unknown',
          icon: CHAIN_NAMES[chain.toString()]?.icon || '❓',
          apy: stats.chainApys[i].toNumber() / 100
        }))
      });

      // Find best opportunity
      if (userBalance > 0) {
        const amount = ethers.utils.parseUnits(userBalance.toString(), 6);
        const opp = await router.findBestCrossChainOpportunity(amount);
        
        setBestOpportunity({
          currentChain: CHAIN_NAMES[opp.currentChain.toString()],
          targetChain: CHAIN_NAMES[opp.targetChain.toString()],
          currentApy: opp.currentApy.toNumber() / 100,
          targetApy: opp.targetApy.toNumber() / 100,
          improvement: opp.yieldImprovement.toNumber() / 100,
          targetChainSelector: opp.targetChain
        });
      }

      // Get rebalance history
      const history = await router.getRebalanceHistory(5);
      setRebalanceHistory(history.map(r => ({
        timestamp: new Date(r.timestamp.toNumber() * 1000),
        from: CHAIN_NAMES[r.fromChain.toString()],
        to: CHAIN_NAMES[r.toChain.toString()],
        amount: ethers.utils.formatUnits(r.amount, 6),
        yield: r.expectedYield.toNumber() / 100,
        completed: r.completed
      })));

    } catch (error) {
      console.error("Error loading cross-chain data:", error);
    }
  };

  const initiateCrossChainRebalance = async () => {
    if (!signer || !bestOpportunity || bestOpportunity.improvement < 2) return;

    setLoading(true);
    setTxStatus('Initiating cross-chain transfer...');

    try {
      const router = new ethers.Contract(
        CROSS_CHAIN_ROUTER_ADDRESS,
        ROUTER_ABI,
        signer
      );

      // For demo, use a small amount
      const amount = ethers.utils.parseUnits("100", 6); // 100 USDC
      const USDC_ADDRESS = "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d";

      // Estimate CCIP fee (usually paid in LINK)
      setTxStatus('Estimating CCIP fees...');
      
      // Initiate cross-chain rebalance
      const tx = await router.initiateCrossChainRebalance(
        bestOpportunity.targetChainSelector,
        amount,
        USDC_ADDRESS,
        { value: ethers.utils.parseEther("0.01") } // Gas for CCIP
      );

      setTxStatus('Transaction submitted. Waiting for confirmation...');
      await tx.wait();

      setTxStatus('✅ Cross-chain rebalance initiated! Funds will arrive in ~20 minutes.');
      
      // Reload data
      await loadCrossChainData();

    } catch (error) {
      console.error("Cross-chain rebalance error:", error);
      setTxStatus('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrossChainData();
    const interval = setInterval(loadCrossChainData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [signer, userBalance]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: '20px',
      padding: '30px',
      marginTop: '20px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    }}>
      <h2 style={{ 
        color: '#fff', 
        marginBottom: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        🌐 Cross-Chain Yield Optimization
        <span style={{
          fontSize: '14px',
          color: '#3b82f6',
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '5px 15px',
          borderRadius: '20px',
          marginLeft: 'auto'
        }}>
          Powered by Chainlink CCIP
        </span>
      </h2>

      {/* Best Opportunity Card */}
      {bestOpportunity && bestOpportunity.improvement >= 2 && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '30px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: -20,
            right: -20,
            fontSize: '100px',
            opacity: 0.1
          }}>
            💎
          </div>
          
          <h3 style={{ color: '#fff', marginBottom: '20px' }}>
            🎯 Cross-Chain Opportunity Detected!
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                {bestOpportunity.currentChain?.icon}
              </div>
              <h4 style={{ margin: '0 0 5px 0' }}>{bestOpportunity.currentChain?.name}</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                {bestOpportunity.currentApy}% APY
              </p>
            </div>
            
            <div style={{ 
              fontSize: '30px',
              animation: 'pulse 2s infinite'
            }}>
              →
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                {bestOpportunity.targetChain?.icon}
              </div>
              <h4 style={{ margin: '0 0 5px 0' }}>{bestOpportunity.targetChain?.name}</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                {bestOpportunity.targetApy}% APY
              </p>
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px'
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
              Yield Improvement: <strong>+{bestOpportunity.improvement}%</strong>
            </p>
            <button
              onClick={initiateCrossChainRebalance}
              disabled={loading}
              style={{
                padding: '12px 30px',
                background: '#fff',
                color: '#059669',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Processing...' : 'Move Funds Cross-Chain'}
            </button>
          </div>
        </div>
      )}

      {/* Chain APY Comparison */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '20px' }}>
          📊 Multi-Chain APY Comparison
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {crossChainStats?.chains.map((chain, idx) => (
            <div key={idx} style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                {chain.icon}
              </div>
              <h4 style={{ color: '#fff', margin: '0 0 10px 0' }}>
                {chain.name}
              </h4>
              <p style={{ 
                fontSize: '28px', 
                fontWeight: 'bold',
                color: '#3b82f6',
                margin: 0
              }}>
                {chain.apy}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Chain Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '15px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', marginBottom: '10px' }}>
            Total Cross-Chain Rebalances
          </p>
          <h3 style={{ color: '#10b981', fontSize: '36px', margin: 0 }}>
            {crossChainStats?.totalRebalances || 0}
          </h3>
        </div>
        
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '15px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', marginBottom: '10px' }}>
            Total Volume Moved
          </p>
          <h3 style={{ color: '#8b5cf6', fontSize: '36px', margin: 0 }}>
            ${crossChainStats?.totalVolume || '0'}
          </h3>
        </div>
      </div>

      {/* Rebalance History */}
      {rebalanceHistory.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          padding: '20px'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '20px' }}>
            🕐 Recent Cross-Chain Movements
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rebalanceHistory.map((item, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
                padding: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '24px' }}>{item.from?.icon}</span>
                  <span style={{ color: '#94a3b8' }}>→</span>
                  <span style={{ fontSize: '24px' }}>{item.to?.icon}</span>
                  <div>
                    <p style={{ color: '#fff', margin: 0 }}>
                      ${item.amount} moved for {item.yield}% APY
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '5px' }}>
                      {item.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                <span style={{
                  color: item.completed ? '#10b981' : '#eab308',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {item.completed ? '✓ Completed' : '⏳ Processing'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Message */}
      {txStatus && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: txStatus.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : 
                     txStatus.includes('❌') ? 'rgba(239, 68, 68, 0.1)' : 
                     'rgba(59, 130, 246, 0.1)',
          border: `1px solid ${txStatus.includes('✅') ? 'rgba(16, 185, 129, 0.3)' : 
                              txStatus.includes('❌') ? 'rgba(239, 68, 68, 0.3)' : 
                              'rgba(59, 130, 246, 0.3)'}`,
          borderRadius: '10px',
          color: txStatus.includes('✅') ? '#10b981' : 
                 txStatus.includes('❌') ? '#ef4444' : 
                 '#3b82f6'
        }}>
          {txStatus}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}