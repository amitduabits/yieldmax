const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Testnet configurations
const CHAIN_CONFIG = {
  sepolia: {
    chainId: 11155111,
    chainSelector: "16015286601757825753", // Sepolia CCIP chain selector
    ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
    linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    functionsRouter: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    automationRegistry: "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // USDC on Sepolia
    aavePool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    protocols: {
      aave_v3: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
      compound_v3: "0x0000000000000000000000000000000000000000", // Not on Sepolia
      morpho: "0x0000000000000000000000000000000000000000",
      spark: "0x0000000000000000000000000000000000000000"
    }
  },
  arbitrumSepolia: {
    chainId: 421614,
    chainSelector: "3478487238524512106", // Arbitrum Sepolia CCIP chain selector
    ccipRouter: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
    linkToken: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
    functionsRouter: "0x234a5fb5Bd614a7AA2FfAC608A7Bc7F0d9B8f0A6",
    automationRegistry: "0x75c0530885F385721fddA23C539AF3701d6183D4",
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // USDC on Arbitrum Sepolia
    aavePool: "0x0000000000000000000000000000000000000000", // Update with actual address
    protocols: {
      aave_v3: "0x0000000000000000000000000000000000000000",
      compound_v3: "0x0000000000000000000000000000000000000000",
      morpho: "0x0000000000000000000000000000000000000000",
      spark: "0x0000000000000000000000000000000000000000"
    }
  }
};

async function main() {
  console.log("\n🚀 Starting YieldMax Deployment Process...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  const chainConfig = CHAIN_CONFIG[network];
  
  if (!chainConfig) {
    throw new Error(`Configuration not found for network: ${network}`);
  }
  
  console.log("📍 Network:", network);
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");
  
  // Deploy contracts
  const deployment = await deployContracts(chainConfig, deployer);
  
  // Configure cross-chain routes
  await configureCrossChainRoutes(deployment, chainConfig);
  
  // Setup Chainlink services
  await setupChainlinkServices(deployment, chainConfig);
  
  // Save deployment addresses
  await saveDeployment(network, deployment);
  
  // Verify contracts
  if (network !== "hardhat") {
    await verifyContracts(deployment);
  }
  
  console.log("\n✅ Deployment Complete!");
  console.log("\n📄 Contract Addresses:");
  console.log("YieldMaxVault:", deployment.vault);
  console.log("CrossChainRouter:", deployment.router);
  console.log("StrategyEngine:", deployment.strategy);
  console.log("ChainlinkIntegration:", deployment.integration);
  
  return deployment;
}

async function deployContracts(chainConfig, deployer) {
  console.log("📦 Deploying Contracts...\n");
  
  // 1. Deploy StrategyEngine
  console.log("1️⃣ Deploying StrategyEngine...");
  const StrategyEngine = await hre.ethers.getContractFactory("StrategyEngine");
  const strategy = await StrategyEngine.deploy();
  await strategy.waitForDeployment();
  console.log("✅ StrategyEngine deployed to:", await strategy.getAddress());
  
  // 2. Deploy YieldMaxVault
  console.log("\n2️⃣ Deploying YieldMaxVault...");
  const YieldMaxVault = await hre.ethers.getContractFactory("YieldMaxVault");
  const vault = await YieldMaxVault.deploy(
    chainConfig.usdc,
    await strategy.getAddress(),
    deployer.address // Initial keeper
  );
  await vault.waitForDeployment();
  console.log("✅ YieldMaxVault deployed to:", await vault.getAddress());
  
  // 3. Deploy CrossChainRouter
  console.log("\n3️⃣ Deploying CrossChainRouter...");
  const CrossChainRouter = await hre.ethers.getContractFactory("CrossChainRouter");
  const router = await CrossChainRouter.deploy(
    chainConfig.ccipRouter,
    chainConfig.linkToken
  );
  await router.waitForDeployment();
  console.log("✅ CrossChainRouter deployed to:", await router.getAddress());
  
  // 4. Deploy ChainlinkIntegration
  console.log("\n4️⃣ Deploying ChainlinkIntegration...");
  const ChainlinkIntegration = await hre.ethers.getContractFactory("ChainlinkIntegration");
  const integration = await ChainlinkIntegration.deploy(
    await vault.getAddress(),
    await strategy.getAddress(),
    chainConfig.functionsRouter
  );
  await integration.waitForDeployment();
  console.log("✅ ChainlinkIntegration deployed to:", await integration.getAddress());
  
  return {
    vault: await vault.getAddress(),
    router: await router.getAddress(),
    strategy: await strategy.getAddress(),
    integration: await integration.getAddress(),
    contracts: { vault, router, strategy, integration }
  };
}

async function configureCrossChainRoutes(deployment, chainConfig) {
  console.log("\n🔗 Configuring Cross-Chain Routes...\n");
  
  const router = deployment.contracts.router;
  
  // Configure route to the other chain
  const otherNetwork = hre.network.name === "sepolia" ? "arbitrumSepolia" : "sepolia";
  const otherChainConfig = CHAIN_CONFIG[otherNetwork];
  
  // Note: In production, you'd have the other chain's vault address
  // For now, we'll use a placeholder
  const otherChainVault = "0x0000000000000000000000000000000000000000";
  
  console.log(`Configuring route to ${otherNetwork}...`);
  const tx = await router.configureRoute(
    otherChainConfig.chainSelector,
    otherChainVault,
    300000, // Gas limit for CCIP
    true // Active
  );
  await tx.wait();
  console.log("✅ Route configured");
  
  // Set vault's router
  const vault = deployment.contracts.vault;
  console.log("\nSetting vault's cross-chain router...");
  const setRouterTx = await vault.setCrossChainRouter(deployment.router);
  await setRouterTx.wait();
  console.log("✅ Router set in vault");
}

async function setupChainlinkServices(deployment, chainConfig) {
  console.log("\n⚙️ Setting Up Chainlink Services...\n");
  
  const integration = deployment.contracts.integration;
  const strategy = deployment.contracts.strategy;
  const vault = deployment.contracts.vault;
  
  // 1. Set ChainlinkIntegration as keeper
  console.log("1️⃣ Setting ChainlinkIntegration as keeper...");
  const keeperTx = await vault.setKeeper(deployment.integration);
  await keeperTx.wait();
  console.log("✅ Keeper set");
  
  // 2. Configure protocol risk scores in StrategyEngine
  console.log("\n2️⃣ Configuring protocol risk scores...");
  const protocols = Object.keys(chainConfig.protocols);
  for (const protocol of protocols) {
    if (chainConfig.protocols[protocol] !== "0x0000000000000000000000000000000000000000") {
      const riskScore = protocol === "aave_v3" ? 10 : 20; // Lower is better
      const tx = await strategy.setProtocolRiskScore(
        chainConfig.protocols[protocol],
        riskScore
      );
      await tx.wait();
      console.log(`✅ Set risk score for ${protocol}: ${riskScore}`);
    }
  }
  
  // 3. Initialize price feeds (if available on testnet)
  console.log("\n3️⃣ Setting up price feeds...");
  // Note: Actual Chainlink price feeds would be set here
  console.log("⚠️  Price feeds will be configured when available on testnet");
  
  // 4. Fund contracts with LINK for automation
  console.log("\n4️⃣ Contract funding reminder:");
  console.log("📌 Fund ChainlinkIntegration with LINK for:");
  console.log("   - Automation: ~10 LINK");
  console.log("   - Functions: ~5 LINK");
  console.log("   - CCIP: ~20 LINK");
  console.log(`   Contract address: ${deployment.integration}`);
}

async function saveDeployment(network, deployment) {
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const deploymentPath = path.join(deploymentsDir, `${network}.json`);
  const deploymentData = {
    network,
    chainId: CHAIN_CONFIG[network].chainId,
    timestamp: new Date().toISOString(),
    contracts: {
      YieldMaxVault: deployment.vault,
      CrossChainRouter: deployment.router,
      StrategyEngine: deployment.strategy,
      ChainlinkIntegration: deployment.integration
    },
    configuration: {
      usdc: CHAIN_CONFIG[network].usdc,
      ccipRouter: CHAIN_CONFIG[network].ccipRouter,
      linkToken: CHAIN_CONFIG[network].linkToken,
      functionsRouter: CHAIN_CONFIG[network].functionsRouter
    }
  };
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n💾 Deployment saved to: ${deploymentPath}`);
}

async function verifyContracts(deployment) {
  console.log("\n🔍 Verifying Contracts on Explorer...\n");
  
  // Wait a bit for explorer to index
  console.log("Waiting 30s for explorer indexing...");
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    // Verify StrategyEngine
    console.log("Verifying StrategyEngine...");
    await hre.run("verify:verify", {
      address: deployment.strategy,
      constructorArguments: []
    });
    
    // Verify YieldMaxVault
    console.log("Verifying YieldMaxVault...");
    await hre.run("verify:verify", {
      address: deployment.vault,
      constructorArguments: [
        CHAIN_CONFIG[hre.network.name].usdc,
        deployment.strategy,
        (await hre.ethers.getSigners())[0].address
      ]
    });
    
    // Add other verifications...
    
  } catch (error) {
    console.log("⚠️  Verification failed:", error.message);
    console.log("You can verify manually later");
  }
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });



// const hre = require("hardhat");

// async function main() {
//   console.log("Deploying YieldMax contracts...");
  
//   const [deployer] = await hre.ethers.getSigners();
//   console.log("Deploying with account:", deployer.address);
//   console.log("Account balance:", (await deployer.getBalance()).toString());
  
//   // Deploy Mock USDC
//   const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
//   const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
//   await usdc.deployed();
//   console.log("Mock USDC deployed to:", usdc.address);
  
//   // Deploy Mock CCIP Router
//   const MockCCIPRouter = await hre.ethers.getContractFactory("MockCCIPRouter");
//   const ccipRouter = await MockCCIPRouter.deploy();
//   await ccipRouter.deployed();
//   console.log("Mock CCIP Router deployed to:", ccipRouter.address);
  
//   console.log("\nDeployment complete!");
//   console.log("Save these addresses in your .env file");
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
