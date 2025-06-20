// components/CrossChain/CrossChainStatus.tsx
export function CrossChainStatus() {
  const chains = [
    { id: 1, name: 'Ethereum', icon: '🔷', supported: true },
    { id: 42161, name: 'Arbitrum', icon: '🔵', supported: true },
    { id: 137, name: 'Polygon', icon: '🟣', supported: true },
    { id: 10, name: 'Optimism', icon: '🔴', supported: false },
  ];

  return (
    <div className="cross-chain-status">
      <h3>Multi-Chain Support</h3>
      <div className="chain-grid">
        {chains.map((chain) => (
          <div 
            key={chain.id} 
            className={`chain-card ${chain.supported ? 'active' : 'coming-soon'}`}
          >
            <span className="chain-icon">{chain.icon}</span>
            <span className="chain-name">{chain.name}</span>
            {!chain.supported && <span className="badge">Coming Soon</span>}
          </div>
        ))}
      </div>
      <div className="ccip-status">
        <p>Powered by Chainlink CCIP</p>
        <p className="status">🟢 Cross-chain infrastructure ready</p>
      </div>
    </div>
  );
}