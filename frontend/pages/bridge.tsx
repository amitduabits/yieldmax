import React from 'react';
import dynamic from 'next/dynamic';
import Layout from '../components/common/Layout';
import { useAccount } from 'wagmi';

// Dynamic import to prevent SSR issues
const CrossChainDashboard = dynamic(() => import('../components/CrossChain/CrossChainDashboard'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      textAlign: 'center', 
      padding: '2rem',
      color: '#94a3b8'
    }}>
      Loading bridge...
    </div>
  )
});

export default function Bridge() {
  const { address } = useAccount();
  
  return (
    <Layout>
      <CrossChainDashboard account={address} />
    </Layout>
  );
}