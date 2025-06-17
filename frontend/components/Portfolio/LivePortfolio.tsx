import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const LivePortfolio = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setIsConnecting(true);
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
      setIsConnecting(false);
    } else {
      alert('Please install MetaMask!');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        });
    }
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e293b 0%, #1e40af 50%, #1e293b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold', color: 'white' }}>
        🚀 YieldMax
      </h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.8, color: 'white', textAlign: 'center' }}>
        Cross-Chain Yield Optimization Protocol
      </p>
      
      <div style={{ 
        background: 'rgba(34, 197, 94, 0.2)', 
        border: '1px solid rgba(34, 197, 94, 0.5)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '2rem',
        color: 'white',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            background: '#22c55e', 
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }}></div>
          <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '1.1rem' }}>
            🎉 LIVE ON SEPOLIA TESTNET
          </span>
        </div>
        <p style={{ color: '#dcfce7', fontSize: '1rem', marginBottom: '16px' }}>
          Your YieldMax contracts are deployed and working!
        </p>
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.2)', 
          borderRadius: '8px', 
          padding: '12px', 
          fontSize: '0.85rem', 
          color: '#a7f3d0',
          fontFamily: 'monospace'
        }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Vault:</strong> 0xECbA31cf51F88BA5193186abf35225ECE097df44
          </div>
          <div>
            <strong>USDC:</strong> 0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d
          </div>
        </div>
      </div>

      {account ? (
        <div style={{ textAlign: 'center', color: 'white', maxWidth: '600px' }}>
          <h2 style={{ marginBottom: '1rem', color: '#22c55e' }}>✅ Wallet Connected!</h2>
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            marginBottom: '2rem',
            wordBreak: 'break-all'
          }}>
            {account}
          </div>
          
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            textAlign: 'left'
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#3b82f6', textAlign: 'center' }}>
              🎯 Phase 1 Complete!
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span>
                <span>Smart contracts deployed on Sepolia</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span>
                <span>Vault functionality tested (deposits/withdrawals)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span>
                <span>Frontend connected to MetaMask</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#f59e0b', fontSize: '1.2rem' }}>🔄</span>
                <span>Ready for Web3 integration</span>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <h4 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>Next Steps:</h4>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                <p>1. Add ethers.js integration for contract interactions</p>
                <p>2. Implement deposit/withdrawal UI</p>
                <p>3. Add real-time balance updates</p>
                <p>4. Deploy on Arbitrum Sepolia for cross-chain</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            style={{
              background: isConnecting ? '#6b7280' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => {
              if (!isConnecting) {
                e.currentTarget.style.background = '#2563eb';
              }
            }}
            onMouseOut={(e) => {
              if (!isConnecting) {
                e.currentTarget.style.background = '#3b82f6';
              }
            }}
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
          
          <p style={{ 
            marginTop: '1rem', 
            fontSize: '0.9rem', 
            opacity: 0.7,
            color: 'white'
          }}>
            Connect your wallet to interact with YieldMax
          </p>
        </div>
      )}
    </div>
  );
};

// // components/Portfolio/LivePortfolio.tsx
// import React, { useState } from 'react';
// import { useYieldMax } from '../../hooks/useYieldMax';
// import { ConnectButton } from '@rainbow-me/rainbowkit';

// export const LivePortfolio: React.FC = () => {
//   const {
//     vaultData,
//     txStatus,
//     deposit,
//     withdraw,
//     refreshData,
//     isConnected,
//     address,
//   } = useYieldMax();

//   const [depositAmount, setDepositAmount] = useState('');
//   const [withdrawShares, setWithdrawShares] = useState('');
//   const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

//   const handleDeposit = async () => {
//     if (!depositAmount || parseFloat(depositAmount) <= 0) {
//       alert('Please enter a valid deposit amount');
//       return;
//     }

//     try {
//       await deposit(depositAmount);
//       setDepositAmount('');
//       alert('Deposit successful!');
//     } catch (error) {
//       console.error('Deposit failed:', error);
//     }
//   };

//   const handleWithdraw = async () => {
//     if (!withdrawShares || parseFloat(withdrawShares) <= 0) {
//       alert('Please enter a valid withdrawal amount');
//       return;
//     }

//     try {
//       await withdraw(withdrawShares);
//       setWithdrawShares('');
//       alert('Withdrawal successful!');
//     } catch (error) {
//       console.error('Withdrawal failed:', error);
//     }
//   };

//   if (!isConnected) {
//     return (
//       <div style={{ 
//         minHeight: '100vh', 
//         background: 'linear-gradient(135deg, #1e293b 0%, #1e40af 50%, #1e293b 100%)',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         flexDirection: 'column',
//         padding: '20px'
//       }}>
//         <div style={{ textAlign: 'center', color: 'white' }}>
//           <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold' }}>
//             🚀 YieldMax
//           </h1>
//           <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.8 }}>
//             Cross-Chain Yield Optimization Protocol
//           </p>
//           <div style={{ 
//             background: 'rgba(34, 197, 94, 0.2)', 
//             border: '1px solid rgba(34, 197, 94, 0.5)',
//             borderRadius: '12px',
//             padding: '16px',
//             marginBottom: '2rem',
//             maxWidth: '500px'
//           }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
//               <div style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
//               <span style={{ color: '#22c55e', fontWeight: 'bold' }}>LIVE ON SEPOLIA TESTNET</span>
//             </div>
//             <p style={{ color: '#dcfce7', fontSize: '0.9rem' }}>
//               Connected to deployed contracts with real functionality
//             </p>
//           </div>
//           <ConnectButton />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ 
//       minHeight: '100vh', 
//       background: 'linear-gradient(135deg, #1e293b 0%, #1e40af 50%, #1e293b 100%)',
//       padding: '24px'
//     }}>
//       <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
//         {/* Header */}
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
//           <div>
//             <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
//               YieldMax Portfolio
//             </h1>
//             <p style={{ color: '#cbd5e1' }}>
//               Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
//             </p>
//           </div>
//           <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
//             <button
//               onClick={refreshData}
//               disabled={vaultData.isLoading}
//               style={{
//                 background: '#3b82f6',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '8px',
//                 padding: '12px 24px',
//                 cursor: 'pointer',
//                 fontSize: '1rem',
//                 opacity: vaultData.isLoading ? 0.7 : 1
//               }}
//             >
//               {vaultData.isLoading ? 'Loading...' : 'Refresh'}
//             </button>
//             <ConnectButton />
//           </div>
//         </div>

//         {/* Live Status */}
//         <div style={{
//           background: 'rgba(34, 197, 94, 0.2)',
//           border: '1px solid rgba(34, 197, 94, 0.5)',
//           borderRadius: '12px',
//           padding: '16px',
//           marginBottom: '2rem'
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//             <div style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
//             <span style={{ color: '#22c55e', fontWeight: 'bold' }}>🎉 LIVE ON SEPOLIA TESTNET</span>
//             <span style={{ color: '#dcfce7' }}>Your vault is deployed and functional!</span>
//           </div>
//         </div>

//         {/* Stats Grid */}
//         <div style={{ 
//           display: 'grid', 
//           gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
//           gap: '1.5rem', 
//           marginBottom: '2rem' 
//         }}>
//           <StatCard title="Your USDC Balance" value={`${parseFloat(vaultData.userBalance).toFixed(2)} USDC`} color="#3b82f6" />
//           <StatCard title="Your Vault Shares" value={parseFloat(vaultData.userShares).toFixed(2)} color="#8b5cf6" />
//           <StatCard title="Total Vault Assets" value={`${parseFloat(vaultData.totalAssets).toFixed(2)} USDC`} color="#22c55e" />
//           <StatCard title="Current APY" value="8.5%" color="#f59e0b" />
//         </div>

//         {/* Main Interface */}
//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
//           {/* Deposit/Withdraw */}
//           <div style={{
//             background: 'rgba(30, 41, 59, 0.8)',
//             borderRadius: '16px',
//             padding: '2rem',
//             border: '1px solid rgba(71, 85, 105, 0.5)'
//           }}>
//             <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
//               <button
//                 onClick={() => setActiveTab('deposit')}
//                 style={{
//                   flex: 1,
//                   padding: '12px',
//                   background: activeTab === 'deposit' ? '#3b82f6' : 'transparent',
//                   color: activeTab === 'deposit' ? 'white' : '#94a3b8',
//                   border: 'none',
//                   borderRadius: '8px 0 0 8px',
//                   cursor: 'pointer'
//                 }}
//               >
//                 Deposit
//               </button>
//               <button
//                 onClick={() => setActiveTab('withdraw')}
//                 style={{
//                   flex: 1,
//                   padding: '12px',
//                   background: activeTab === 'withdraw' ? '#3b82f6' : 'transparent',
//                   color: activeTab === 'withdraw' ? 'white' : '#94a3b8',
//                   border: 'none',
//                   borderRadius: '0 8px 8px 0',
//                   cursor: 'pointer'
//                 }}
//               >
//                 Withdraw
//               </button>
//             </div>

//             {activeTab === 'deposit' ? (
//               <div>
//                 <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px' }}>
//                   Deposit Amount (USDC)
//                 </label>
//                 <input
//                   type="number"
//                   value={depositAmount}
//                   onChange={(e) => setDepositAmount(e.target.value)}
//                   placeholder="0.00"
//                   style={{
//                     width: '100%',
//                     background: 'rgba(71, 85, 105, 0.5)',
//                     border: '1px solid #475569',
//                     borderRadius: '8px',
//                     padding: '12px',
//                     color: 'white',
//                     fontSize: '1rem',
//                     marginBottom: '1rem'
//                   }}
//                 />
//                 <button
//                   onClick={handleDeposit}
//                   disabled={txStatus.isLoading || !depositAmount}
//                   style={{
//                     width: '100%',
//                     background: '#3b82f6',
//                     color: 'white',
//                     border: 'none',
//                     borderRadius: '8px',
//                     padding: '16px',
//                     fontSize: '1rem',
//                     fontWeight: 'bold',
//                     cursor: 'pointer',
//                     opacity: (txStatus.isLoading || !depositAmount) ? 0.7 : 1
//                   }}
//                 >
//                   {txStatus.isLoading ? 'Processing...' : 'Deposit USDC'}
//                 </button>
//               </div>
//             ) : (
//               <div>
//                 <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px' }}>
//                   Withdraw Shares
//                 </label>
//                 <input
//                   type="number"
//                   value={withdrawShares}
//                   onChange={(e) => setWithdrawShares(e.target.value)}
//                   placeholder="0.00"
//                   style={{
//                     width: '100%',
//                     background: 'rgba(71, 85, 105, 0.5)',
//                     border: '1px solid #475569',
//                     borderRadius: '8px',
//                     padding: '12px',
//                     color: 'white',
//                     fontSize: '1rem',
//                     marginBottom: '1rem'
//                   }}
//                 />
//                 <button
//                   onClick={handleWithdraw}
//                   disabled={txStatus.isLoading || !withdrawShares}
//                   style={{
//                     width: '100%',
//                     background: '#ef4444',
//                     color: 'white',
//                     border: 'none',
//                     borderRadius: '8px',
//                     padding: '16px',
//                     fontSize: '1rem',
//                     fontWeight: 'bold',
//                     cursor: 'pointer',
//                     opacity: (txStatus.isLoading || !withdrawShares) ? 0.7 : 1
//                   }}
//                 >
//                   {txStatus.isLoading ? 'Processing...' : 'Withdraw'}
//                 </button>
//               </div>
//             )}

//             {txStatus.error && (
//               <div style={{
//                 marginTop: '1rem',
//                 padding: '12px',
//                 background: 'rgba(239, 68, 68, 0.2)',
//                 border: '1px solid rgba(239, 68, 68, 0.5)',
//                 borderRadius: '8px',
//                 color: '#fca5a5',
//                 fontSize: '0.9rem'
//               }}>
//                 {txStatus.error}
//               </div>
//             )}
//           </div>

//           {/* Vault Info */}
//           <div style={{
//             background: 'rgba(30, 41, 59, 0.8)',
//             borderRadius: '16px',
//             padding: '2rem',
//             border: '1px solid rgba(71, 85, 105, 0.5)'
//           }}>
//             <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
//               Vault Statistics
//             </h3>
//             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
//               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//                 <span style={{ color: '#94a3b8' }}>Total Assets</span>
//                 <span style={{ color: 'white', fontWeight: 'bold' }}>
//                   {parseFloat(vaultData.totalAssets).toFixed(2)} USDC
//                 </span>
//               </div>
//               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//                 <span style={{ color: '#94a3b8' }}>Total Shares</span>
//                 <span style={{ color: 'white', fontWeight: 'bold' }}>
//                   {parseFloat(vaultData.totalShares).toFixed(2)}
//                 </span>
//               </div>
//               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//                 <span style={{ color: '#94a3b8' }}>Your Share</span>
//                 <span style={{ color: 'white', fontWeight: 'bold' }}>
//                   {parseFloat(vaultData.totalShares) > 0 
//                     ? ((parseFloat(vaultData.userShares) / parseFloat(vaultData.totalShares)) * 100).toFixed(2)
//                     : '0'
//                   }%
//                 </span>
//               </div>
//               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//                 <span style={{ color: '#94a3b8' }}>Last Rebalance</span>
//                 <span style={{ color: 'white', fontWeight: 'bold' }}>
//                   {vaultData.lastRebalance > 0 
//                     ? new Date(vaultData.lastRebalance * 1000).toLocaleDateString()
//                     : 'Never'
//                   }
//                 </span>
//               </div>
//             </div>

//             <div style={{
//               marginTop: '2rem',
//               padding: '1rem',
//               background: 'rgba(71, 85, 105, 0.3)',
//               borderRadius: '8px'
//             }}>
//               <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.5rem' }}>Contract Addresses</h4>
//               <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
//                 <div>Vault: 0xECbA...df44</div>
//                 <div>USDC: 0x5289...910d</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Simple StatCard component
// const StatCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
//   <div style={{
//     background: `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`,
//     border: `1px solid ${color}60`,
//     borderRadius: '12px',
//     padding: '1.5rem',
//     color: 'white'
//   }}>
//     <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>{title}</p>
//     <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</p>
//   </div>
// );