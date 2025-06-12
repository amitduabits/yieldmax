// frontend/src/components/MultiChainDashboard.tsx
import React from 'react';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { CONTRACTS, SUPPORTED_CHAINS } from '../config/contracts';

export const MultiChainDashboard = () => {
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  
  const currentChain = chain?.id === 11155111 ? 'sepolia' : 
                      chain?.id === 421614 ? 'arbitrumSepolia' : null;
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">YieldMax Cross-Chain Dashboard</h1>
      
      {/* Chain Selector */}
      <div className="mb-8 bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Select Network</h2>
        <div className="flex gap-4">
          <button
            onClick={() => switchNetwork?.(11155111)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentChain === 'sepolia' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Sepolia
          </button>
          <button
            onClick={() => switchNetwork?.(421614)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentChain === 'arbitrumSepolia' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Arbitrum Sepolia
          </button>
        </div>
      </div>
      
      {/* Deployment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Sepolia Deployment</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Vault:</span>{' '}
              <a 
                href={`https://sepolia.etherscan.io/address/${CONTRACTS.sepolia.YieldMaxVault}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono text-xs"
              >
                {CONTRACTS.sepolia.YieldMaxVault.slice(0, 6)}...{CONTRACTS.sepolia.YieldMaxVault.slice(-4)}
              </a>
            </p>
            <p className="text-sm">
              <span className="font-medium">USDC:</span>{' '}
              <span className="font-mono text-xs">
                {CONTRACTS.sepolia.USDC.slice(0, 6)}...{CONTRACTS.sepolia.USDC.slice(-4)}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Status:</span>{' '}
              <span className="text-green-600 font-medium">✓ Deployed</span>
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Arbitrum Sepolia Deployment</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Vault:</span>{' '}
              <a 
                href={`https://sepolia.arbiscan.io/address/${CONTRACTS.arbitrumSepolia.YieldMaxVault}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono text-xs"
              >
                {CONTRACTS.arbitrumSepolia.YieldMaxVault.slice(0, 6)}...{CONTRACTS.arbitrumSepolia.YieldMaxVault.slice(-4)}
              </a>
            </p>
            <p className="text-sm">
              <span className="font-medium">USDC:</span>{' '}
              <span className="font-mono text-xs">
                {CONTRACTS.arbitrumSepolia.USDC.slice(0, 6)}...{CONTRACTS.arbitrumSepolia.USDC.slice(-4)}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Status:</span>{' '}
              <span className="text-green-600 font-medium">✓ Deployed</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Current Network Info */}
      {currentChain && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm">
            <span className="font-medium">Connected to:</span> {SUPPORTED_CHAINS[currentChain].name}
          </p>
          <p className="text-sm">
            <span className="font-medium">Vault Address:</span>{' '}
            <code className="bg-blue-100 px-2 py-1 rounded text-xs">
              {CONTRACTS[currentChain].YieldMaxVault}
            </code>
          </p>
        </div>
      )}
    </div>
  );
};