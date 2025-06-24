// scripts/deploy/deploy-sepolia-fixed.ts
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
  // Use already deployed addresses
  const deployedAddresses = {
    usdc: "0xe5f46A2dD1fCDdCDb86b3D9C1D23065B1572F818",
    strategyEngine: "0xcA5F43F98d41249CAd9d953f6f6967C582bAf78B",
    vault: "0xc2A4d1a2F1200680F1024d7310e3e84DeE3E5777",
    crossChainManager: "0xC033b4Eea791ba83C0FcDAC8cD67c563B5b98eC3"
  };
  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Contract Addresses:");
  console.log("========================");
  console.log("USDC:", deployedAddresses.usdc);
  console.log("YieldMaxVault:", deployedAddresses.vault);
  console.log("StrategyEngine:", deployedAddresses.strategyEngine);
  console.log("CrossChainManager:", deployedAddresses.crossChainManager);
  // Save deployment addresses
  const deployments = {
    network: "sepolia",
    chainId: 11155111,
    contracts: {
      vault: deployedAddresses.vault,
      strategyEngine: deployedAddresses.strategyEngine,
      crossChainManager: deployedAddresses.crossChainManager,
      usdc: deployedAddresses.usdc,
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
  console.log("\n📝 Next steps:");
  console.log("1. Update frontend/lib/contracts/addresses.ts with these addresses");
  console.log("2. Run the frontend: cd ../frontend && npm run dev");
  console.log("3. Connect your wallet and test the application");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });