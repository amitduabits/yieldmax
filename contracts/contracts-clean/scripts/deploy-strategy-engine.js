const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying StrategyEngine to existing YieldMax...\n");

  const [deployer] = await ethers.getSigners();
  console.log("💰 Deployer:", deployer.address);
  console.log("💸 Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  // Load existing deployment
  const deploymentPath = path.join(__dirname, "../deployments/sepolia-minimal.json");
  const existingDeployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  console.log("📄 Found existing deployment:");
  console.log("   USDC:", existingDeployment.usdc);
  console.log("   Vault:", existingDeployment.vault);

  try {
    // Deploy StrategyEngineSimple
    console.log("\n🤖 Deploying StrategyEngineSimple...");
    const StrategyEngine = await ethers.getContractFactory("StrategyEngineSimple");
    const strategy = await StrategyEngine.deploy();
    await strategy.deployed();
    console.log("   ✅ StrategyEngine deployed to:", strategy.address);

    // Initialize with some mock yield data
    console.log("\n📊 Requesting initial yield update...");
    const tx = await strategy.requestYieldUpdate();
    await tx.wait();
    console.log("   ✅ Initial yields set");

    // Get current strategy
    const currentStrategy = await strategy.getCurrentStrategy();
    console.log("\n🎯 Current Optimal Strategy:");
    console.log("   Protocol:", currentStrategy.protocol);
    console.log("   Expected APY:", currentStrategy.expectedYield.toNumber() / 100, "%");
    console.log("   Confidence:", currentStrategy.confidence.toNumber(), "%");

    // Update deployment file
    existingDeployment.strategyEngine = strategy.address;
    existingDeployment.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(
      deploymentPath,
      JSON.stringify(existingDeployment, null, 2)
    );

    // Create a new deployment file with all addresses
    const fullDeployment = {
      network: hre.network.name,
      timestamp: new Date().toISOString(),
      contracts: {
        USDC: existingDeployment.usdc,
        YieldMaxVault: existingDeployment.vault,
        StrategyEngine: strategy.address
      },
      chainlink: {
        note: "Using simplified version for demo - upgrade to Chainlink Functions for production"
      }
    };

    fs.writeFileSync(
      path.join(__dirname, `../deployments/${hre.network.name}-complete.json`),
      JSON.stringify(fullDeployment, null, 2)
    );

    console.log("\n✅ Deployment complete!");
    console.log("\n📋 All Contract Addresses:");
    console.log("====================");
    console.log("USDC:", existingDeployment.usdc);
    console.log("Vault:", existingDeployment.vault);
    console.log("StrategyEngine:", strategy.address);
    console.log("====================\n");

    console.log("🎯 Next Steps:");
    console.log("1. Update STRATEGY_ENGINE_ADDRESS in frontend/components/AIOptimization.tsx");
    console.log("2. Update STRATEGY_ENGINE_ADDRESS in frontend/components/Portfolio/LivePortfolio.tsx");
    console.log("3. Test the AI optimization features!");
    console.log("\n💡 Note: This is a simplified version for the hackathon demo.");
    console.log("   For production, integrate Chainlink Functions following the guide.");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });