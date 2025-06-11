// scripts/debug-vault.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging YieldMax Vault...\n");

  const [signer] = await ethers.getSigners();
  console.log("Your address:", signer.address);

  // Contract addresses
  const VAULT_ADDRESS = "0x7043148386eD44Df90905a3f1379C1E36eF9c49E";
  const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

  // Get contracts
  const vault = await ethers.getContractAt("YieldMaxVault", VAULT_ADDRESS);
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

  console.log("\n📊 Vault State:");
  console.log("================");

  try {
    // Check vault configuration
    const asset = await vault.asset();
    console.log("Asset address:", asset);
    console.log("Expected USDC:", USDC_ADDRESS);
    console.log("Asset matches:", asset.toLowerCase() === USDC_ADDRESS.toLowerCase());

    const owner = await vault.owner();
    console.log("\nOwner:", owner);
    console.log("You are owner:", owner.toLowerCase() === signer.address.toLowerCase());

    const keeper = await vault.keeper();
    console.log("\nKeeper:", keeper);
    console.log("You are keeper:", keeper.toLowerCase() === signer.address.toLowerCase());

    // Check balances
    const usdcBalance = await usdc.balanceOf(signer.address);
    console.log("\n💰 Your USDC Balance:", ethers.formatUnits(usdcBalance, 6));

    const vaultShares = await vault.balanceOf(signer.address);
    console.log("Your Vault Shares:", ethers.formatUnits(vaultShares, 6));

    const totalAssets = await vault.totalAssets();
    console.log("\n🏦 Vault Total Assets:", ethers.formatUnits(totalAssets, 6));

    const totalSupply = await vault.totalSupply();
    console.log("Vault Total Supply:", ethers.formatUnits(totalSupply, 6));

    // Check allowance
    const allowance = await usdc.allowance(signer.address, VAULT_ADDRESS);
    console.log("\n✅ USDC Allowance to Vault:", ethers.formatUnits(allowance, 6));

    // Check deposit parameters
    const maxDeposit = await vault.maxDeposit(signer.address);
    console.log("\n📈 Max Deposit:", ethers.formatUnits(maxDeposit, 6));

    // Try to preview deposit
    const depositAmount = ethers.parseUnits("1", 6); // 1 USDC
    try {
      const previewShares = await vault.previewDeposit(depositAmount);
      console.log("Preview: 1 USDC would give shares:", ethers.formatUnits(previewShares, 6));
    } catch (e) {
      console.log("Preview deposit failed:", e.message);
    }

    // Check if paused (if your contract has pause functionality)
    try {
      const paused = await vault.paused();
      console.log("\n⏸️  Vault Paused:", paused);
    } catch {
      console.log("\n⏸️  Vault doesn't have pause functionality");
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });