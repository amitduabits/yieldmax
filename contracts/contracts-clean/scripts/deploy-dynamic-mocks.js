// scripts/deploy-dynamic-mocks.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Dynamic Mock Strategy Contracts...\n");

  // Deploy DynamicMockStrategyEngine
  console.log("📦 Deploying DynamicMockStrategyEngine...");
  const DynamicMockStrategyEngine = await hre.ethers.getContractFactory("DynamicMockStrategyEngine");
  const strategyEngine = await DynamicMockStrategyEngine.deploy();
  await strategyEngine.deployed();
  console.log("✅ DynamicMockStrategyEngine deployed to:", strategyEngine.address);

  // Deploy DynamicMockOracleManager
  console.log("\n📦 Deploying DynamicMockOracleManager...");
  const DynamicMockOracleManager = await hre.ethers.getContractFactory("DynamicMockOracleManager");
  const oracleManager = await DynamicMockOracleManager.deploy();
  await oracleManager.deployed();
  console.log("✅ DynamicMockOracleManager deployed to:", oracleManager.address);

  // Deploy DynamicMockAutomationManager
  console.log("\n📦 Deploying DynamicMockAutomationManager...");
  const DynamicMockAutomationManager = await hre.ethers.getContractFactory("DynamicMockAutomationManager");
  const automationManager = await DynamicMockAutomationManager.deploy();
  await automationManager.deployed();
  console.log("✅ DynamicMockAutomationManager deployed to:", automationManager.address);

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\n📋 New Contract Addresses:");
  console.log("----------------------------");
  console.log(`strategyEngine: "${strategyEngine.address}",`);
  console.log(`oracleManager: "${oracleManager.address}",`);
  console.log(`automationManager: "${automationManager.address}",`);
  console.log("----------------------------");
  console.log("\n⚡ Update these addresses in your enhanced-contracts-fixed.js file!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });