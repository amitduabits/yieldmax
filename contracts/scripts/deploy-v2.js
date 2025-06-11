// scripts/deploy-v2.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying YieldMaxVaultV2 (ERC4626 Compliant)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC

  // Deploy YieldMaxVaultV2
  console.log("📄 Deploying YieldMaxVaultV2...");
  const YieldMaxVaultV2 = await ethers.getContractFactory("YieldMaxVaultV2");
  
  const vault = await YieldMaxVaultV2.deploy(
    USDC_ADDRESS,
    "YieldMax USDC Vault",
    "ymUSDC"
  );

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log("✅ YieldMaxVaultV2 deployed to:", vaultAddress);

  // Wait for confirmations
  console.log("\n⏳ Waiting for confirmations...");
  await vault.deploymentTransaction().wait(3);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  console.log("Owner:", await vault.owner());
  console.log("Asset:", await vault.asset());
  console.log("Name:", await vault.name());
  console.log("Symbol:", await vault.symbol());
  console.log("Decimals:", await vault.decimals());
  console.log("Keeper:", await vault.keeper());
  console.log("Total Assets:", await vault.totalAssets());

  console.log("\n🎉 Deployment complete!");
  console.log("\n⚡ Update your frontend config:");
  console.log(`vault: '${vaultAddress}'`);

  return vaultAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });