// scripts/deploy-enhanced-vault.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Enhanced YieldMax Vault...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Your existing contract addresses
  const USDC_ADDRESS = "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d";
  const STRATEGY_ENGINE = "0x0235d22774f60abbf779Fa289Fd1CCdD351c69bE";

  // 1. Deploy Enhanced Vault
  console.log("📦 Deploying Enhanced Vault...");
  const EnhancedVault = await hre.ethers.getContractFactory("EnhancedYieldMaxVault");
  const vault = await EnhancedVault.deploy(USDC_ADDRESS, STRATEGY_ENGINE);
  await vault.deployed();
  console.log("✅ Enhanced Vault deployed to:", vault.address);

  // 2. Deploy Mock Protocol Adapters (for testing)
  console.log("\n📦 Deploying Protocol Adapters...");
  
  const MockAdapter = await hre.ethers.getContractFactory("MockAaveAdapter");
  
  const aaveAdapter = await MockAdapter.deploy(USDC_ADDRESS);
  await aaveAdapter.deployed();
  console.log("✅ Aave Adapter:", aaveAdapter.address);
  
  const compoundAdapter = await MockAdapter.deploy(USDC_ADDRESS);
  await compoundAdapter.deployed();
  console.log("✅ Compound Adapter:", compoundAdapter.address);
  
  const yearnAdapter = await MockAdapter.deploy(USDC_ADDRESS);
  await yearnAdapter.deployed();
  console.log("✅ Yearn Adapter:", yearnAdapter.address);
  
  const curveAdapter = await MockAdapter.deploy(USDC_ADDRESS);
  await curveAdapter.deployed();
  console.log("✅ Curve Adapter:", curveAdapter.address);

  // 3. Initialize adapters in vault
  console.log("\n🔧 Initializing adapters...");
  await vault.initializeAdapters(
    aaveAdapter.address,
    compoundAdapter.address,
    yearnAdapter.address,
    curveAdapter.address
  );
  console.log("✅ Adapters initialized");

  // 4. Update your Automation Manager to call vault.executeStrategy()
  console.log("\n📋 Next Steps:");
  console.log("1. Update frontend to use new vault:", vault.address);
  console.log("2. Update Automation Manager to call vault.executeStrategy()");
  console.log("3. Test deposit → strategy execution → yield earning flow");

  console.log("\n🎉 Enhanced Vault Ready!");
  console.log("Features:");
  console.log("✅ Automatic strategy execution");
  console.log("✅ Yield tracking and distribution");
  console.log("✅ Multi-protocol support");
  console.log("✅ Emergency controls");

  // Save deployment
  const deployment = {
    enhancedVault: vault.address,
    adapters: {
      aave: aaveAdapter.address,
      compound: compoundAdapter.address,
      yearn: yearnAdapter.address,
      curve: curveAdapter.address
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n📄 Deployment addresses:");
  console.log(JSON.stringify(deployment, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });