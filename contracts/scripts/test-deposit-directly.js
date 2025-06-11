// scripts/test-deposit-directly.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Direct Deposit...\n");

  const [signer] = await ethers.getSigners();
  const VAULT_ADDRESS = "0x0F9D181023b09Ea75Ce8E7c988B8C318e9f31cAe";
  const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

  const vault = await ethers.getContractAt("SimpleYieldMaxVault", VAULT_ADDRESS);
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

  // Check current state
  const usdcBalance = await usdc.balanceOf(signer.address);
  console.log("Your USDC Balance:", ethers.formatUnits(usdcBalance, 6), "USDC");

  const allowance = await usdc.allowance(signer.address, VAULT_ADDRESS);
  console.log("Current Allowance:", ethers.formatUnits(allowance, 6), "USDC");

  if (usdcBalance > 0n) {
    const depositAmount = ethers.parseUnits("1", 6); // 1 USDC
    
    // Check if we need approval
    if (allowance < depositAmount) {
      console.log("\n📝 Approving USDC...");
      const approveTx = await usdc.approve(VAULT_ADDRESS, depositAmount);
      await approveTx.wait();
      console.log("✅ Approved!");
    }

    console.log("\n💰 Attempting deposit...");
    try {
      // Try the standard ERC4626 deposit
      console.log("Calling deposit with:");
      console.log("  - Amount:", depositAmount.toString());
      console.log("  - Receiver:", signer.address);
      
      const depositTx = await vault.deposit(depositAmount, signer.address);
      console.log("Transaction sent:", depositTx.hash);
      
      const receipt = await depositTx.wait();
      console.log("✅ Deposit successful!");
      
      // Check new balance
      const newShares = await vault.balanceOf(signer.address);
      console.log("\nYour new shares:", ethers.formatUnits(newShares, 6));
      
    } catch (error) {
      console.error("❌ Deposit failed!");
      console.error("Error:", error.message);
      
      // Try to decode the error
      if (error.data) {
        console.log("\nError data:", error.data);
        try {
          const decodedError = vault.interface.parseError(error.data);
          console.log("Decoded error:", decodedError);
        } catch {
          // Try common ERC4626 errors
          if (error.data.includes("0x")) {
            console.log("Raw revert data:", error.data);
          }
        }
      }
      
      // Check if it's a gas issue
      if (error.message.includes("gas")) {
        console.log("\n💡 Might be a gas estimation issue");
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });