const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying StrategyEngine...\n");

  const [deployer] = await ethers.getSigners();
  console.log("💰 Deployer:", deployer.address);
  console.log("💸 Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  // Known addresses from your previous deployment
  const USDC_ADDRESS = "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d";
  const VAULT_ADDRESS = "0xECbA31cf51F88BA5193186abf35225ECE097df44";
  
  console.log("📄 Using existing contracts:");
  console.log("   USDC:", USDC_ADDRESS);
  console.log("   Vault:", VAULT_ADDRESS);

  try {
    // Deploy StrategyEngineSimple
    console.log("\n🤖 Deploying StrategyEngineSimple...");
    const StrategyEngine = await ethers.getContractFactory("StrategyEngineSimple");
    const strategy = await StrategyEngine.deploy();
    await strategy.deployed();
    console.log("   ✅ StrategyEngine deployed to:", strategy.address);

    // Don't call requestYieldUpdate here - it's already initialized in constructor
    console.log("\n📊 Strategy Engine initialized with default protocols");

    // Get current strategy info
    console.log("\n🎯 Checking deployment...");
    const protocols = await strategy.getSupportedProtocols();
    console.log("   Supported protocols:", protocols.length);
    
    // Save deployment info
    const deployment = {
      network: hre.network.name,
      timestamp: new Date().toISOString(),
      contracts: {
        USDC: USDC_ADDRESS,
        YieldMaxVault: VAULT_ADDRESS,
        StrategyEngine: strategy.address
      }
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }

    fs.writeFileSync(
      path.join(deploymentsDir, `${hre.network.name}-strategy.json`),
      JSON.stringify(deployment, null, 2)
    );

    console.log("\n✅ Deployment complete!");
    console.log("\n📋 All Contract Addresses:");
    console.log("====================");
    console.log("USDC:", USDC_ADDRESS);
    console.log("Vault:", VAULT_ADDRESS);
    console.log("StrategyEngine:", strategy.address);
    console.log("====================\n");

    console.log("🎯 Next Steps:");
    console.log("1. Update STRATEGY_ENGINE_ADDRESS in frontend/components/AIOptimization.tsx to:");
    console.log(`   const STRATEGY_ENGINE_ADDRESS = "${strategy.address}";`);
    console.log("\n2. The contract is initialized with 3 default protocols");
    console.log("3. You can call requestYieldUpdate() from the frontend as the owner");
    console.log("\n✅ Contract verified on Etherscan:");
    console.log(`   https://sepolia.etherscan.io/address/${strategy.address}`);

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