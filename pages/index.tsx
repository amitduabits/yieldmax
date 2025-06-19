import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import LivePortfolio from '../frontend/components/Portfolio/LivePortfolio';
import EnhancedAIOptimization from '../frontend/components/EnhancedAIOptimization';
import AutomationDashboard from '../frontend/components/AutomationDashboard';
import CrossChainDashboard from '../frontend/components/CrossChainDashboard';

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [activeView, setActiveView] = useState('portfolio');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(ethProvider);

      // Check if already connected
      ethProvider.listAccounts().then(accounts => {
        if (accounts.length > 0) {
          handleConnect();
        }
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          handleConnect();
        } else {
          disconnect();
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const handleConnect = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      
      setProvider(provider);
      setSigner(signer);
      setAddress(address);
      setChainId(network.chainId);

      console.log('Connected:', address);
      console.log('Chain ID:', network.chainId);
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAddress('');
    setChainId(null);
    setUserBalance(0);
  };

  const renderActiveView = () => {
    switch(activeView) {
      case 'portfolio':
        return <LivePortfolio signer={signer} provider={provider} onBalanceUpdate={setUserBalance} />;
      case 'ai':
        return <EnhancedAIOptimization signer={signer} userBalance={userBalance} />;
      case 'automation':
        return <AutomationDashboard signer={signer} />;
      case 'crosschain':
        return <CrossChainDashboard signer={signer} userBalance={userBalance} />;
      default:
        return <LivePortfolio signer={signer} provider={provider} onBalanceUpdate={setUserBalance} />;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        background: 'rgba(0, 0, 0, 0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            ⚡ YieldMax
          </h1>

          {/* Navigation Tabs */}
          {address && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setActiveView('portfolio')}
                style={{
                  padding: '8px 16px',
                  background: activeView === 'portfolio' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeView === 'portfolio' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                📊 Portfolio
              </button>
              <button
                onClick={() => setActiveView('ai')}
                style={{
                  padding: '8px 16px',
                  background: activeView === 'ai' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeView === 'ai' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                🤖 AI Optimization
              </button>
              <button
                onClick={() => setActiveView('automation')}
                style={{
                  padding: '8px 16px',
                  background: activeView === 'automation' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeView === 'automation' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                ⚡ Automation
              </button>
              <button
                onClick={() => setActiveView('crosschain')}
                style={{
                  padding: '8px 16px',
                  background: activeView === 'crosschain' ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
                  border: '1px solid rgba(234, 179, 8, 0.5)',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeView === 'crosschain' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                🌐 Cross-Chain
              </button>
            </div>
          )}

          {/* Wallet Connection */}
          {!address ? (
            <button
              onClick={handleConnect}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
              }}
            >
              Connect Wallet
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{
                padding: '8px 16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                fontSize: '14px'
              }}>
                {chainId === 11155111 ? '🔷 Sepolia' : 
                 chainId === 421614 ? '🔵 Arbitrum' : 
                 `Chain ${chainId}`}
              </div>
              <div style={{
                padding: '8px 16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
              <button
                onClick={disconnect}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {!address ? (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h2 style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Welcome to YieldMax
            </h2>
            <p style={{ 
              fontSize: '20px', 
              color: '#94a3b8', 
              marginBottom: '40px',
              maxWidth: '600px',
              margin: '0 auto 40px'
            }}>
              The first AI-powered cross-chain yield optimizer built with Chainlink
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              maxWidth: '1000px',
              margin: '0 auto'
            }}>
              <div style={{
                padding: '30px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '15px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '15px' }}>🤖</div>
                <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>AI Optimization</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Dynamic yield optimization with real-time strategy updates
                </p>
              </div>
              <div style={{
                padding: '30px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '15px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '15px' }}>⚡</div>
                <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Chainlink Automation</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Automatic rebalancing every hour, 24/7
                </p>
              </div>
              <div style={{
                padding: '30px',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '15px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '15px' }}>🌐</div>
                <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Cross-Chain</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Seamlessly move funds between chains for best yields
                </p>
              </div>
              <div style={{
                padding: '30px',
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '15px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '15px' }}>🔗</div>
                <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>CCIP Integration</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Secure cross-chain messaging with Chainlink CCIP
                </p>
              </div>
            </div>
          </div>
        ) : (
          renderActiveView()
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: '100px',
        padding: '40px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        <p style={{ marginBottom: '20px' }}>
          Built with 💙 using Chainlink Functions, CCIP, Automation & Data Feeds
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          fontSize: '14px'
        }}>
          <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Documentation
          </a>
          <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            GitHub
          </a>
          <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Discord
          </a>
        </div>
      </footer>
    </div>
  );
}
