// scripts/test-complete-system.js
const { ethers } = require("hardhat");
const chalk = require("chalk");

async function main() {
  console.log(chalk.bold.blue("\n🧪 Testing Complete YieldMax System\n"));

  // Load deployment
  const network = await ethers.provider.getNetwork();
  const networkName = network.chainId === 11155111n ? "sepolia" : "arbitrumSepolia";
  const deployment = require(`../deployments/${networkName}-complete.json`);
  
  const [user] = await ethers.getSigners();
  console.log("Testing with account:", user.address);

  // Get contracts
  const vault = await ethers.getContractAt("EnhancedYieldMaxVaultV2", deployment.contracts.vault);
  const aiOptimizer = await ethers.getContractAt("YieldMaxAIOptimizer", deployment.contracts.aiOptimizer);
  const usdc = await ethers.getContractAt("MockERC20", deployment.contracts.usdc);

  console.log("\n" + chalk.yellow("1. Testing Deposit Flow"));
  console.log("=====================================");

  // Mint test USDC
  console.log("- Minting 10,000 USDC...");
  const mintAmount = ethers.parseUnits("10000", 6);
  await usdc.mint(user.address, mintAmount);
  
  const balance = await usdc.balanceOf(user.address);
  console.log(chalk.green(`✓ Balance: ${ethers.formatUnits(balance, 6)} USDC`));

  // Approve vault
  console.log("- Approving vault...");
  await usdc.approve(vault.address, mintAmount);
  console.log(chalk.green("✓ Approved"));

  // Deposit
  console.log("- Depositing 1,000 USDC...");
  const depositAmount = ethers.parseUnits("1000", 6);
  const tx = await vault.deposit(depositAmount, user.address);
  await tx.wait();
  
  const shares = await vault.balanceOf(user.address);
  console.log(chalk.green(`✓ Received ${ethers.formatUnits(shares, 6)} shares`));

  console.log("\n" + chalk.yellow("2. Testing AI Optimization"));
  console.log("=====================================");

  // Check current strategy
  console.log("- Current strategy:", await vault.currentStrategyId());
  
  // Get AI recommendation
  console.log("- Getting AI recommendation...");
  const [optimalStrategy, confidence] = await aiOptimizer.calculateOptimalStrategy(
    vault.address,
    0, // Current strategy
    50 // Risk tolerance
  );
  
  console.log(chalk.green(`✓ Recommended strategy: ${optimalStrategy} (confidence: ${confidence}%)`));

  // Get strategy details
  const strategy = await aiOptimizer.getStrategy(optimalStrategy);
  console.log(`  Name: ${strategy[0]}`);
  console.log(`  Expected APY: ${strategy[3] / 100}%`);
  console.log(`  Risk Score: ${strategy[4]}/100`);

  console.log("\n" + chalk.yellow("3. Testing Rebalance"));
  console.log("=====================================");

  // Grant keeper role to test account
  const KEEPER_ROLE = await vault.KEEPER_ROLE();
  await vault.grantRole(KEEPER_ROLE, user.address);
  
  // Execute rebalance
  console.log("- Executing rebalance check...");
  const rebalanceTx = await vault.checkAndRebalance();
  const receipt = await rebalanceTx.wait();
  
  const rebalanced = receipt.events?.some(e => e.event === "StrategyChanged");
  console.log(chalk.green(`✓ Rebalance executed (strategy changed: ${rebalanced})`));

  console.log("\n" + chalk.yellow("4. Testing Automation"));
  console.log("=====================================");

  const automationConnector = await ethers.getContractAt(
    "EnhancedAutomationConnector",
    deployment.contracts.automationConnector
  );

  // Check upkeep
  console.log("- Checking if upkeep needed...");
  const [upkeepNeeded] = await automationConnector.checkUpkeep("0x");
  console.log(chalk.green(`✓ Upkeep needed: ${upkeepNeeded}`));

  // Get status
  const status = await automationConnector.getStatus();
  console.log(`  Health: ${status[0] ? chalk.green("Healthy") : chalk.red("Unhealthy")}`);
  console.log(`  Current APY: ${status[1] / 100}%`);
  console.log(`  Total Assets: $${ethers.formatUnits(status[2], 6)}`);

  console.log("\n" + chalk.yellow("5. Testing Withdrawal"));
  console.log("=====================================");

  // Withdraw half
  console.log("- Withdrawing 50% of shares...");
  const withdrawShares = shares / 2n;
  const withdrawTx = await vault.withdraw(withdrawShares, user.address, user.address);
  await withdrawTx.wait();
  
  const newBalance = await usdc.balanceOf(user.address);
  const withdrawn = newBalance - (balance - depositAmount);
  console.log(chalk.green(`✓ Withdrawn ${ethers.formatUnits(withdrawn, 6)} USDC`));

  console.log("\n" + chalk.yellow("6. System Summary"));
  console.log("=====================================");
  
  const totalAssets = await vault.totalAssets();
  const currentAPY = await vault.getCurrentAPY();
  const totalSupply = await vault.totalSupply();
  
  console.log(`Total Assets Under Management: $${ethers.formatUnits(totalAssets, 6)}`);
  console.log(`Current APY: ${currentAPY / 100}%`);
  console.log(`Total Shares: ${ethers.formatUnits(totalSupply, 6)}`);
  console.log(`Current Strategy: ${await vault.currentStrategyId()}`);

  console.log(chalk.bold.green("\n✅ All tests passed!\n"));

  console.log(chalk.bold("🎯 Next Steps:"));
  console.log("1. Deploy to production networks");
  console.log("2. Add more protocol integrations");
  console.log("3. Implement cross-chain functionality");
  console.log("4. Add real AI model with Chainlink Functions");
  console.log("5. Integrate with frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(chalk.red("Test failed:"), error);
    process.exit(1);
  });