// scripts/deployment/deploy-all-chains.ts
import { deployToChain } from './helpers';

const CHAINS = {
  ethereum: {
    rpc: process.env.ETHEREUM_RPC,
    chainlinkRouter: '0x...',
    dataFeed: '0x...'
  },
  arbitrum: {
    rpc: process.env.ARBITRUM_RPC,
    chainlinkRouter: '0x...',
    dataFeed: '0x...'
  }
};

async function deployYieldMax() {
  console.log('🚀 Deploying YieldMax to all chains...\n');
  
  const deployments: Record<string, any> = {};
  
  // Deploy to each chain
  for (const [chain, config] of Object.entries(CHAINS)) {
    console.log(`Deploying to ${chain}...`);
    
    const contracts = await deployToChain(chain, config);
    deployments[chain] = contracts;
    
    console.log(`✅ ${chain} deployment complete!`);
  }
  
  // Set up cross-chain connections
  await setupCrossChainConnections(deployments);
  
  // Verify all contracts
  await verifyContracts(deployments);
  
  console.log('\n🎉 All deployments complete!');
  console.log('📝 Deployment addresses saved to deployments.json');
}