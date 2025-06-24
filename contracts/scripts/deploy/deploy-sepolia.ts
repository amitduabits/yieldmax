// scripts/deploy/deploy-sepolia.ts
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting YieldMax deployment to Sepolia...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  if (balance.eq(0)) {
    throw new Error("Deployer account has no ETH. Please fund it first.");
  }

  // Use existing USDC on Sepolia or deploy mock
  let usdcAddress: string;
  
  // Sepolia USDC address (if available)
  const SEPOLIA_USDC = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"; // Aave Sepolia USDC
  
  // Check if we should use existing USDC or deploy mock
  const useExistingUSDC = false; // Set to true if you want to use existing USDC
  
  if (useExistingUSDC) {
    usdcAddress = SEPOLIA_USDC;
    console.log("✅ Using existing USDC at:", usdcAddress);
  } else {
    // First, let's check if MockERC20 exists in contracts directory
    const mockPath = path.join(__dirname, "../../contracts/test/MockERC20.sol");
    if (!fs.existsSync(mockPath)) {
      // Copy from test/mocks if it exists there
      const sourcePath = path.join(__dirname, "../../test/mocks/MockERC20.sol");
      if (fs.existsSync(sourcePath)) {
        const destDir = path.join(__dirname, "../../contracts/test");
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(sourcePath, mockPath);
        console.log("✅ Copied MockERC20.sol to contracts/test/");
      }
    }
    
    console.log("\n📦 Deploying Mock USDC...");
    try {
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
      await usdc.deployed();
      usdcAddress = usdc.address;
      console.log("✅ Mock USDC deployed to:", usdcAddress);
      
      // Mint some test USDC to the deployer
      await usdc.mint(deployer.address, ethers.utils.parseUnits("10000", 6));
      console.log("✅ Minted 10,000 USDC to deployer");
    } catch (error) {
      console.error("❌ Failed to deploy MockERC20:", error);
      console.log("Using Aave Sepolia USDC instead...");
      usdcAddress = SEPOLIA_USDC;
    }
  }

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
    "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59", // Sepolia CCIP Router
    "0x779877A7B0D9E8603169DdbD7836e478b4624789"  // Sepolia LINK Token
  );
  await crossChainManager.deployed();
  console.log("✅ CrossChainManager deployed to:", crossChainManager.address);

  // Setup initial configuration
  console.log("\n⚙️  Setting up contracts...");
  
  // Authorize vault in strategy engine
  await strategyEngine.authorizeVault(vault.address);
  console.log("✅ Vault authorized in StrategyEngine");

  // Set cross-chain manager in vault
  await vault.setCrossChainManager(crossChainManager.address);
  console.log("✅ CrossChainManager set in Vault");

  // Save deployment addresses
  const deployments = {
    network: "sepolia",
    chainId: 11155111,
    contracts: {
      vault: vault.address,
      strategyEngine: strategyEngine.address,
      crossChainManager: crossChainManager.address,
      usdc: usdcAddress,
      chainlinkRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
      linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
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
  const deploymentPath = path.join(deploymentsDir, "sepolia.json");
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
  console.log("2. Verify contracts on Etherscan");
  console.log("3. Setup Chainlink Automation");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });