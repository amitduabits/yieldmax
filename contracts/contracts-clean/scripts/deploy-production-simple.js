// scripts/deploy-production-simple.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying YieldMax Production Contracts...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Use your existing vault address
  const EXISTING_VAULT = "0xECbA31cf51F88BA5193186abf35225ECE097df44";

  // 1. Deploy Production Strategy Engine
  console.log("📦 Deploying Production Strategy Engine...");
  const StrategyEngine = await hre.ethers.getContractFactory("ProductionStrategyEngine");
  const strategyEngine = await StrategyEngine.deploy(EXISTING_VAULT);
  await strategyEngine.deployed();
  console.log("✅ Strategy Engine deployed to:", strategyEngine.address);

  // 2. Deploy Production Oracle Manager
  console.log("\n📦 Deploying Production Oracle Manager...");
  const OracleManager = await hre.ethers.getContractFactory("ProductionOracleManager");
  const oracleManager = await OracleManager.deploy();
  await oracleManager.deployed();
  console.log("✅ Oracle Manager deployed to:", oracleManager.address);

  // 3. Deploy Production Automation Manager
  console.log("\n📦 Deploying Production Automation Manager...");
  const AutomationManager = await hre.ethers.getContractFactory("ProductionAutomationManager");
  const automationManager = await AutomationManager.deploy();
  await automationManager.deployed();
  console.log("✅ Automation Manager deployed to:", automationManager.address);

  // 4. Connect Automation to Strategy
  console.log("\n🔧 Connecting contracts...");
  await automationManager.setStrategyEngine(strategyEngine.address);
  console.log("✅ Connected Automation Manager to Strategy Engine");

  // 5. Initial data update
  console.log("\n📊 Initializing yield data...");
  await oracleManager.updateYieldData();
  console.log("✅ Initial yield data set");

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\n📋 Production Contract Addresses:");
  console.log("----------------------------");
  console.log(`strategyEngine: "${strategyEngine.address}",`);
  console.log(`oracleManager: "${oracleManager.address}",`);
  console.log(`automationManager: "${automationManager.address}",`);
  console.log("----------------------------");
  
  console.log("\n⚡ Update these addresses in your enhanced-contracts-fixed.js file!");
  
  console.log("\n📌 Features of Production Contracts:");
  console.log("✅ Real yield variations based on market dynamics");
  console.log("✅ Automated rebalancing with 0.5% threshold");
  console.log("✅ Risk scoring for each protocol");
  console.log("✅ Historical tracking of all rebalances");
  console.log("✅ Gas-optimized for mainnet deployment");
  console.log("✅ Ready for Chainlink Automation integration");

  // Test the contracts
  console.log("\n🧪 Testing contracts...");
  const currentStrategy = await strategyEngine.getCurrentStrategy();
  console.log("Current Strategy:", currentStrategy.protocolName);
  console.log("Current APY:", Number(currentStrategy.expectedAPY) / 100 + "%");
  
  const yields = await oracleManager.getLatestYieldData();
  console.log("\nCurrent Yields:");
  console.log("- Aave:", Number(yields.aaveAPY) / 100 + "%");
  console.log("- Compound:", Number(yields.compoundAPY) / 100 + "%");
  console.log("- Yearn:", Number(yields.yearnAPY) / 100 + "%");
  console.log("- Curve:", Number(yields.curveAPY) / 100 + "%");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });