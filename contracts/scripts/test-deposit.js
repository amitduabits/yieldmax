// scripts/test-deposit.js
const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  console.log(`\n💰 Testing deposit on ${network}\n`);
  
  // Load deployment
  const deployment = require(`../deployments/${network}.json`);
  const vaultAddress = deployment.contracts.YieldMaxVault;
  const usdcAddress = deployment.configuration.usdc;
  
  // Get signer
  const [signer] = await hre.ethers.getSigners();
  
  // Get contracts
  const vault = await hre.ethers.getContractAt("YieldMaxVault", vaultAddress);
  const usdc = await hre.ethers.getContractAt("IERC20", usdcAddress);
  
  // Check USDC balance
  const usdcBalance = await usdc.balanceOf(signer.address);
  console.log("Your USDC Balance:", hre.ethers.formatUnits(usdcBalance, 6), "USDC");
  
  if (usdcBalance == 0n) {
    console.log("\n⚠️  You need test USDC first!");
    console.log("Get some from: https://app.aave.com/faucet/");
    return;
  }
  
  // Test small deposit
  const depositAmount = hre.ethers.parseUnits("10", 6); // 10 USDC
  
  if (usdcBalance < depositAmount) {
    console.log("\n⚠️  Insufficient USDC balance for test deposit");
    return;
  }
  
  console.log("\n🔄 Testing deposit of 10 USDC...");
  
  try {
    // Approve USDC
    console.log("1. Approving USDC...");
    const approveTx = await usdc.approve(vaultAddress, depositAmount);
    await approveTx.wait();
    console.log("✅ Approved");
    
    // Deposit
    console.log("2. Depositing...");
    const depositTx = await vault.deposit(depositAmount, signer.address);
    const receipt = await depositTx.wait();
    console.log("✅ Deposited");
    console.log("Transaction:", receipt.hash);
    
    // Check new balances
    const newShares = await vault.balanceOf(signer.address);
    const newUsdcBalance = await usdc.balanceOf(signer.address);
    const vaultTotal = await vault.totalAssets();
    
    console.log("\n📊 After Deposit:");
    console.log("- Your Shares:", newShares.toString());
    console.log("- Your USDC:", hre.ethers.formatUnits(newUsdcBalance, 6), "USDC");
    console.log("- Vault Total Assets:", hre.ethers.formatUnits(vaultTotal, 6), "USDC");
    
  } catch (error) {
    console.error("Deposit failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });