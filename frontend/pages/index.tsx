import React from 'react';
import dynamic from 'next/dynamic';
import Layout from '../components/common/Layout';

// Dynamic import to avoid SSR issues
const Portfolio = dynamic(() => import('../components/Portfolio/Portfolio'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      textAlign: 'center', 
      padding: '2rem',
      color: '#94a3b8'
    }}>
      Loading portfolio...
    </div>
  )
});

export default function Home() {
  return (
    <Layout>
      <Portfolio />
    </Layout>
  );
}