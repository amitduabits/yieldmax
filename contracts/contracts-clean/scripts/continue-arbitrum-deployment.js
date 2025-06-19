// contracts/scripts/continue-arbitrum-deployment.js - SIMPLIFIED VERSION
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔄 Continuing Arbitrum Sepolia deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deploying with account:", deployer.address);

  // Your already deployed vault
  const VAULT_ADDRESS = "0x10d2ECF290f56BdBF6B8e014c426c17299b4E3B2";
  const ARBITRUM_SEPOLIA_USDC = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";

  console.log("✅ Using existing vault:", VAULT_ADDRESS);
  console.log("🪙 USDC address:", ARBITRUM_SEPOLIA_USDC);

  try {
    // Get the vault contract
    const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault");
    const vault = YieldMaxVault.attach(VAULT_ADDRESS);
    
    // Verify vault is working with basic functions
    console.log("\n🔍 Verifying existing vault...");
    try {
      const asset = await vault.asset();
      const owner = await vault.owner();
      console.log("  Asset:", asset);
      console.log("  Owner:", owner);
      console.log("  ✅ Vault is working!");
    } catch (error) {
      console.log("  ⚠️  Basic verification:", error.message);
    }

    // 2. Deploy WorkingStrategyEngine
    console.log("\n🤖 Deploying WorkingStrategyEngine...");
    const WorkingStrategyEngine = await ethers.getContractFactory("WorkingStrategyEngine");
    const strategyEngine = await WorkingStrategyEngine.deploy();
    await strategyEngine.deployed();
    console.log("✅ WorkingStrategyEngine deployed to:", strategyEngine.address);

    // 3. Deploy SimpleCrossChainRouter  
    console.log("\n🌉 Deploying SimpleCrossChainRouter...");
    const SimpleCrossChainRouter = await ethers.getContractFactory("SimpleCrossChainRouter");
    const crossChainRouter = await SimpleCrossChainRouter.deploy();
    await crossChainRouter.deployed();
    console.log("✅ SimpleCrossChainRouter deployed to:", crossChainRouter.address);

    // 4. Deploy AutomatedStrategyEngine (for Chainlink Automation)
    console.log("\n⚡ Deploying AutomatedStrategyEngine...");
    const AutomatedStrategyEngine = await ethers.getContractFactory("AutomatedStrategyEngine");
    const automatedEngine = await AutomatedStrategyEngine.deploy(VAULT_ADDRESS);
    await automatedEngine.deployed();
    console.log("✅ AutomatedStrategyEngine deployed to:", automatedEngine.address);

    // 5. Verify strategy engine
    console.log("\n🔍 Verifying strategy engine...");
    try {
      const currentStrategy = await strategyEngine.getCurrentStrategy();
      console.log("  Current protocol:", currentStrategy.protocol);
      console.log("  Expected yield:", currentStrategy.expectedYield.toString());
      console.log("  ✅ Strategy engine is working!");
    } catch (error) {
      console.log("  ⚠️  Strategy verification:", error.message);
    }

    // 6. Configure cross-chain settings
    console.log("\n⚙️  Configuring cross-chain settings...");
    const SEPOLIA_CHAIN_SELECTOR = "16015286601757825753";
    
    try {
      const addChainTx = await crossChainRouter.addSupportedChain(
        SEPOLIA_CHAIN_SELECTOR,
        "0xECbA31cf51F88BA5193186abf35225ECE097df44", // Your Sepolia vault
        ethers.utils.parseEther("0.001")
      );
      await addChainTx.wait();
      console.log("✅ Added Sepolia as supported destination");
    } catch (error) {
      console.log("  ⚠️  Cross-chain config:", error.message);
    }

    // 7. Save deployment info
    const deployment = {
      network: "arbitrumSepolia",
      chainId: 421614,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        YieldMaxVault: VAULT_ADDRESS,
        WorkingStrategyEngine: strategyEngine.address,
        SimpleCrossChainRouter: crossChainRouter.address,
        AutomatedStrategyEngine: automatedEngine.address,
        USDC: ARBITRUM_SEPOLIA_USDC
      },
      chainlink: {
        automation: {
          target: automatedEngine.address,
          description: "Ready for Chainlink Automation registration"
        },
        ccip: {
          router: crossChainRouter.address,
          supportedChains: [SEPOLIA_CHAIN_SELECTOR],
          description: "Cross-chain routing enabled"
        }
      },
      status: "deployment_complete"
    };

    // Create deployments directory
    const deploymentsDir = path.join(__dirname, "../deployments/arbitrumSepolia");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save individual contract files (required for automation setup)
    fs.writeFileSync(
      path.join(deploymentsDir, "YieldMaxVault.json"),
      JSON.stringify({
        address: VAULT_ADDRESS,
        deployer: deployer.address,
        asset: ARBITRUM_SEPOLIA_USDC,
        deployedAt: new Date().toISOString(),
        network: "arbitrumSepolia",
        chainId: 421614
      }, null, 2)
    );

    // Save complete deployment
    fs.writeFileSync(
      path.join(deploymentsDir, "complete-deployment.json"),
      JSON.stringify(deployment, null, 2)
    );

    console.log("\n📁 Deployment info saved!");

    console.log("\n🎉 Arbitrum Sepolia Deployment Complete!");
    console.log("========================================");
    console.log("📋 Contract Addresses:");
    console.log(`   YieldMaxVault: ${VAULT_ADDRESS}`);
    console.log(`   WorkingStrategyEngine: ${strategyEngine.address}`);
    console.log(`   SimpleCrossChainRouter: ${crossChainRouter.address}`);
    console.log(`   AutomatedStrategyEngine: ${automatedEngine.address}`);
    console.log(`   USDC: ${ARBITRUM_SEPOLIA_USDC}`);

    console.log("\n🔍 Verification Commands:");
    console.log("=========================");
    console.log(`npx hardhat verify --network arbitrumSepolia ${VAULT_ADDRESS} "${ARBITRUM_SEPOLIA_USDC}"`);
    console.log(`npx hardhat verify --network arbitrumSepolia ${strategyEngine.address}`);
    console.log(`npx hardhat verify --network arbitrumSepolia ${crossChainRouter.address}`);
    console.log(`npx hardhat verify --network arbitrumSepolia ${automatedEngine.address} "${VAULT_ADDRESS}"`);

    console.log("\n🚀 READY FOR CHAINLINK AUTOMATION!");
    console.log("===================================");
    console.log("Run this next:");
    console.log("npx hardhat run scripts/setup-chainlink-automation.js --network arbitrumSepolia");
    
    console.log("\n📋 Summary:");
    console.log("✅ Arbitrum Sepolia: Full deployment complete");
    console.log("✅ Sepolia: Already deployed and working");
    console.log("🔗 Cross-chain: Ready for configuration");
    console.log("🤖 Automation: Ready for registration");

    return deployment;

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;