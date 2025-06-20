// scripts/deploy-complete-system.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Complete YieldMax System...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Network configuration
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  
  // Addresses (update based on your network)
  const USDC_ADDRESSES = {
    "11155111": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia
    "421614": "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Arbitrum Sepolia
  };

  const PROTOCOL_ADDRESSES = {
    "11155111": {
      aavePool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
      compoundComet: "0xAec1F48e02Cfb822Be958B68C7957156EB3F0b6e",
    },
    "421614": {
      aavePool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
      gmxRouter: "0x0000000000000000000000000000000000000000", // Placeholder
    }
  };

  const USDC_ADDRESS = USDC_ADDRESSES[chainId];
  
  console.log("📦 Deploying contracts...\n");

  // 1. Deploy AI Optimizer
  console.log("1. Deploying AI Optimizer...");
  const AIOptimizer = await ethers.getContractFactory("YieldMaxAIOptimizer");
  const aiOptimizer = await AIOptimizer.deploy();
  await aiOptimizer.waitForDeployment();
  console.log("✅ AI Optimizer deployed to:", await aiOptimizer.getAddress());

  // 2. Deploy Protocol Registry
  console.log("\n2. Deploying Protocol Registry...");
  const ProtocolRegistry = await ethers.getContractFactory("ProtocolRegistry");
  const protocolRegistry = await ProtocolRegistry.deploy();
  await protocolRegistry.waitForDeployment();
  console.log("✅ Protocol Registry deployed to:", await protocolRegistry.getAddress());

  // 3. Deploy Protocol Adapters
  console.log("\n3. Deploying Protocol Adapters...");
  
  // Aave Adapter
  const AaveAdapter = await ethers.getContractFactory("AaveV3Adapter");
  const aaveAdapter = await AaveAdapter.deploy(
    PROTOCOL_ADDRESSES[chainId]?.aavePool || ethers.ZeroAddress,
    USDC_ADDRESS // Using USDC as aToken placeholder
  );
  await aaveAdapter.waitForDeployment();
  console.log("✅ Aave Adapter deployed to:", await aaveAdapter.getAddress());

  // Compound Adapter
  const CompoundAdapter = await ethers.getContractFactory("CompoundV3Adapter");
  const compoundAdapter = await CompoundAdapter.deploy(
    PROTOCOL_ADDRESSES[chainId]?.compoundComet || ethers.ZeroAddress
  );
  await compoundAdapter.waitForDeployment();
  console.log("✅ Compound Adapter deployed to:", await compoundAdapter.getAddress());

  // GMX Adapter (if on Arbitrum)
  let gmxAdapter;
  if (chainId === "421614") {
    const GMXAdapter = await ethers.getContractFactory("GMXAdapter");
    gmxAdapter = await GMXAdapter.deploy(
      ethers.ZeroAddress, // Placeholder
      ethers.ZeroAddress  // Placeholder
    );
    await gmxAdapter.waitForDeployment();
    console.log("✅ GMX Adapter deployed to:", await gmxAdapter.getAddress());
  }

  // 4. Deploy Enhanced Vault V2
  console.log("\n4. Deploying Enhanced Vault V2...");
  const EnhancedVault = await ethers.getContractFactory("EnhancedYieldMaxVaultV2");
  const vault = await EnhancedVault.deploy(
    USDC_ADDRESS,
    await aiOptimizer.getAddress(),
    await protocolRegistry.getAddress(),
    "YieldMax USD",
    "ymUSD"
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ Enhanced Vault V2 deployed to:", vaultAddress);

  // 5. Configure System
  console.log("\n🔧 Configuring system...");

  // Register protocols
  console.log("- Registering protocols...");
  await protocolRegistry.registerProtocol("Aave V3", await aaveAdapter.getAddress(), chainId);
  await protocolRegistry.registerProtocol("Compound V3", await compoundAdapter.getAddress(), chainId);
  if (gmxAdapter) {
    await protocolRegistry.registerProtocol("GMX", await gmxAdapter.getAddress(), chainId);
  }

  // Authorize vault in adapters
  console.log("- Authorizing vault in adapters...");
  await aaveAdapter.authorizeVault(vaultAddress, true);
  await compoundAdapter.authorizeVault(vaultAddress, true);
  if (gmxAdapter) {
    await gmxAdapter.authorizeVault(vaultAddress, true);
  }

  // Authorize vault in AI Optimizer
  console.log("- Authorizing vault in AI Optimizer...");
  await aiOptimizer.authorizeVault(vaultAddress, true);

  // 6. Deploy Automation Connector
  console.log("\n5. Deploying Automation Connector...");
  const AutomationConnector = await ethers.getContractFactory("AutomationConnector");
  const automationConnector = await AutomationConnector.deploy(vaultAddress);
  await automationConnector.waitForDeployment();
  console.log("✅ Automation Connector deployed to:", await automationConnector.getAddress());

  // 7. Save deployment
  const deployment = {
    network: chainId === "11155111" ? "sepolia" : "arbitrumSepolia",
    chainId: chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      aiOptimizer: await aiOptimizer.getAddress(),
      protocolRegistry: await protocolRegistry.getAddress(),
      aaveAdapter: await aaveAdapter.getAddress(),
      compoundAdapter: await compoundAdapter.getAddress(),
      gmxAdapter: gmxAdapter ? await gmxAdapter.getAddress() : null,
      vault: vaultAddress,
      automationConnector: await automationConnector.getAddress(),
      usdc: USDC_ADDRESS
    }
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `${deployment.network}-complete.json`),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n✅ Deployment complete!");
  console.log("\n📋 Summary:");
  console.log("- AI Optimizer:", deployment.contracts.aiOptimizer);
  console.log("- Enhanced Vault V2:", deployment.contracts.vault);
  console.log("- Automation Connector:", deployment.contracts.automationConnector);
  console.log("- Protocol Adapters:", Object.keys(deployment.contracts).filter(k => k.includes('Adapter')).length);
  
  console.log("\n📝 Next Steps:");
  console.log("1. Update frontend with new vault address");
  console.log("2. Update Chainlink Automation to use new connector");
  console.log("3. Fund vault with test USDC");
  console.log("4. Test the complete flow");
  
  console.log("\n🔗 Chainlink Automation:");
  console.log(`Update your upkeep to target: ${deployment.contracts.automationConnector}`);
  
  return deployment;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });