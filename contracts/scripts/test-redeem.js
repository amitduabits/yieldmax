// scripts/test-redeem.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Redeem Function...\n");

  const [signer] = await ethers.getSigners();
  const VAULT_ADDRESS = "0x0F9D181023b09Ea75Ce8E7c988B8C318e9f31cAe";

  const vault = await ethers.getContractAt("SimpleYieldMaxVault", VAULT_ADDRESS);

  // Check current state
  const shares = await vault.balanceOf(signer.address);
  console.log("Your Vault Shares:", ethers.formatUnits(shares, 6));

  if (shares > 0n) {
    // Try to redeem 1 share
    const redeemAmount = ethers.parseUnits("1", 6);
    
    console.log("\n💰 Attempting to redeem 1 share...");
    try {
      // Standard ERC4626 redeem: redeem(shares, receiver, owner)
      console.log("Calling redeem with:");
      console.log("  - Shares:", redeemAmount.toString());
      console.log("  - Receiver:", signer.address);
      console.log("  - Owner:", signer.address);
      
      const redeemTx = await vault.redeem(
        redeemAmount, 
        signer.address, // receiver
        signer.address  // owner
      );
      
      console.log("Transaction sent:", redeemTx.hash);
      
      const receipt = await redeemTx.wait();
      console.log("✅ Redeem successful!");
      
      // Check new balance
      const newShares = await vault.balanceOf(signer.address);
      console.log("\nYour remaining shares:", ethers.formatUnits(newShares, 6));
      
    } catch (error) {
      console.error("❌ Redeem failed!");
      console.error("Error:", error.message);
      
      if (error.data) {
        console.log("\nError data:", error.data);
      }
    }
  } else {
    console.log("❌ You don't have any shares to redeem!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });