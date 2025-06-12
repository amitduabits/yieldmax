// scripts/deploy-ai-contracts.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying YieldMax AI & Chainlink Contracts...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // Load existing deployments
  const deploymentPath = path.join(__dirname, "../deployments/sepolia-deployment.json");
  const existingDeployments = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  // Deploy CrossChainManager
  console.log("\n📡 Deploying CrossChainManager...");
  const CrossChainManager = await hre.ethers.getContractFactory("CrossChainManager");
  const mockCCIPRouter = "0x0000000000000000000000000000000000000001"; // Mock for now
  const crossChainManager = await CrossChainManager.deploy(mockCCIPRouter);
  await crossChainManager.deployed();
  console.log("✅ CrossChainManager deployed to:", crossChainManager.address);
  
  // Deploy AIOptimizer
  console.log("\n🤖 Deploying AIOptimizer...");
  const AIOptimizer = await hre.ethers.getContractFactory("AIOptimizer");
  const mockFunctionsRouter = "0x0000000000000000000000000000000000000002"; // Mock for now
  const subscriptionId = 1; // Mock subscription
  const aiOptimizer = await AIOptimizer.deploy(mockFunctionsRouter, subscriptionId);
  await aiOptimizer.deployed();
  console.log("✅ AIOptimizer deployed to:", aiOptimizer.address);
  
  // Deploy AutomationHandler
  console.log("\n⚡ Deploying AutomationHandler...");
  const AutomationHandler = await hre.ethers.getContractFactory("AutomationHandler");
  const automationHandler = await AutomationHandler.deploy(
    existingDeployments.YieldMaxVault,
    existingDeployments.StrategyEngine
  );
  await automationHandler.deployed();
  console.log("✅ AutomationHandler deployed to:", automationHandler.address);
  
  // Deploy DataStreamConsumer
  console.log("\n📊 Deploying DataStreamConsumer...");
  const DataStreamConsumer = await hre.ethers.getContractFactory("DataStreamConsumer");
  const dataStreamConsumer = await DataStreamConsumer.deploy();
  await dataStreamConsumer.deployed();
  console.log("✅ DataStreamConsumer deployed to:", dataStreamConsumer.address);
  
  // Update YieldMaxVault with AI components
  console.log("\n🔧 Updating YieldMaxVault with AI components...");
  const YieldMaxVault = await hre.ethers.getContractAt("YieldMaxVault", existingDeployments.YieldMaxVault);
  
  // Only do this if your contract has these functions
  // await YieldMaxVault.setAIOptimizer(aiOptimizer.address);
  // await YieldMaxVault.setAutomationHandler(automationHandler.address);
  
  // Save deployment addresses
  const newDeployments = {
    ...existingDeployments,
    CrossChainManager: crossChainManager.address,
    AIOptimizer: aiOptimizer.address,
    AutomationHandler: automationHandler.address,
    DataStreamConsumer: dataStreamConsumer.address,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, "../deployments/sepolia-ai-deployment.json"),
    JSON.stringify(newDeployments, null, 2)
  );
  
  console.log("\n✅ All AI contracts deployed successfully!");
  console.log("\n📄 Deployment addresses saved to deployments/sepolia-ai-deployment.json");
  
  // Verify contracts
  console.log("\n🔍 Waiting 30 seconds before verification...");
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  console.log("\n📝 Verifying contracts on Etherscan...");
  
  try {
    await hre.run("verify:verify", {
      address: crossChainManager.address,
      constructorArguments: [mockCCIPRouter]
    });
    console.log("✅ CrossChainManager verified");
  } catch (error) {
    console.log("❌ CrossChainManager verification failed:", error.message);
  }
  
  try {
    await hre.run("verify:verify", {
      address: aiOptimizer.address,
      constructorArguments: [mockFunctionsRouter, subscriptionId]
    });
    console.log("✅ AIOptimizer verified");
  } catch (error) {
    console.log("❌ AIOptimizer verification failed:", error.message);
  }
  
  console.log("\n🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });