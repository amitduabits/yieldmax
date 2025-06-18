const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Working Strategy Engine with Dynamic Yields...\n");

  const [deployer] = await ethers.getSigners();
  console.log("💰 Deployer:", deployer.address);
  console.log("💸 Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  try {
    // Deploy WorkingStrategyEngine
    console.log("🤖 Deploying WorkingStrategyEngine...");
    const WorkingStrategyEngine = await ethers.getContractFactory("WorkingStrategyEngine");
    const strategy = await WorkingStrategyEngine.deploy();
    await strategy.deployed();
    console.log("   ✅ Strategy Engine deployed to:", strategy.address);

    // Update yield data
    console.log("\n📊 Initializing yield data...");
    const tx = await strategy.updateYieldData();
    await tx.wait();
    console.log("   ✅ Yield data initialized");

    // Get protocols
    console.log("\n🏦 Active DeFi Protocols:");
    const protocols = await strategy.getActiveProtocols();
    
    for (let i = 0; i < protocols.names.length; i++) {
      console.log(`\n   ${i + 1}. ${protocols.names[i]}`);
      console.log(`      Address: ${protocols.addresses[i]}`);
      console.log(`      Current APY: ${(protocols.apys[i].toNumber() / 100).toFixed(2)}%`);
      console.log(`      TVL: $${(protocols.tvls[i] / 1e6).toFixed(2)}M`);
    }

    // Test optimal strategy
    console.log("\n🎯 Testing Strategy Optimization...");
    const testAmount = ethers.utils.parseUnits("1000", 6); // 1000 USDC
    
    // Test conservative strategy
    console.log("\n   Conservative Strategy (20% risk):");
    const conservative = await strategy.getOptimalStrategy(testAmount, 2000);
    console.log(`   Best Protocol: ${conservative.bestProtocol}`);
    console.log(`   Expected APY: ${(conservative.expectedApy.toNumber() / 100).toFixed(2)}%`);
    console.log(`   Confidence: ${conservative.confidence.toNumber()}%`);
    
    // Test aggressive strategy
    console.log("\n   Aggressive Strategy (80% risk):");
    const aggressive = await strategy.getOptimalStrategy(testAmount, 8000);
    console.log(`   Best Protocol: ${aggressive.bestProtocol}`);
    console.log(`   Expected APY: ${(aggressive.expectedApy.toNumber() / 100).toFixed(2)}%`);
    console.log(`   Confidence: ${aggressive.confidence.toNumber()}%`);

    console.log("\n✅ Deployment complete!");
    console.log("\n📋 Update your frontend:");
    console.log(`const STRATEGY_ENGINE_ADDRESS = "${strategy.address}";`);
    
    console.log("\n🌟 Features:");
    console.log("   ✅ 4 DeFi protocols with different risk/reward profiles");
    console.log("   ✅ Dynamic APY that changes with each block");
    console.log("   ✅ TVL and utilization rate tracking");
    console.log("   ✅ Risk-adjusted optimization");
    console.log("   ✅ Real-time yield updates");

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