// components/CrossChain/CrossChainDashboard.tsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Cross-chain contract ABI
const CROSS_CHAIN_ABI = [
    "function getChainComparison() view returns (tuple(uint256 bestAPY, string bestProtocol, uint256 tvl, uint256 lastUpdate, bool isActive), tuple(uint256 bestAPY, string bestProtocol, uint256 tvl, uint256 lastUpdate, bool isActive), tuple(uint256 bestAPY, string bestProtocol, uint256 tvl, uint256 lastUpdate, bool isActive), tuple(uint256 bestAPY, string bestProtocol, uint256 tvl, uint256 lastUpdate, bool isActive))",
    "function totalRebalances() view returns (uint256)",
    "function totalCrossChainVolume() view returns (uint256)",
    "function initiateCrossChainRebalance(uint64 destinationChain, address token, uint256 amount) payable returns (bytes32)",
    "function updateYieldData()"
];

interface ChainData {
    name: string;
    icon: string;
    color: string;
    bestAPY: number;
    bestProtocol: string;
    tvl: number;
    chainId: number;
    gasPrice?: number;
    bridgeTime?: string;
}

export default function CrossChainDashboard({ account }: { account: string | null }) {
    const [chains, setChains] = useState<ChainData[]>([]);
    const [totalRebalances, setTotalRebalances] = useState(0);
    const [totalVolume, setTotalVolume] = useState(0);
    const [selectedFromChain, setSelectedFromChain] = useState<number>(1);
    const [selectedToChain, setSelectedToChain] = useState<number>(2);
    const [bridgeAmount, setBridgeAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [txStatus, setTxStatus] = useState('');
    const [showBridgeModal, setShowBridgeModal] = useState(false);

    // Mock cross-chain contract address (deploy the MockCrossChainYieldManager)
    //   const CROSS_CHAIN_CONTRACT = "0x... YOUR_DEPLOYED_CROSS_CHAIN_ADDRESS";
    const CROSS_CHAIN_CONTRACT = "0x75184db477E030aD316CabaD72e18292F350560C";


    const loadChainData = async () => {
        try {
            if (!window.ethereum) return;

            // For demo, use static data
            const mockChains: ChainData[] = [
                {
                    name: "Ethereum",
                    icon: "🔷",
                    color: "#627EEA",
                    bestAPY: 9.25,
                    bestProtocol: "Yearn Finance",
                    tvl: 5500,
                    chainId: 1,
                    gasPrice: 30,
                    bridgeTime: "~15 min"
                },
                {
                    name: "Arbitrum",
                    icon: "🔵",
                    color: "#2D374B",
                    bestAPY: 11.42,
                    bestProtocol: "GMX",
                    tvl: 320,
                    chainId: 2,
                    gasPrice: 0.1,
                    bridgeTime: "~10 min"
                },
                {
                    name: "Polygon",
                    icon: "🟣",
                    color: "#8247E5",
                    bestAPY: 8.73,
                    bestProtocol: "Aave V3",
                    tvl: 1200,
                    chainId: 3,
                    gasPrice: 0.01,
                    bridgeTime: "~20 min"
                },
                {
                    name: "Optimism",
                    icon: "🔴",
                    color: "#FF0420",
                    bestAPY: 10.15,
                    bestProtocol: "Velodrome",
                    tvl: 180,
                    chainId: 4,
                    gasPrice: 0.001,
                    bridgeTime: "~5 min"
                }
            ];

            // Add some dynamic variation
            const timestamp = Date.now();
            mockChains.forEach((chain, i) => {
                chain.bestAPY = chain.bestAPY + Math.sin(timestamp / 20000 + i) * 0.3;
            });

            setChains(mockChains);
            setTotalRebalances(3); // Mock data
            setTotalVolume(125000); // Mock data

            // If contract is deployed, get real data
            /*
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(CROSS_CHAIN_CONTRACT, CROSS_CHAIN_ABI, provider);
            
            const [chainData, rebalances, volume] = await Promise.all([
              contract.getChainComparison(),
              contract.totalRebalances(),
              contract.totalCrossChainVolume()
            ]);
      
            // Parse chain data and update state
            */
        } catch (error) {
            console.error("Error loading cross-chain data:", error);
        }
    };

    const executeCrossChainRebalance = async () => {
        if (!account || !bridgeAmount) return;

        setIsLoading(true);
        setTxStatus('Preparing cross-chain transfer...');

        try {
            // In production, this would interact with the actual contract
            setTimeout(() => {
                setTxStatus('Requesting approval...');
            }, 1000);

            setTimeout(() => {
                setTxStatus('Initiating bridge...');
            }, 2000);

            setTimeout(() => {
                setTxStatus('Transfer complete! Funds will arrive in ~10 minutes.');
                setTotalRebalances(prev => prev + 1);
                setTotalVolume(prev => prev + parseFloat(bridgeAmount));
                setBridgeAmount('');
                setShowBridgeModal(false);
            }, 4000);

        } catch (error) {
            console.error("Bridge error:", error);
            setTxStatus('Bridge failed. Please try again.');
        } finally {
            setTimeout(() => {
                setIsLoading(false);
                setTxStatus('');
            }, 6000);
        }
    };

    useEffect(() => {
        loadChainData();
        const interval = setInterval(loadChainData, 30000);
        return () => clearInterval(interval);
    }, [account]);

    if (!account) {
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#94a3b8'
            }}>
                <h2 style={{ marginBottom: '20px' }}>🌐 Cross-Chain Yield Optimization</h2>
                <p>Connect your wallet to view cross-chain opportunities</p>
            </div>
        );
    }

    const bestChain = chains.reduce((best, chain) =>
        chain.bestAPY > (best?.bestAPY || 0) ? chain : best, chains[0]);

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
                <h2 style={{ color: '#fff', margin: 0 }}>
                    🌐 Cross-Chain Yield Optimization
                </h2>
                <span style={{
                    color: '#eab308',
                    background: 'rgba(234, 179, 8, 0.1)',
                    padding: '5px 15px',
                    borderRadius: '20px',
                    fontSize: '14px'
                }}>
                    Powered by Chainlink CCIP
                </span>
            </div>

            {/* Best Opportunity Alert */}
            {bestChain && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '15px',
                    padding: '20px',
                    marginBottom: '30px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ color: '#10b981', margin: '0 0 10px 0' }}>
                            🎯 Best Cross-Chain Opportunity
                        </h3>
                        <p style={{ color: '#6ee7b7', margin: 0, fontSize: '18px' }}>
                            {bestChain.icon} {bestChain.name} offering {bestChain.bestAPY.toFixed(2)}% APY via {bestChain.bestProtocol}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedToChain(bestChain.chainId);
                            setShowBridgeModal(true);
                        }}
                        style={{
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Bridge Now →
                    </button>
                </div>
            )}

            {/* Multi-Chain APY Comparison */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '30px'
            }}>
                <h3 style={{ color: '#fff', marginBottom: '20px' }}>
                    📊 Multi-Chain APY Comparison
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {chains.map((chain) => (
                        <ChainCard
                            key={chain.chainId}
                            chain={chain}
                            isSelected={selectedToChain === chain.chainId}
                            onClick={() => setSelectedToChain(chain.chainId)}
                        />
                    ))}
                </div>
            </div>

            {/* Cross-Chain Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '15px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#10b981', marginBottom: '10px' }}>Total Cross-Chain Rebalances</p>
                    <h3 style={{ fontSize: '36px', margin: 0, color: '#10b981' }}>{totalRebalances}</h3>
                </div>
                <div style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '15px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#8b5cf6', marginBottom: '10px' }}>Total Volume Moved</p>
                    <h3 style={{ fontSize: '36px', margin: 0, color: '#8b5cf6' }}>
                        ${totalVolume.toLocaleString()}
                    </h3>
                </div>
            </div>

            {/* Bridge Interface */}
            <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '15px',
                padding: '25px'
            }}>
                <h3 style={{ color: '#3b82f6', marginBottom: '20px' }}>
                    🌉 Quick Bridge
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
                    <select
                        value={selectedFromChain}
                        onChange={(e) => setSelectedFromChain(Number(e.target.value))}
                        style={{
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            padding: '12px',
                            color: '#fff',
                            fontSize: '16px'
                        }}
                    >
                        {chains.map(chain => (
                            <option key={chain.chainId} value={chain.chainId}>
                                {chain.icon} {chain.name} ({chain.bestAPY.toFixed(2)}%)
                            </option>
                        ))}
                    </select>

                    <div style={{ color: '#3b82f6', fontSize: '24px' }}>→</div>

                    <select
                        value={selectedToChain}
                        onChange={(e) => setSelectedToChain(Number(e.target.value))}
                        style={{
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            padding: '12px',
                            color: '#fff',
                            fontSize: '16px'
                        }}
                    >
                        {chains.map(chain => (
                            <option key={chain.chainId} value={chain.chainId}>
                                {chain.icon} {chain.name} ({chain.bestAPY.toFixed(2)}%)
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => setShowBridgeModal(true)}
                    disabled={selectedFromChain === selectedToChain}
                    style={{
                        width: '100%',
                        marginTop: '20px',
                        padding: '15px',
                        background: selectedFromChain === selectedToChain ? '#4b5563' : '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: selectedFromChain === selectedToChain ? 'not-allowed' : 'pointer'
                    }}
                >
                    Configure Bridge →
                </button>
            </div>

            {/* Bridge Modal */}
            {showBridgeModal && (
                <Modal
                    title="Cross-Chain Bridge"
                    onClose={() => setShowBridgeModal(false)}
                >
                    <div style={{ padding: '20px' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ color: '#94a3b8', marginBottom: '10px' }}>Bridge Route</p>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '10px',
                                padding: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <span style={{ color: '#fff' }}>
                                    {chains.find(c => c.chainId === selectedFromChain)?.icon} {chains.find(c => c.chainId === selectedFromChain)?.name}
                                </span>
                                <span style={{ color: '#3b82f6' }}>→</span>
                                <span style={{ color: '#fff' }}>
                                    {chains.find(c => c.chainId === selectedToChain)?.icon} {chains.find(c => c.chainId === selectedToChain)?.name}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ color: '#94a3b8', marginBottom: '10px' }}>Amount (USDC)</p>
                            <input
                                type="number"
                                placeholder="Enter amount"
                                value={bridgeAmount}
                                onChange={(e) => setBridgeAmount(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: '#374151',
                                    border: '1px solid #4b5563',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    color: '#fff',
                                    fontSize: '16px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: '#94a3b8' }}>Bridge Time</span>
                                <span style={{ color: '#fff' }}>
                                    {chains.find(c => c.chainId === selectedToChain)?.bridgeTime || '~15 min'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: '#94a3b8' }}>Expected APY</span>
                                <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                                    {chains.find(c => c.chainId === selectedToChain)?.bestAPY.toFixed(2)}%
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Gas Cost</span>
                                <span style={{ color: '#fff' }}>
                                    ~${chains.find(c => c.chainId === selectedToChain)?.gasPrice || '0.10'}
                                </span>
                            </div>
                        </div>

                        {txStatus && (
                            <div style={{
                                padding: '12px',
                                marginBottom: '20px',
                                background: txStatus.includes('complete') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                border: `1px solid ${txStatus.includes('complete') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                                borderRadius: '8px',
                                color: txStatus.includes('complete') ? '#10b981' : '#3b82f6',
                                textAlign: 'center'
                            }}>
                                {txStatus}
                            </div>
                        )}

                        <button
                            onClick={executeCrossChainRebalance}
                            disabled={!bridgeAmount || parseFloat(bridgeAmount) <= 0 || isLoading}
                            style={{
                                width: '100%',
                                padding: '15px',
                                background: (!bridgeAmount || parseFloat(bridgeAmount) <= 0 || isLoading) ? '#4b5563' : '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: (!bridgeAmount || parseFloat(bridgeAmount) <= 0 || isLoading) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isLoading ? 'Processing...' : 'Execute Bridge'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// Helper component for chain cards
function ChainCard({ chain, isSelected, onClick }: any) {
    return (
        <div
            onClick={onClick}
            style={{
                background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
                padding: '20px',
                border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <span style={{ fontSize: '24px' }}>{chain.icon}</span>
                <h4 style={{ color: '#fff', margin: 0 }}>{chain.name}</h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                    <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '5px' }}>Best APY</p>
                    <p style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                        {chain.bestAPY.toFixed(2)}%
                    </p>
                </div>
                <div>
                    <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '5px' }}>TVL</p>
                    <p style={{ color: '#fff', fontSize: '16px', margin: 0 }}>${chain.tvl}M</p>
                </div>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '10px' }}>
                via {chain.bestProtocol}
            </p>
            {chain.gasPrice && (
                <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '5px' }}>
                    Gas: ~${chain.gasPrice}
                </p>
            )}
        </div>
    );
}

// Modal component
function Modal({ title, onClose, children }: any) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: '#1e293b',
                borderRadius: '12px',
                maxWidth: '500px',
                width: '90%',
                border: '1px solid #334155'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px',
                    borderBottom: '1px solid #334155'
                }}>
                    <h3 style={{ color: '#e2e8f0', margin: 0 }}>{title}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#9ca3af',
                            fontSize: '24px',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}