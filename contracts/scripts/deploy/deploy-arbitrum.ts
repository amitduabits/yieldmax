// scripts/deploy/deploy-arbitrum.ts
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting YieldMax deployment to Arbitrum Sepolia...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  if (balance.eq(0)) {
    throw new Error("Deployer account has no ETH. Please fund it first.");
  }

  // Deploy Mock USDC on Arbitrum Sepolia
  console.log("\n📦 Deploying Mock USDC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.deployed();
  const usdcAddress = usdc.address;
  console.log("✅ Mock USDC deployed to:", usdcAddress);
  
  // Mint some test USDC to the deployer
  await usdc.mint(deployer.address, ethers.utils.parseUnits("10000", 6));
  console.log("✅ Minted 10,000 USDC to deployer");

  // Deploy StrategyEngine
  console.log("\n📦 Deploying StrategyEngine...");
  const StrategyEngine = await ethers.getContractFactory("StrategyEngine");
  const strategyEngine = await StrategyEngine.deploy();
  await strategyEngine.deployed();
  console.log("✅ StrategyEngine deployed to:", strategyEngine.address);

  // Deploy YieldMaxVault
  console.log("\n📦 Deploying YieldMaxVault...");
  const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault");
  const vault = await YieldMaxVault.deploy(
    usdcAddress,
    strategyEngine.address,
    deployer.address // keeper address
  );
  await vault.deployed();
  console.log("✅ YieldMaxVault deployed to:", vault.address);

  // Deploy CrossChainManager
  console.log("\n📦 Deploying CrossChainManager...");
  const CrossChainManager = await ethers.getContractFactory("CrossChainManager");
  const crossChainManager = await CrossChainManager.deploy(
    vault.address,
    "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165", // Arbitrum Sepolia CCIP Router
    "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E"  // Arbitrum Sepolia LINK Token
  );
  await crossChainManager.deployed();
  console.log("✅ CrossChainManager deployed to:", crossChainManager.address);

  // Setup initial configuration
  console.log("\n⚙️  Setting up contracts...");
  
  // Authorize vault in strategy engine
  await strategyEngine.authorizeVault(vault.address);
  console.log("✅ Vault authorized in StrategyEngine");

  // Note: YieldMaxVault doesn't have setCrossChainManager function
  // The vault and cross-chain manager are already connected through deployment

  // Configure Sepolia chain in CrossChainManager (for receiving from Sepolia)
  const SEPOLIA_CHAIN_SELECTOR = "16015286601757825753";
  const sepoliaDeploymentPath = path.join(__dirname, "../../deployments/sepolia.json");
  
  if (fs.existsSync(sepoliaDeploymentPath)) {
    const sepoliaDeployment = JSON.parse(fs.readFileSync(sepoliaDeploymentPath, "utf8"));
    await crossChainManager.configureChain(
      SEPOLIA_CHAIN_SELECTOR,
      sepoliaDeployment.contracts.vault
    );
    console.log("✅ Configured Sepolia chain for cross-chain operations");
  }

  // Save deployment addresses
  const deployments = {
    network: "arbitrumSepolia",
    chainId: 421614,
    contracts: {
      vault: vault.address,
      strategyEngine: strategyEngine.address,
      crossChainManager: crossChainManager.address,
      usdc: usdcAddress,
      chainlinkRouter: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
      linkToken: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentPath = path.join(deploymentsDir, "arbitrumSepolia.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));
  
  console.log("\n📄 Deployment addresses saved to:", deploymentPath);
  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Contract Addresses:");
  console.log("========================");
  console.log("USDC:", usdcAddress);
  console.log("YieldMaxVault:", vault.address);
  console.log("StrategyEngine:", strategyEngine.address);
  console.log("CrossChainManager:", crossChainManager.address);
  
  console.log("\n📝 Next steps:");
  console.log("1. Update frontend/lib/contracts/addresses.ts with these addresses");
  console.log("2. Configure cross-chain connection on Sepolia");
  console.log("3. Fund CrossChainManager with LINK tokens for CCIP fees");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });