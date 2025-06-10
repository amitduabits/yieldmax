// scripts/test-both-networks.js
const hre = require("hardhat");

async function testNetwork(networkName) {
  console.log(`\n🧪 Testing on ${networkName}...`);
  
  try {
    const deployment = require(`../deployments/${networkName}.json`);
    const vault = await hre.ethers.getContractAt(
      "YieldMaxVault", 
      deployment.contracts.YieldMaxVault
    );
    
    console.log("✓ Vault Address:", deployment.contracts.YieldMaxVault);
    console.log("✓ Total Assets:", (await vault.totalAssets()).toString());
    console.log("✓ Total Shares:", (await vault.totalShares()).toString());
    console.log("✓ Asset (USDC):", await vault.asset());
    
  } catch (error) {
    console.error(`✗ Error testing ${networkName}:`, error.message);
  }
}

async function main() {
  console.log("🔍 Testing YieldMax Deployments\n");
  
  // Test Sepolia
  await hre.run("compile");
  await testNetwork("sepolia");
  
  // Test Arbitrum Sepolia
  await testNetwork("arbitrumSepolia");
  
  console.log("\n✅ Testing complete!");
}

main().catch(console.error);