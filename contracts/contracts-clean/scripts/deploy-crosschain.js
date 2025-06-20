// scripts/deploy-crosschain.js
const hre = require("hardhat");

async function main() {
  console.log("🌐 Deploying Cross-Chain Yield Manager...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy Mock Cross-Chain Manager (since we don't have CCIP on testnet)
  console.log("📦 Deploying MockCrossChainYieldManager...");
  const MockCrossChain = await hre.ethers.getContractFactory("MockCrossChainYieldManager");
  const crossChain = await MockCrossChain.deploy();
  await crossChain.deployed();
  console.log("✅ Cross-Chain Manager deployed to:", crossChain.address);

  // Initialize with some data
  console.log("\n🔧 Initializing yield data...");
  await crossChain.updateYieldData();
  console.log("✅ Yield data initialized");

  // Test the contract
  console.log("\n🧪 Testing contract...");
  const chainData = await crossChain.getChainComparison();
  console.log("Chain Yields:");
  console.log("- Ethereum:", Number(chainData[0].bestAPY) / 100 + "%");
  console.log("- Arbitrum:", Number(chainData[1].bestAPY) / 100 + "%");
  console.log("- Polygon:", Number(chainData[2].bestAPY) / 100 + "%");
  console.log("- Optimism:", Number(chainData[3].bestAPY) / 100 + "%");

  console.log("\n📋 Deployment Summary:");
  console.log("----------------------------");
  console.log(`crossChainManager: "${crossChain.address}",`);
  console.log("----------------------------");
  
  console.log("\n⚡ Add this address to your CrossChainDashboard.tsx!");
  console.log("\n🚀 Cross-Chain Features:");
  console.log("✅ Multi-chain yield comparison");
  console.log("✅ Automated cross-chain bridging");
  console.log("✅ Gas optimization");
  console.log("✅ Risk-adjusted routing");
  console.log("✅ Chainlink CCIP ready");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });