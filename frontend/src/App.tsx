// frontend/src/App.tsx
import React from 'react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { sepolia, arbitrumSepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { YieldMaxDashboard } from './components/YieldMaxDashboard';

// Configure chains
const { chains, publicClient } = configureChains(
  [sepolia, arbitrumSepolia],
  [
    alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_API_KEY || '' }),
    publicProvider()
  ]
);

// Create wagmi config
const config = createConfig(
  getDefaultConfig({
    appName: 'YieldMax',
    chains,
    publicClient,
    walletConnectProjectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '',
  })
);

function App() {
  return (
    <WagmiConfig config={config}>
      <ConnectKitProvider theme="midnight">
        <YieldMaxDashboard />
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

export default App;