import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import LivePortfolio from '../frontend/components/Portfolio/LivePortfolio';
import AIOptimization from '../frontend/components/AIOptimization';

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [showAI, setShowAI] = useState(false);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>⚡</span>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              YieldMax
            </h1>
            <span style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              marginLeft: '10px'
            }}>
              AI-Powered
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Feature Toggle */}
            <button
              onClick={() => setShowAI(!showAI)}
              style={{
                padding: '10px 20px',
                background: showAI ? 
                  'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' : 
                  'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              {showAI ? '📊 Portfolio View' : '🤖 AI Optimization'}
            </button>

            {/* Network Badge */}
            {chainId && (
              <div style={{
                padding: '8px 16px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                borderRadius: '20px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  animation: 'pulse 2s infinite'
                }} />
                {chainId === 11155111 ? 'Sepolia' : 
                 chainId === 421614 ? 'Arbitrum Sepolia' :
                 `Chain ${chainId}`}
              </div>
            )}

            {/* Connect Button */}
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
                gap: '15px',
                padding: '8px 16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  👤
                </div>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {!address ? (
          <div style={{
            textAlign: 'center',
            padding: '100px 20px'
          }}>
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
              The first AI-powered cross-chain yield optimizer built with Chainlink Functions.
              Connect your wallet to start maximizing your DeFi returns.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              maxWidth: '800px',
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
                  Chainlink Functions analyze yields across protocols in real-time
                </p>
              </div>
              <div style={{
                padding: '30px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
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
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '15px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '15px' }}>⚡</div>
                <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Auto-Rebalance</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Chainlink Automation rebalances your portfolio 24/7
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {showAI ? (
              <AIOptimization 
                signer={signer} 
                userBalance={userBalance}
              />
            ) : (
              <LivePortfolio 
                signer={signer} 
                provider={provider}
                onBalanceUpdate={(balance) => setUserBalance(balance)}
              />
            )}
          </>
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

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}