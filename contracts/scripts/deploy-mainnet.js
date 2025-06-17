const hre = require("hardhat");
const { ethers } = require("hardhat");

// Deployment configuration
const DEPLOYMENT_CONFIG = {
  ethereum: {
    chainId: 1,
    ccipRouter: "0xE561d5E02207fb5eB32cca20a699E0d8919a1476",
    functionsRouter: "0x65Dcc24F8ff9e51F10DCc7Ed1e4e2A61e6E14bd6",
    linkToken: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    automationRegistry: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    protocols: {
      aave: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
      compound: "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B"
    }
  },
  arbitrum: {
    chainId: 42161,
    ccipRouter: "0x141fa059441E0ca23ce184B6A78bafD2A517DdE8",
    functionsRouter: "0x234a5fb5Bd614a7AA2FfAB244D603abFA0Ac5C5C",
    linkToken: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
    automationRegistry: "0x75c0530885F385721fddA23C539AF3701d6183D4",
    usdc: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    protocols: {
      aave: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
      gmx: "0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064"
    }
  }
};

async function deployChain(network, config) {
  console.log(`\n🚀 Deploying to ${network}...`);
  
  // Switch to correct network
  const provider = new ethers.providers.JsonRpcProvider(
    process.env[`${network.toUpperCase()}_RPC_URL`]
  );
  const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  
  // Check balance
  const balance = await signer.getBalance();
  console.log(`Deployer balance: ${ethers.utils.formatEther(balance)} ETH`);
  
  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    throw new Error("Insufficient ETH balance for deployment");
  }
  
  // Deploy StrategyEngine
  console.log("Deploying StrategyEngine...");
  const StrategyEngine = await ethers.getContractFactory("StrategyEngine", signer);
  const strategyEngine = await StrategyEngine.deploy();
  await strategyEngine.deployed();
  console.log(`StrategyEngine deployed to: ${strategyEngine.address}`);
  
  // Deploy YieldMaxVault (Upgradeable)
  console.log("Deploying YieldMaxVault...");
  const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault", signer);
  const vaultImpl = await YieldMaxVault.deploy();
  await vaultImpl.deployed();
  
  // Deploy Proxy
  const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin", signer);
  const proxyAdmin = await ProxyAdmin.deploy();
  await proxyAdmin.deployed();
  
  const TransparentUpgradeableProxy = await ethers.getContractFactory(
    "TransparentUpgradeableProxy",
    signer
  );
  
  const initData = vaultImpl.interface.encodeFunctionData("initialize", [
    config.usdc,
    strategyEngine.address,
    config.ccipRouter,
    config.linkToken,
    process.env.KEEPER_PRIVATE_KEY ? 
      new ethers.Wallet(process.env.KEEPER_PRIVATE_KEY).address : 
      signer.address
  ]);
  
  const proxy = await TransparentUpgradeableProxy.deploy(
    vaultImpl.address,
    proxyAdmin.address,
    initData
  );
  await proxy.deployed();
  console.log(`YieldMaxVault proxy deployed to: ${proxy.address}`);
  
  // Deploy CrossChainManager
  console.log("Deploying CrossChainManager...");
  const CrossChainManager = await ethers.getContractFactory("CrossChainManager", signer);
  const crossChainManager = await CrossChainManager.deploy(config.ccipRouter);
  await crossChainManager.deployed();
  console.log(`CrossChainManager deployed to: ${crossChainManager.address}`);
  
  // Deploy AIOptimizer
  console.log("Deploying AIOptimizer...");
  const AIOptimizer = await ethers.getContractFactory("AIOptimizer", signer);
  const aiOptimizer = await AIOptimizer.deploy(
    config.functionsRouter,
    ethers.utils.formatBytes32String("mainnet"),
    1234 // You'll need to create a subscription
  );
  await aiOptimizer.deployed();
  console.log(`AIOptimizer deployed to: ${aiOptimizer.address}`);
  
  // Deploy Keeper
  console.log("Deploying YieldMaxKeeper...");
  const YieldMaxKeeper = await ethers.getContractFactory("YieldMaxKeeper", signer);
  const keeper = await YieldMaxKeeper.deploy(
    strategyEngine.address,
    aiOptimizer.address
  );
  await keeper.deployed();
  console.log(`YieldMaxKeeper deployed to: ${keeper.address}`);
  
  // Save deployment addresses
  const deployment = {
    network,
    chainId: config.chainId,
    deploymentTime: new Date().toISOString(),
    contracts: {
      strategyEngine: strategyEngine.address,
      yieldMaxVault: proxy.address,
      vaultImplementation: vaultImpl.address,
      proxyAdmin: proxyAdmin.address,
      crossChainManager: crossChainManager.address,
      aiOptimizer: aiOptimizer.address,
      keeper: keeper.address
    },
    config
  };
  
  // Save to file
  const fs = require("fs");
  fs.writeFileSync(
    `deployments/${network}-mainnet.json`,
    JSON.stringify(deployment, null, 2)
  );
  
  return deployment;
}

async function main() {
  console.log("🚀 Starting YieldMax Mainnet Deployment");
  console.log("=====================================");
  
  const deployments = {};
  
  // Deploy to each chain
  for (const [network, config] of Object.entries(DEPLOYMENT_CONFIG)) {
    try {
      deployments[network] = await deployChain(network, config);
    } catch (error) {
      console.error(`❌ Failed to deploy to ${network}:`, error);
      throw error;
    }
  }
  
  console.log("\n✅ All deployments complete!");
  console.log("\n📋 Deployment Summary:");
  
  for (const [network, deployment] of Object.entries(deployments)) {
    console.log(`\n${network.toUpperCase()}:`);
    console.log(`  Vault: ${deployment.contracts.yieldMaxVault}`);
    console.log(`  CrossChain: ${deployment.contracts.crossChainManager}`);
    console.log(`  AI: ${deployment.contracts.aiOptimizer}`);
  }
  
  console.log("\n⚠️  NEXT STEPS:");
  console.log("1. Verify all contracts on Etherscan");
  console.log("2. Configure cross-chain connections");
  console.log("3. Fund with LINK tokens");
  console.log("4. Register Chainlink services");
  console.log("5. Initialize protocol integrations");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });