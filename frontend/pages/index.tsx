// pages/index.tsx - Main Page
import type { NextPage } from 'next';
import Head from 'next/head';
import { YieldMaxDashboard } from '../components/YieldMaxDashboard';
import styled from 'styled-components';

// Import all necessary components and styles
import '../components/tabs/OverviewTab';
import '../components/tabs/PositionsTab';
import '../components/tabs/MarketsTab';
import '../components/tabs/ChainlinkTab';
import '../components/OptimizationModal';
import '../components/common/StyledComponents';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>YieldMax - AI-Powered Cross-Chain Yield Optimizer</title>
        <meta name="description" content="Maximize your DeFi yields with AI-powered optimization across multiple chains using Chainlink CCIP" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Social Media */}
        <meta property="og:title" content="YieldMax - $100M TVL Cross-Chain Yield Optimizer" />
        <meta property="og:description" content="AI-powered yield optimization using Chainlink CCIP for seamless cross-chain DeFi" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:type" content="website" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="YieldMax - AI-Powered DeFi Yields" />
        <meta name="twitter:description" content="Maximize yields across chains with AI optimization" />
        <meta name="twitter:image" content="/twitter-image.png" />
      </Head>

      <YieldMaxDashboard />
    </>
  );
};

export default Home;