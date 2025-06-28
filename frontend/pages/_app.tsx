import '../styles/globals.css';
import type { AppProps } from 'next/app';
import React from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { alchemyProvider } from 'wagmi/providers/alchemy';

// Configure multiple RPC providers for better reliability
const { chains, publicClient } = configureChains(
  [sepolia],
  [
    // Try Alchemy first if key is provided
    ...(process.env.NEXT_PUBLIC_ALCHEMY_KEY 
      ? [alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY })]
      : []
    ),
    
    // Use Infura as backup
    jsonRpcProvider({
      rpc: (chain) => ({
        http: `https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`,
      }),
    }),
    
    // QuickNode public endpoint
    jsonRpcProvider({
      rpc: (chain) => ({
        http: `https://ethereum-sepolia.publicnode.com`,
      }),
    }),
    
    // Ankr public endpoint
    jsonRpcProvider({
      rpc: (chain) => ({
        http: `https://rpc.ankr.com/eth_sepolia`,
      }),
    }),
    
    // Public provider as last resort
    publicProvider(),
  ],
  {
    // Reduce batch size to avoid timeouts
    batch: {
      multicall: {
        batchSize: 50,
        wait: 50,
      },
    },
    // Increase timeout
    pollingInterval: 12_000,
  }
);

const { connectors } = getDefaultWallets({
  appName: 'YieldMax',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        {mounted ? (
          <Component {...pageProps} />
        ) : (
          <div style={{ 
            minHeight: '100vh', 
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8'
          }}>
            Loading...
          </div>
        )}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
