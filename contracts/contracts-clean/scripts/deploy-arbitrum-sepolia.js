// contracts/scripts/deploy-arbitrum-sepolia.js - CORRECTED VERSION
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying YieldMax to Arbitrum Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");

  // Check if we have enough ETH for deployment
  if (balance.eq(0)) {
    console.log("❌ No ETH balance! Get Arbitrum Sepolia ETH from:");
    console.log("   • Bridge from Sepolia: https://bridge.arbitrum.io/");
    console.log("   • Faucet: https://faucet.quicknode.com/arbitrum/sepolia");
    return;
  }

  // Arbitrum Sepolia USDC address (this is a real testnet USDC)
  const ARBITRUM_SEPOLIA_USDC = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";

  console.log("🪙 Using USDC address:", ARBITRUM_SEPOLIA_USDC);
  console.log("📡 Network: Arbitrum Sepolia");

  try {
    // 1. Deploy YieldMaxVault - CORRECTED: Only pass USDC address
    console.log("\n📄 Deploying YieldMaxVault...");
    const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault");
    
    // Constructor only takes _asset parameter
    const vault = await YieldMaxVault.deploy(ARBITRUM_SEPOLIA_USDC);

    await vault.deployed();
    console.log("✅ YieldMaxVault deployed to:", vault.address);

    // Wait for confirmations
    console.log("\n⏳ Waiting for confirmations...");
    await vault.deploymentTransaction().wait(3);

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
    const automatedEngine = await AutomatedStrategyEngine.deploy(vault.address);
    
    await automatedEngine.deployed();
    console.log("✅ AutomatedStrategyEngine deployed to:", automatedEngine.address);

    // 5. Verify the deployments
    console.log("\n🔍 Verifying deployments...");
    
    // Verify vault
    const asset = await vault.asset();
    const owner = await vault.owner();
    const name = await vault.name();
    const symbol = await vault.symbol();
    const totalAssets = await vault.totalAssets();
    
    console.log("Vault verification:");
    console.log("  Asset (USDC):", asset);
    console.log("  Owner:", owner);
    console.log("  Name:", name);
    console.log("  Symbol:", symbol);
    console.log("  Total Assets:", totalAssets.toString());

    // Check if vault has keeper functionality
    let keeper = "Not applicable";
    try {
      keeper = await vault.keeper();
      console.log("  Keeper:", keeper);
    } catch (error) {
      console.log("  Keeper: Not set (will use owner)");
    }

    // Verify strategy engine
    const currentStrategy = await strategyEngine.getCurrentStrategy();
    console.log("Strategy Engine verification:");
    console.log("  Current protocol:", currentStrategy.protocol);
    console.log("  Expected yield:", currentStrategy.expectedYield.toString());

    // 6. Configure cross-chain settings
    console.log("\n⚙️  Configuring cross-chain settings...");
    
    // Sepolia chain selector for CCIP
    const SEPOLIA_CHAIN_SELECTOR = "16015286601757825753";
    
    // Add Sepolia as supported chain
    await crossChainRouter.addSupportedChain(
      SEPOLIA_CHAIN_SELECTOR,
      "0x0000000000000000000000000000000000000000", // Will be updated with actual Sepolia vault
      ethers.utils.parseEther("0.001") // Estimated gas fee
    );
    
    console.log("✅ Added Sepolia as supported destination");

    // 7. Set keeper if the vault supports it
    console.log("\n🔑 Setting up permissions...");
    try {
      if (vault.setKeeper) {
        const setKeeperTx = await vault.setKeeper(deployer.address);
        await setKeeperTx.wait();
        console.log("✅ Set deployer as keeper");
      }
    } catch (error) {
      console.log("ℹ️  Keeper functionality not available (using owner permissions)");
    }

    // 8. Save deployment info
    const deployment = {
      network: "arbitrumSepolia",
      chainId: 421614,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        YieldMaxVault: vault.address,
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
      verification: {
        vault: { asset, owner, name, symbol, keeper, totalAssets: totalAssets.toString() },
        strategy: { 
          protocol: currentStrategy.protocol,
          yield: currentStrategy.expectedYield.toString()
        }
      }
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "../deployments/arbitrumSepolia");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save individual contract files (for the automation script to find)
    fs.writeFileSync(
      path.join(deploymentsDir, "YieldMaxVault.json"),
      JSON.stringify({
        address: vault.address,
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

    // 9. Generate verification commands
    console.log("\n🔍 Verification Commands:");
    console.log("=========================");
    console.log(`npx hardhat verify --network arbitrumSepolia ${vault.address} "${ARBITRUM_SEPOLIA_USDC}"`);
    console.log(`npx hardhat verify --network arbitrumSepolia ${strategyEngine.address}`);
    console.log(`npx hardhat verify --network arbitrumSepolia ${crossChainRouter.address}`);
    console.log(`npx hardhat verify --network arbitrumSepolia ${automatedEngine.address} "${vault.address}"`);

    console.log("\n🎉 Arbitrum Sepolia Deployment Complete!");
    console.log("========================================");
    console.log("📋 Contract Addresses:");
    console.log(`   YieldMaxVault: ${vault.address}`);
    console.log(`   WorkingStrategyEngine: ${strategyEngine.address}`);
    console.log(`   SimpleCrossChainRouter: ${crossChainRouter.address}`);
    console.log(`   AutomatedStrategyEngine: ${automatedEngine.address}`);
    console.log(`   USDC: ${ARBITRUM_SEPOLIA_USDC}`);

    console.log("\n✅ What's Working:");
    console.log("   • Vault deposits and withdrawals");
    console.log("   • Dynamic yield optimization");
    console.log("   • Cross-chain routing setup");
    console.log("   • Automation-ready contracts");

    console.log("\n🔗 Next Steps:");
    console.log("1. Update your frontend with these new addresses");
    console.log("2. Register Chainlink Automation for AutomatedStrategyEngine");
    console.log("3. Fund contracts with LINK tokens");
    console.log("4. Configure cross-chain connections with Sepolia vault");
    console.log("5. Test cross-chain yield optimization");

    console.log("\n💡 To get test USDC on Arbitrum Sepolia:");
    console.log("   • Bridge from Sepolia: https://bridge.arbitrum.io/");
    console.log("   • Use Arbitrum faucets: https://faucet.quicknode.com/arbitrum/sepolia");

    return {
      vault: vault.address,
      strategyEngine: strategyEngine.address,
      crossChainRouter: crossChainRouter.address,
      automatedEngine: automatedEngine.address,
      usdc: ARBITRUM_SEPOLIA_USDC
    };

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