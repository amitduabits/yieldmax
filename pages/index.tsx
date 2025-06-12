import type { NextPage } from 'next';
import Head from 'next/head';
import YieldMaxDashboard  from '../frontend/components/YieldMaxDashboard';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>YieldMax - AI-Powered Cross-Chain Yield Optimizer</title>
        <meta name="description" content="Maximize your DeFi yields with AI-powered optimization across multiple chains using Chainlink CCIP" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <YieldMaxDashboard />
    </>
  );
};

export default Home;

