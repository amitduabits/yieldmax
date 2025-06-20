// scripts/deploy-simple-vault.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Simple Enhanced Vault...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Your contract addresses
  const USDC_ADDRESS = "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d";
  const STRATEGY_ENGINE = "0x0235d22774f60abbf779Fa289Fd1CCdD351c69bE";

  // Deploy Simple Enhanced Vault
  console.log("📦 Deploying Simple Enhanced Vault...");
  const SimpleVault = await hre.ethers.getContractFactory("SimpleEnhancedVault");
  const vault = await SimpleVault.deploy(USDC_ADDRESS, STRATEGY_ENGINE);
  await vault.deployed();
  console.log("✅ Vault deployed to:", vault.address);

  // Initialize with dummy adapter addresses (for tracking only)
  console.log("\n🔧 Initializing protocol adapters...");
  await vault.initializeAdapters(
    "0x0000000000000000000000000000000000000001", // Aave placeholder
    "0x0000000000000000000000000000000000000002", // Compound placeholder
    "0x0000000000000000000000000000000000000003", // Yearn placeholder
    "0x0000000000000000000000000000000000000004"  // Curve placeholder
  );
  console.log("✅ Adapters initialized");

  console.log("\n🎉 Simple Enhanced Vault deployed successfully!");
  console.log("\n📋 Vault Features:");
  console.log("✅ Tracks which protocol funds should be in");
  console.log("✅ Updates based on strategy recommendations");
  console.log("✅ Compatible with your existing frontend");
  console.log("✅ Works with Chainlink Automation");

  console.log("\n⚡ Next Steps:");
  console.log("1. Update frontend vault address to:", vault.address);
  console.log("2. Deploy automation connector");
  console.log("3. Update Chainlink Automation upkeep");

  // Deploy Automation Connector
  console.log("\n📦 Deploying Automation Connector...");
  const Connector = await hre.ethers.getContractFactory("AutomationVaultConnector");
  const connector = await Connector.deploy(vault.address, STRATEGY_ENGINE);
  await connector.deployed();
  console.log("✅ Automation Connector deployed to:", connector.address);

  console.log("\n🔗 Update your Chainlink Automation to use:", connector.address);
  console.log("This will automatically execute strategy changes!");

  return {
    vault: vault.address,
    connector: connector.address
  };
}

main()
  .then((addresses) => {
    console.log("\n📄 Summary:");
    console.log("Vault:", addresses.vault);
    console.log("Connector:", addresses.connector);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });