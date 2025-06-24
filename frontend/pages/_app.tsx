// pages/_app.tsx
import { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig, chains } from '../lib/wagmi';
import Layout from '../components/common/Layout';
import '@rainbow-me/rainbowkit/styles.css';
import '../styles/globals.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 30000,
    },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider 
        chains={chains} 
        theme={darkTheme({
          accentColor: '#3b82f6',
          accentColorForeground: 'white',
          borderRadius: 'medium',
        })}
      >
        <QueryClientProvider client={queryClient}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </QueryClientProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default MyApp;