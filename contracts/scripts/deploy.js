// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying YieldMax Protocol...\n");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()));
  
  // Deploy Mock USDC first
  console.log("\n📦 Deploying Mock USDC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.deployed();
  console.log("✅ USDC deployed to:", usdc.address);
  
  // Deploy Strategy Engine
  console.log("\n📦 Deploying Strategy Engine...");
  const StrategyEngine = await ethers.getContractFactory("StrategyEngine");
  const strategyEngine = await StrategyEngine.deploy();
  await strategyEngine.deployed();
  console.log("✅ Strategy Engine deployed to:", strategyEngine.address);
  
  // Deploy YieldMax Vault
  console.log("\n📦 Deploying YieldMax Vault...");
  const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault");
  const vault = await YieldMaxVault.deploy(
    usdc.address,
    strategyEngine.address,
    deployer.address // keeper
  );
  await vault.deployed();
  console.log("✅ Vault deployed to:", vault.address);
  
  // Setup initial configuration
  console.log("\n⚙️  Initial setup...");
  
  // Mint USDC to deployer for testing
  const mintAmount = ethers.utils.parseUnits("1000000", 6); // 1M USDC
  await usdc.mint(deployer.address, mintAmount);
  console.log("✅ Minted 1,000,000 USDC to deployer");
  
  // Approve vault to spend USDC
  await usdc.approve(vault.address, ethers.constants.MaxUint256);
  console.log("✅ Approved vault to spend USDC");
  
  // Save deployment addresses
  const deployment = {
    network: network.name,
    usdc: usdc.address,
    strategyEngine: strategyEngine.address,
    vault: vault.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("========================");
  console.log("Network:", network.name);
  console.log("USDC:", usdc.address);
  console.log("Strategy Engine:", strategyEngine.address);
  console.log("Vault:", vault.address);
  console.log("Deployer:", deployer.address);
  
  // Save to file
  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const filename = `${network.name}-deployment.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deployment, null, 2)
  );
  
  console.log(`\n💾 Deployment saved to deployments/${filename}`);
  console.log("\n✅ Deployment complete!");
  
  // Quick test
  console.log("\n🧪 Running quick test...");
  
  // Test deposit
  const depositAmount = ethers.utils.parseUnits("10000", 6); // 10k USDC
  const tx = await vault.deposit(depositAmount, deployer.address);
  await tx.wait();
  
  const shares = await vault.getUserShares(deployer.address);
  console.log("✅ Test deposit successful!");
  console.log("   Deposited:", ethers.utils.formatUnits(depositAmount, 6), "USDC");
  console.log("   Received:", ethers.utils.formatUnits(shares, 6), "shares");
  
  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });