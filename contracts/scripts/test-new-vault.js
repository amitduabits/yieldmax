// scripts/test-new-vault.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing New YieldMax Vault...\n");

  const [signer] = await ethers.getSigners();
  console.log("Testing with address:", signer.address);

  // Get vault address from command line or use default
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "YOUR_NEW_VAULT_ADDRESS";
  const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC

  console.log("Vault Address:", VAULT_ADDRESS);
  console.log("USDC Address:", USDC_ADDRESS);

  // Get contracts
  const vault = await ethers.getContractAt("YieldMaxVault", VAULT_ADDRESS);
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

  // Check initial state
  console.log("\n📊 Initial State:");
  const usdcBalance = await usdc.balanceOf(signer.address);
  console.log("Your USDC Balance:", ethers.formatUnits(usdcBalance, 6), "USDC");

  const vaultShares = await vault.balanceOf(signer.address);
  console.log("Your Vault Shares:", ethers.formatUnits(vaultShares, 6));

  const totalAssets = await vault.totalAssets();
  console.log("Vault Total Assets:", ethers.formatUnits(totalAssets, 6), "USDC");

  // Test deposit if user has USDC
  if (usdcBalance > 0n) {
    console.log("\n💰 Testing Deposit...");
    
    const depositAmount = ethers.parseUnits("1", 6); // 1 USDC
    console.log("Depositing:", ethers.formatUnits(depositAmount, 6), "USDC");

    // Approve
    console.log("1. Approving USDC...");
    const approveTx = await usdc.approve(VAULT_ADDRESS, depositAmount);
    await approveTx.wait();
    console.log("✅ Approved");

    // Deposit
    console.log("2. Depositing...");
    try {
      // ERC4626 deposit function: deposit(uint256 assets, address receiver)
      const depositTx = await vault.deposit(depositAmount, signer.address);
      const receipt = await depositTx.wait();
      console.log("✅ Deposited!");
      console.log("Transaction:", receipt.hash);

      // Check new balances
      console.log("\n📊 After Deposit:");
      const newUsdcBalance = await usdc.balanceOf(signer.address);
      console.log("Your USDC Balance:", ethers.formatUnits(newUsdcBalance, 6), "USDC");

      const newVaultShares = await vault.balanceOf(signer.address);
      console.log("Your Vault Shares:", ethers.formatUnits(newVaultShares, 6));

      const newTotalAssets = await vault.totalAssets();
      console.log("Vault Total Assets:", ethers.formatUnits(newTotalAssets, 6), "USDC");

    } catch (error) {
      console.error("❌ Deposit failed:", error.message);
      
      // Try to get more details
      if (error.data) {
        try {
          const decodedError = vault.interface.parseError(error.data);
          console.log("Error details:", decodedError);
        } catch {
          console.log("Raw error data:", error.data);
        }
      }
    }
  } else {
    console.log("\n⚠️  You don't have any USDC to test deposits");
    console.log("Get some from: https://sepoliafaucet.com/");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });