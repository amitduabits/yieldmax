// scripts/deploy-simple-vault.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Simple YieldMax Vault...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC

  // Deploy SimpleYieldMaxVault
  console.log("📄 Deploying SimpleYieldMaxVault...");
  const SimpleYieldMaxVault = await ethers.getContractFactory("SimpleYieldMaxVault");
  
  const vault = await SimpleYieldMaxVault.deploy(USDC_ADDRESS);

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log("✅ SimpleYieldMaxVault deployed to:", vaultAddress);

  // Wait for confirmations
  console.log("\n⏳ Waiting for confirmations...");
  await vault.deploymentTransaction().wait(3);

  // Test the deployment
  console.log("\n🔍 Testing deployment...");
  try {
    console.log("Owner:", await vault.owner());
    console.log("Asset:", await vault.asset());
    console.log("Name:", await vault.name());
    console.log("Symbol:", await vault.symbol());
    console.log("Decimals:", await vault.decimals());
    console.log("Total Assets:", await vault.totalAssets());
    console.log("Total Supply:", await vault.totalSupply());
    
    // Test preview functions
    const testAmount = ethers.parseUnits("1", 6);
    console.log("Preview deposit 1 USDC:", await vault.previewDeposit(testAmount));
    console.log("Max deposit:", await vault.maxDeposit(deployer.address));
  } catch (e) {
    console.error("Test error:", e.message);
  }

  console.log("\n🎉 Deployment complete!");
  console.log("\n⚡ Update your frontend config:");
  console.log(`vault: '${vaultAddress}'`);

  // Quick test script
  console.log("\n📝 Test command:");
  console.log(`VAULT_ADDRESS=${vaultAddress} npx hardhat run scripts/test-new-vault.js --network sepolia`);

  return vaultAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });