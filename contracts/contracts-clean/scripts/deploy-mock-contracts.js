// scripts/deploy-mock-contracts.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Mock Strategy Contracts...\n");

  // Deploy MockStrategyEngine
  console.log("📦 Deploying MockStrategyEngine...");
  const MockStrategyEngine = await hre.ethers.getContractFactory("MockStrategyEngine");
  const strategyEngine = await MockStrategyEngine.deploy();
  await strategyEngine.deployed();
  console.log("✅ MockStrategyEngine deployed to:", strategyEngine.address);

  // Deploy MockOracleManager
  console.log("\n📦 Deploying MockOracleManager...");
  const MockOracleManager = await hre.ethers.getContractFactory("MockOracleManager");
  const oracleManager = await MockOracleManager.deploy();
  await oracleManager.deployed();
  console.log("✅ MockOracleManager deployed to:", oracleManager.address);

  // Deploy MockAutomationManager
  console.log("\n📦 Deploying MockAutomationManager...");
  const MockAutomationManager = await hre.ethers.getContractFactory("MockAutomationManager");
  const automationManager = await MockAutomationManager.deploy();
  await automationManager.deployed();
  console.log("✅ MockAutomationManager deployed to:", automationManager.address);

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("----------------------------");
  console.log(`strategyEngine: "${strategyEngine.address}",`);
  console.log(`oracleManager: "${oracleManager.address}",`);
  console.log(`automationManager: "${automationManager.address}",`);
  console.log("----------------------------");
  console.log("\n⚡ Update these addresses in your enhanced-contracts-fixed.js file!");

  // Verify contracts on Etherscan (optional)
  if (network.name === "sepolia") {
    console.log("\n⏳ Waiting for block confirmations...");
    await strategyEngine.deployTransaction.wait(5);
    
    console.log("\n🔍 Verifying contracts on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: strategyEngine.address,
        constructorArguments: [],
      });
      await hre.run("verify:verify", {
        address: oracleManager.address,
        constructorArguments: [],
      });
      await hre.run("verify:verify", {
        address: automationManager.address,
        constructorArguments: [],
      });
      console.log("✅ All contracts verified!");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });