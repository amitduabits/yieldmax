// scripts/test-vault.js
const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  console.log("\n🧪 Testing YieldMax Vault on", network, "\n");
  
  // Load deployment
  const deployment = require(`../deployments/${network}.json`);
  const vaultAddress = deployment.contracts.YieldMaxVault;
  
  console.log("Vault Address:", vaultAddress);
  
  // Get contract instance
  const vault = await hre.ethers.getContractAt("YieldMaxVault", vaultAddress);
  
  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Your Address:", signer.address);
  
  // Read contract state
  console.log("\n📊 Vault State:");
  console.log("- Asset (USDC):", await vault.asset());
  console.log("- Total Assets:", (await vault.totalAssets()).toString());
  console.log("- Total Shares:", (await vault.totalShares()).toString());
  console.log("- Owner:", await vault.owner());
  console.log("- Keeper:", await vault.keeper());
  
  // Check your balance
  const yourShares = await vault.balanceOf(signer.address);
  console.log("\n💰 Your Position:");
  console.log("- Shares:", yourShares.toString());
  
  // Get USDC contract
  const usdcAddress = await vault.asset();
  const usdc = await hre.ethers.getContractAt("IERC20", usdcAddress);
  const usdcBalance = await usdc.balanceOf(signer.address);
  console.log("- USDC Balance:", hre.ethers.formatUnits(usdcBalance, 6), "USDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });