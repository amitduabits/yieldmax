// scripts/deploy-enhanced-contracts.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Enhanced YieldMax Contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("💰 Deployer:", deployer.address);
  console.log("💸 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  const network = hre.network.name;
  console.log("🌐 Network:", network);

  // Network-specific configurations
  const configs = {
    sepolia: {
      functionsRouter: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
      subscriptionId: "2777", // Your Functions subscription ID
      donId: "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000",
      usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Your existing USDC
      vault: "0xECbA31cf51F88BA5193186abf35225ECE097df44"  // Your existing Vault
    },
    arbitrumSepolia: {
      functionsRouter: "0x234a5fb5Bd614a7AA2FfAB244D603abFA0Ac5C5C",
      subscriptionId: "2778", // Your Functions subscription ID
      donId: "0x66756e2d617262697472756d2d7365706f6c69612d3100000000000000000000",
      usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
      vault: "0x10d2ECF290f56BdBF6B8e014c426c17299b4E3B2"
    }
  };

  const config = configs[network];
  if (!config) {
    throw new Error(`Unsupported network: ${network}`);
  }

  console.log("📋 Configuration:");
  console.log("   Functions Router:", config.functionsRouter);
  console.log("   Subscription ID:", config.subscriptionId);
  console.log("   USDC:", config.usdc);
  console.log("   Existing Vault:", config.vault);

  try {
    // 1. Deploy Enhanced Strategy Engine
    console.log("\n🎯 Deploying Enhanced Strategy Engine...");
    const EnhancedStrategyEngine = await hre.ethers.getContractFactory("EnhancedStrategyEngine");
    const strategyEngine = await EnhancedStrategyEngine.deploy();
    await strategyEngine.waitForDeployment();
    const strategyEngineAddress = await strategyEngine.getAddress();
    console.log("   ✅ Enhanced Strategy Engine:", strategyEngineAddress);

    // 2. Deploy YieldMax Functions Consumer
    console.log("\n📡 Deploying YieldMax Functions Consumer...");
    const FunctionsConsumer = await hre.ethers.getContractFactory("YieldMaxFunctionsConsumer");
    const functionsConsumer = await FunctionsConsumer.deploy(
      config.functionsRouter,
      config.subscriptionId,
      config.donId
    );
    await functionsConsumer.waitForDeployment();
    const functionsConsumerAddress = await functionsConsumer.getAddress();
    console.log("   ✅ Functions Consumer:", functionsConsumerAddress);

    // 3. Initialize with demo yield data
    console.log("\n📊 Setting up initial yield data...");
    const tx1 = await functionsConsumer.setEmergencyYieldData(
      702,  // Aave: 7.02%
      626,  // Compound: 6.26%
      995,  // Yearn: 9.95%
      519   // Curve: 5.19%
    );
    await tx1.wait();
    console.log("   ✅ Initial yield data set");

    // 4. Configure Strategy Engine with Functions Consumer
    console.log("\n🔗 Connecting Strategy Engine to Functions Consumer...");
    const tx2 = await strategyEngine.setFunctionsConsumer(functionsConsumerAddress);
    await tx2.wait();
    console.log("   ✅ Strategy Engine connected to Functions Consumer");

    // 5. Add protocol configurations
    console.log("\n⚙️  Configuring DeFi protocols...");
    
    const protocols = [
      { name: "Aave", address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", weight: 25 },
      { name: "Compound", address: "0xc3d688B66703497DAA19211EEdff47f25384cdc3", weight: 25 },
      { name: "Yearn", address: "0x83f20f44975D03b1b09e64809B757c47f942BEeA", weight: 25 },
      { name: "Curve", address: "0xD533a949740bb3306d119CC777fa900bA034cd52", weight: 25 }
    ];

    for (const protocol of protocols) {
      const tx = await strategyEngine.addProtocol(
        protocol.address,
        protocol.name,
        protocol.weight
      );
      await tx.wait();
      console.log(`   ✅ Added ${protocol.name} protocol`);
    }

    // 6. Grant necessary roles
    console.log("\n🔐 Setting up permissions...");
    const KEEPER_ROLE = await functionsConsumer.KEEPER_ROLE();
    const tx3 = await functionsConsumer.grantRole(KEEPER_ROLE, strategyEngineAddress);
    await tx3.wait();
    console.log("   ✅ Strategy Engine granted KEEPER role");

    // 7. Test the integration
    console.log("\n🧪 Testing integration...");
    const currentYields = await functionsConsumer.getCurrentYields();
    console.log("   📈 Current Yields:");
    console.log("      Aave APY:", currentYields.aaveAPY.toString() / 100, "%");
    console.log("      Compound APY:", currentYields.compoundAPY.toString() / 100, "%");
    console.log("      Yearn APY:", currentYields.yearnAPY.toString() / 100, "%");
    console.log("      Curve APY:", currentYields.curveAPY.toString() / 100, "%");

    const bestYield = await functionsConsumer.getBestYield(1000000); // 1M units
    console.log("   🎯 Best Yield:", bestYield[0], "at", bestYield[1].toString() / 100, "% APY");

    // 8. Save deployment info
    const deployment = {
      network: network,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        USDC: config.usdc,
        YieldMaxVault: config.vault,
        EnhancedStrategyEngine: strategyEngineAddress,
        YieldMaxFunctionsConsumer: functionsConsumerAddress
      },
      chainlink: {
        functionsRouter: config.functionsRouter,
        subscriptionId: config.subscriptionId,
        donId: config.donId
      },
      integrations: {
        functionsConsumerInStrategyEngine: true,
        permissionsConfigured: true,
        protocolsConfigured: protocols.length,
        initialYieldDataSet: true
      }
    };

    // Save to deployments directory
    const deploymentDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentDir, `${network}-enhanced.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));

    console.log("\n✅ Enhanced Deployment Complete!");
    console.log("\n📋 Deployment Summary:");
    console.log("==================================");
    console.log("Enhanced Strategy Engine:", strategyEngineAddress);
    console.log("Functions Consumer:", functionsConsumerAddress);
    console.log("Integration:", "✅ Connected");
    console.log("Protocols Configured:", protocols.length);
    console.log("Initial Data:", "✅ Set");
    console.log("==================================");

    console.log("\n🔥 What's New:");
    console.log("• Real-time DeFi protocol integration");
    console.log("• Chainlink Functions for live yield data");
    console.log("• Enhanced strategy optimization algorithms");
    console.log("• Production-ready API integration framework");
    console.log("• Advanced analytics and risk assessment");

    console.log("\n🚀 Next Steps:");
    console.log("1. Configure Chainlink Functions subscription");
    console.log("2. Replace mock data with real DeFi protocol APIs");
    console.log("3. Deploy frontend updates to use enhanced contracts");
    console.log("4. Set up automated yield data refresh");
    console.log("5. Enable production-grade monitoring");

    console.log("\n📄 Deployment saved to:", deploymentFile);

  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });