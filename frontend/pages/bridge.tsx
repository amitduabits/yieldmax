import React from 'react';
import Layout from '../components/common/Layout';
import CrossChainDashboard from '../components/CrossChain/CrossChainDashboard';
import { useAccount } from 'wagmi';

export default function Bridge() {
  const { address } = useAccount();
  
  return (
    <Layout>
      <CrossChainDashboard account={address} />
    </Layout>
  );
}