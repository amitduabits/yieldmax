import type { AppProps } from 'next/app';
import { WagmiConfig, createConfig, configureChains, mainnet } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

// Configure chains & providers
const { chains, publicClient } = configureChains(
  [mainnet],
  [publicProvider()]
);

// Get default wallets
const { connectors } = getDefaultWallets({
  appName: 'YieldMax',
  projectId: 'YOUR_PROJECT_ID', // You can use 'demo' for now
  chains
});

// Create wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}