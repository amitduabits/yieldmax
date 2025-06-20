// scripts/deploy-production.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying YieldMax Production Contracts...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 1. Deploy Enhanced Vault
  console.log("\n📦 Deploying YieldMax Vault...");
  const YieldMaxVault = await hre.ethers.getContractFactory("YieldMaxVault");
  const vault = await YieldMaxVault.deploy(
    "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // USDC on Sepolia
    "YieldMax Vault",
    "ymUSDC"
  );
  await vault.deployed();
  console.log("✅ Vault deployed to:", vault.address);

  // 2. Deploy Oracle Manager
  console.log("\n📦 Deploying Oracle Manager...");
  const OracleManager = await hre.ethers.getContractFactory("OracleManager");
  const oracleManager = await OracleManager.deploy();
  await oracleManager.deployed();
  console.log("✅ Oracle Manager deployed to:", oracleManager.address);

  // 3. Deploy Strategy Engine
  console.log("\n📦 Deploying Production Strategy Engine...");
  const StrategyEngine = await hre.ethers.getContractFactory("ProductionStrategyEngine");
  const strategyEngine = await StrategyEngine.deploy(vault.address);
  await strategyEngine.deployed();
  console.log("✅ Strategy Engine deployed to:", strategyEngine.address);

  // 4. Setup permissions
  console.log("\n🔧 Setting up permissions...");
  const STRATEGIST_ROLE = await vault.STRATEGIST_ROLE();
  await vault.grantRole(STRATEGIST_ROLE, strategyEngine.address);
  console.log("✅ Granted STRATEGIST_ROLE to Strategy Engine");

  // 5. Register with Chainlink Automation (manual step)
  console.log("\n📋 Next Steps:");
  console.log("1. Register Strategy Engine with Chainlink Automation:");
  console.log("   https://automation.chain.link/");
  console.log("   Contract:", strategyEngine.address);
  console.log("   Use 'Custom Logic' trigger");
  console.log("\n2. Fund the upkeep with LINK tokens");
  console.log("\n3. Verify contracts on Etherscan");

  // Save deployment addresses
  const deployment = {
    network: "sepolia",
    timestamp: new Date().toISOString(),
    contracts: {
      vault: vault.address,
      oracleManager: oracleManager.address,
      strategyEngine: strategyEngine.address,
      usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
    }
  };

  console.log("\n📄 Deployment Summary:");
  console.log(JSON.stringify(deployment, null, 2));

  // Save to file
  const fs = require("fs");
  fs.writeFileSync(
    `deployments/sepolia-${Date.now()}.json`,
    JSON.stringify(deployment, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });