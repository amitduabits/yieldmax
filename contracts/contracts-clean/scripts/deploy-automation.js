const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying YieldMax with Chainlink Automation...\n");

  const [deployer] = await ethers.getSigners();
  console.log("💰 Deployer:", deployer.address);
  console.log("💸 Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  try {
    // Deploy AutomatedStrategyEngine
    console.log("🤖 Deploying AutomatedStrategyEngine...");
    const AutomatedStrategyEngine = await ethers.getContractFactory("AutomatedStrategyEngine");
    const strategy = await AutomatedStrategyEngine.deploy();
    await strategy.deployed();
    console.log("   ✅ Automated Strategy Engine deployed to:", strategy.address);

    // Set vault address (your existing vault)
    const VAULT_ADDRESS = "0xECbA31cf51F88BA5193186abf35225ECE097df44";
    console.log("\n🔗 Linking to existing vault...");
    await strategy.setVault(VAULT_ADDRESS);
    console.log("   ✅ Vault linked");

    // Check automation status
    console.log("\n⚙️ Checking Automation Status...");
    const status = await strategy.getAutomationStatus();
    console.log("   Needs Upkeep:", status.needsUpkeep);
    console.log("   Next Rebalance:", new Date(status.nextRebalanceTime.toNumber() * 1000).toLocaleString());
    console.log("   Current Protocol:", status.currentProtocol);
    console.log("   Current APY:", (status.currentApy.toNumber() / 100).toFixed(2) + "%");

    // Get protocols
    console.log("\n🏦 Active Protocols:");
    const protocols = await strategy.getActiveProtocols();
    for (let i = 0; i < protocols.names.length; i++) {
      console.log(`   ${protocols.names[i]}: ${(protocols.apys[i].toNumber() / 100).toFixed(2)}%`);
    }

    console.log("\n✅ Deployment complete!");
    console.log("\n📋 Contract Addresses:");
    console.log("====================");
    console.log("USDC:", "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d");
    console.log("Vault:", VAULT_ADDRESS);
    console.log("Automated Strategy:", strategy.address);
    console.log("====================");
    
    console.log("\n🔗 Chainlink Automation Setup:");
    console.log("1. Go to: https://automation.chain.link/sepolia");
    console.log("2. Click 'Register new Upkeep'");
    console.log("3. Select 'Custom logic'");
    console.log("4. Enter contract address:", strategy.address);
    console.log("5. Fund with 5 LINK");
    console.log("6. Set gas limit: 500,000");
    
    console.log("\n🌟 New Features:");
    console.log("   ✅ Automatic rebalancing every hour");
    console.log("   ✅ Yield opportunity detection");
    console.log("   ✅ Risk-based rebalancing");
    console.log("   ✅ Rebalance history tracking");
    console.log("   ✅ Gas-optimized automation");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });