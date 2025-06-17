// scripts/test-deployment.js
const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing YieldMax Deployment...");
    
    // Load deployment info
    const deploymentInfo = require("../deployments/sepolia-complete.json");
    const [deployer] = await ethers.getSigners();
    
    // Get contract instances
    const usdc = await ethers.getContractAt("MockERC20", deploymentInfo.contracts.usdc);
    const vault = await ethers.getContractAt("YieldMaxVault", deploymentInfo.contracts.vault);
    
    try {
        // 1. Check USDC balance
        const usdcBalance = await usdc.balanceOf(deployer.address);
        console.log("1️⃣ USDC Balance:", ethers.utils.formatUnits(usdcBalance, 6));
        
        // 2. Test deposit
        console.log("\n2️⃣ Testing deposit...");
        const depositAmount = ethers.utils.parseUnits("100", 6); // 100 USDC
        
        await usdc.approve(vault.address, depositAmount);
        const tx = await vault.deposit(depositAmount, deployer.address);
        await tx.wait();
        
        console.log("✅ Deposit successful!");
        
        // 3. Check vault state
        const totalAssets = await vault.totalAssets();
        const totalShares = await vault.totalShares();
        const userData = await vault.getUserData(deployer.address);
        
        console.log("\n3️⃣ Vault State:");
        console.log("   Total Assets:", ethers.utils.formatUnits(totalAssets, 6));
        console.log("   Total Shares:", ethers.utils.formatUnits(totalShares, 6));
        console.log("   User Shares:", ethers.utils.formatUnits(userData.shares, 6));
        
        // 4. Test withdrawal request
        console.log("\n4️⃣ Testing withdrawal request...");
        const withdrawShares = ethers.utils.parseUnits("50", 6); // 50 shares
        
        const withdrawTx = await vault.requestWithdraw(withdrawShares);
        const withdrawReceipt = await withdrawTx.wait();
        
        console.log("✅ Withdrawal request successful!");
        
        console.log("\n🎉 All tests passed! YieldMax is working correctly.");
        
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });