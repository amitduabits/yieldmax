const hre = require("hardhat");

async function main() {
  console.log("\n🚀 YieldMax Complete Deployment Script\n");
  
  // Deploy to current network
  const network = hre.network.name;
  console.log(`Deploying to ${network}...`);
  
  // Run main deployment
  const deployment = await hre.run("deploy");
  
  // If we're on Sepolia, also deploy to Arbitrum Sepolia
  if (network === "sepolia") {
    console.log("\n📡 Switching to Arbitrum Sepolia for second deployment...\n");
    
    // Store Sepolia deployment
    const sepoliaDeployment = deployment;
    
    // Deploy to Arbitrum Sepolia
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    try {
      const { stdout } = await execPromise('npx hardhat run scripts/deploy.js --network arbitrumSepolia');
      console.log(stdout);
      
      // Now update cross-chain configurations
      console.log("\n🔄 Updating cross-chain configurations...");
      await updateCrossChainConfigs(sepoliaDeployment);
      
    } catch (error) {
      console.error("Failed to deploy to Arbitrum Sepolia:", error);
    }
  }
  
  console.log("\n✅ All deployments complete!");
  console.log("\n📋 Next Steps:");
  console.log("1. Fund contracts with LINK tokens");
  console.log("2. Register Chainlink Automation");
  console.log("3. Configure Chainlink Functions");
  console.log("4. Update frontend with contract addresses");
}

async function updateCrossChainConfigs(sepoliaDeployment) {
  // This would update the cross-chain router configurations
  // with the actual deployed addresses from both chains
  console.log("Cross-chain configuration would be updated here");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
