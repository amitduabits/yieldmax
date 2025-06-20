// App.tsx or pages/index.tsx
import React, { useState, useEffect } from 'react';
import { EnhancedPortfolio } from '../frontend/components/Portfolio/EnhancedPortfolio';
import AIOptimization from '../frontend/components/AIOptimization/AIOptimization';
import AutomationDashboard from '../frontend/components/Automation/AutomationDashboard';
import CrossChainDashboard from '../frontend/components/CrossChain/CrossChainDashboard';

type TabType = 'portfolio' | 'ai' | 'automation' | 'crosschain';

export default function YieldMaxApp() {
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const [account, setAccount] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    // Check if wallet is connected
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      });
    }
  }, []);

  const TabButton = ({ tab, label, icon, isActive }: { tab: TabType; label: string; icon: string; isActive: boolean }) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
        border: `1px solid ${isActive ? 'rgba(59, 130, 246, 0.5)' : 'transparent'}`,
        borderRadius: '12px',
        padding: '10px 20px',
        color: isActive ? '#60a5fa' : '#94a3b8',
        fontSize: '16px',
        fontWeight: isActive ? 'bold' : 'normal',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        borderBottom: '1px solid #1e293b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#38bdf8' }}>YieldMax</h1>
        </div>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <TabButton tab="portfolio" label="Portfolio" icon="📊" isActive={activeTab === 'portfolio'} />
          <TabButton tab="ai" label="AI Optimization" icon="🤖" isActive={activeTab === 'ai'} />
          <TabButton tab="automation" label="Automation" icon="⚡" isActive={activeTab === 'automation'} />
          <TabButton tab="crosschain" label="Cross-Chain" icon="🌐" isActive={activeTab === 'crosschain'} />
        </div>

        {/* Wallet Info */}
        {account && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#1e293b',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem'
            }}>
              💎 Sepolia
            </div>
            <div style={{
              background: '#1e293b',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontFamily: 'monospace'
            }}>
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
            <button
              onClick={() => {
                if (window.ethereum) {
                  window.ethereum.request({ method: 'eth_accounts' })
                    .then((accounts: string[]) => {
                      if (accounts.length === 0) {
                        window.location.reload();
                      }
                    });
                }
              }}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ padding: '2rem' }}>
        {activeTab === 'portfolio' && <EnhancedPortfolio />}
        {activeTab === 'ai' && <AIOptimization account={account} userBalance={userBalance} />}
        {activeTab === 'automation' && <AutomationDashboard account={account} />}
        {activeTab === 'crosschain' && <CrossChainDashboard account={account} />}
      </div>
    </div>
  );
}