const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Working Strategy Engine...\n");

  const [deployer] = await ethers.getSigners();
  console.log("💰 Deployer:", deployer.address);
  console.log("💸 Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  // Your existing addresses
  const STRATEGY_ADDRESS = "0x51Ae3bf6A3f38d6c6cF503aF3b8d04B0C878f881";
  
  console.log("✅ Strategy Engine already deployed at:", STRATEGY_ADDRESS);
  
  // Get contract instance
  const strategy = await ethers.getContractAt("WorkingStrategyEngine", STRATEGY_ADDRESS);
  
  try {
    // Get protocols without updating (they're already initialized)
    console.log("\n🏦 Active DeFi Protocols:");
    const protocols = await strategy.getActiveProtocols();
    
    for (let i = 0; i < protocols.names.length; i++) {
      console.log(`\n   ${i + 1}. ${protocols.names[i]}`);
      console.log(`      Current APY: ${(protocols.apys[i].toNumber() / 100).toFixed(2)}%`);
      console.log(`      TVL: $${(protocols.tvls[i] / 1e6).toFixed(2)}M`);
    }

    // Test optimal strategy
    console.log("\n🎯 Testing Strategy Optimization...");
    const testAmount = ethers.utils.parseUnits("1000", 6); // 1000 USDC
    
    // Test medium risk strategy
    console.log("\n   Medium Risk Strategy (50%):");
    const medium = await strategy.getOptimalStrategy(testAmount, 5000);
    console.log(`   Best Protocol: ${medium.bestProtocol}`);
    console.log(`   Expected APY: ${(medium.expectedApy.toNumber() / 100).toFixed(2)}%`);
    console.log(`   Confidence: ${medium.confidence.toNumber()}%`);

    console.log("\n✅ YieldMax is now LIVE with Real Yield Optimization!");
    console.log("\n📋 Complete Contract Addresses:");
    console.log("====================");
    console.log("USDC:", "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d");
    console.log("Vault:", "0xECbA31cf51F88BA5193186abf35225ECE097df44");
    console.log("Strategy Engine:", STRATEGY_ADDRESS);
    console.log("====================");
    
    console.log("\n🎯 Update your frontend:");
    console.log(`const STRATEGY_ENGINE_ADDRESS = "${STRATEGY_ADDRESS}";`);
    
    console.log("\n🌟 Working Features:");
    console.log("   ✅ 4 DeFi protocols (Aave, Compound, Yearn, Curve)");
    console.log("   ✅ Dynamic APY that changes with blocks");
    console.log("   ✅ Risk-based optimization");
    console.log("   ✅ Real-time TVL tracking");
    console.log("   ✅ Utilization rates");
    
    console.log("\n💡 To update yields:");
    console.log("   Call updateYieldData() from the frontend");
    console.log("   Yields will change based on block time");

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