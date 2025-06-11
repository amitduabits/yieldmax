// scripts/simple-debug.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Simple Debug for YieldMax Vault...\n");

  const [signer] = await ethers.getSigners();
  console.log("Your address:", signer.address);

  // Contract addresses
  const VAULT_ADDRESS = "0x7043148386eD44Df90905a3f1379C1E36eF9c49E";
  const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

  // First, let's check if the contracts exist
  const vaultCode = await ethers.provider.getCode(VAULT_ADDRESS);
  const usdcCode = await ethers.provider.getCode(USDC_ADDRESS);
  
  console.log("\n📍 Contract Deployment Status:");
  console.log("Vault deployed:", vaultCode !== "0x");
  console.log("USDC deployed:", usdcCode !== "0x");

  if (vaultCode === "0x") {
    console.log("\n❌ Vault contract not found at this address!");
    console.log("Please check if you deployed to the correct network and address.");
    return;
  }

  // Get minimal ABI just for basic checks
  const minimalABI = [
    "function owner() view returns (address)",
    "function asset() view returns (address)",
    "function totalAssets() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
  ];

  const vault = new ethers.Contract(VAULT_ADDRESS, minimalABI, signer);

  try {
    console.log("\n🔍 Basic Vault Info:");
    
    // Try owner
    try {
      const owner = await vault.owner();
      console.log("Owner:", owner);
    } catch (e) {
      console.log("Owner: Error -", e.reason || e.message);
    }

    // Try asset
    try {
      const asset = await vault.asset();
      console.log("Asset:", asset);
    } catch (e) {
      console.log("Asset: Error -", e.reason || e.message);
    }

    // Try totalAssets
    try {
      const totalAssets = await vault.totalAssets();
      console.log("Total Assets:", totalAssets.toString());
    } catch (e) {
      console.log("Total Assets: Error -", e.reason || e.message);
    }

    // Check your balance
    try {
      const balance = await vault.balanceOf(signer.address);
      console.log("Your Balance:", balance.toString());
    } catch (e) {
      console.log("Balance: Error -", e.reason || e.message);
    }

  } catch (error) {
    console.error("\n❌ General Error:", error.message);
  }

  // Let's also check your USDC balance
  const usdcABI = ["function balanceOf(address) view returns (uint256)"];
  const usdc = new ethers.Contract(USDC_ADDRESS, usdcABI, signer);
  
  try {
    const usdcBalance = await usdc.balanceOf(signer.address);
    console.log("\n💰 Your USDC Balance:", ethers.formatUnits(usdcBalance, 6), "USDC");
  } catch (e) {
    console.log("\n💰 USDC Balance: Error -", e.reason || e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });