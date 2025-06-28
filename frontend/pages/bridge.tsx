// frontend/pages/bridge.tsx
import React from 'react';
import Layout from '../components/common/Layout';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const BridgeInterface = dynamic(() => import('../components/Bridge/BridgeInterface'), {
  ssr: false,
  loading: () => <div style={{ textAlign: 'center', padding: '2rem' }}>Loading bridge...</div>
});

export default function Bridge() {
  return (
    <Layout>
      <BridgeInterface />
    </Layout>
  );
}
