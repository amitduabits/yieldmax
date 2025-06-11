// scripts/test-vault-on-network.js
const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  console.log(`\n🧪 Testing YieldMax on ${network}\n`);
  
  // Load deployment for current network
  let deployment;
  try {
    deployment = require(`../deployments/${network}.json`);
  } catch (error) {
    console.error(`No deployment found for ${network}`);
    return;
  }
  
  const vaultAddress = deployment.contracts.YieldMaxVault;
  console.log("Vault Address:", vaultAddress);
  
  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Testing with address:", signer.address);
  
  // Get contract with ABI
  const YieldMaxVault = await hre.ethers.getContractFactory("YieldMaxVault");
  const vault = YieldMaxVault.attach(vaultAddress);
  
  try {
    // Test read functions
    console.log("\n📊 Contract State:");
    const totalAssets = await vault.totalAssets();
    console.log("- Total Assets:", totalAssets.toString());
    
    const totalShares = await vault.totalShares();
    console.log("- Total Shares:", totalShares.toString());
    
    const asset = await vault.asset();
    console.log("- Asset (USDC):", asset);
    
    const owner = await vault.owner();
    console.log("- Owner:", owner);
    
    const keeper = await vault.keeper();
    console.log("- Keeper:", keeper);
    
    // Check user balance
    const balance = await vault.balanceOf(signer.address);
    console.log("\n💰 Your Balance:");
    console.log("- Shares:", balance.toString());
    
    // Check USDC
    const usdc = await hre.ethers.getContractAt("IERC20", asset);
    const usdcBalance = await usdc.balanceOf(signer.address);
    console.log("- USDC Balance:", hre.ethers.formatUnits(usdcBalance, 6), "USDC");
    
    // Check vault's USDC balance
    const vaultUsdcBalance = await usdc.balanceOf(vaultAddress);
    console.log("\n🏦 Vault Holdings:");
    console.log("- USDC in Vault:", hre.ethers.formatUnits(vaultUsdcBalance, 6), "USDC");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });