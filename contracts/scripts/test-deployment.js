// scripts/test-deployment.js
const hre = require("hardhat");

async function main() {
  const [deployer, user1] = await hre.ethers.getSigners();
  
  // Load deployment
  const deployment = require(`../deployments/${hre.network.name}.json`);
  
  console.log("\n🧪 Testing YieldMax Deployment\n");
  
  // Get contract instances
  const vault = await hre.ethers.getContractAt("YieldMaxVault", deployment.contracts.YieldMaxVault);
  const usdc = await hre.ethers.getContractAt("IERC20", deployment.configuration.usdc);
  
  // Test deposit (you'll need test USDC first)
  console.log("Testing deposit functionality...");
  
  try {
    // Check USDC balance
    const balance = await usdc.balanceOf(deployer.address);
    console.log("USDC Balance:", hre.ethers.formatUnits(balance, 6));
    
    if (balance > 0) {
      // Approve and deposit
      const amount = hre.ethers.parseUnits("100", 6); // 100 USDC
      console.log("Approving USDC...");
      const approveTx = await usdc.approve(deployment.contracts.YieldMaxVault, amount);
      await approveTx.wait();
      
      console.log("Depositing USDC...");
      const depositTx = await vault.deposit(amount, deployer.address);
      await depositTx.wait();
      
      console.log("✅ Deposit successful!");
      
      // Check shares
      const userData = await vault.userData(deployer.address);
      console.log("User shares:", userData.shares.toString());
    } else {
      console.log("⚠️  No USDC balance. Get test USDC from faucet first.");
    }
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

