'use client';

export default function Home() {
  return (
    <div style={{ 
      padding: '2rem', 
      minHeight: '100vh',
      background: '#09090B',
      color: '#FAFAFA'
    }}>
      <h1 style={{ 
        fontSize: '3rem', 
        fontWeight: 'bold',
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #FAFAFA 0%, #199BFF 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        🚀 YieldMax is LIVE!
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#71717A', marginBottom: '2rem' }}>
        Cross-Chain DeFi Yield Optimizer
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginTop: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3>Total Value Locked</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>$22,855</p>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3>Average APY</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22C55E' }}>7.13%</p>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3>Active Positions</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>3</p>
        </div>
      </div>
      
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Available Yields</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px'
          }}>
            <span>Aave (Ethereum)</span>
            <span style={{ color: '#22C55E', fontWeight: 'bold' }}>3.2%</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px'
          }}>
            <span>Aave (Arbitrum)</span>
            <span style={{ color: '#22C55E', fontWeight: 'bold' }}>5.8%</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px'
          }}>
            <span>Curve (Polygon)</span>
            <span style={{ color: '#22C55E', fontWeight: 'bold' }}>12.4%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
