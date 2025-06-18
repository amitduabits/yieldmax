const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Real Strategy Engine with DeFi Integration...\n");

  const [deployer] = await ethers.getSigners();
  console.log("💰 Deployer:", deployer.address);
  console.log("💸 Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  // Known addresses from previous deployment
  const USDC_ADDRESS = "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d";
  const VAULT_ADDRESS = "0xECbA31cf51F88BA5193186abf35225ECE097df44";
  
  console.log("📄 Using existing contracts:");
  console.log("   USDC:", USDC_ADDRESS);
  console.log("   Vault:", VAULT_ADDRESS);

  try {
    // Deploy RealStrategyEngine
    console.log("\n🤖 Deploying RealStrategyEngine...");
    const RealStrategyEngine = await ethers.getContractFactory("RealStrategyEngine");
    const strategy = await RealStrategyEngine.deploy();
    await strategy.deployed();
    console.log("   ✅ RealStrategyEngine deployed to:", strategy.address);

    // Update yield data
    console.log("\n📊 Updating yield data from protocols...");
    const updateTx = await strategy.updateYieldData();
    await updateTx.wait();
    console.log("   ✅ Yield data updated");

    // Get active protocols
    console.log("\n🏦 Active DeFi Protocols:");
    const protocolData = await strategy.getActiveProtocols();
    for (let i = 0; i < protocolData.names.length; i++) {
      console.log(`   ${i + 1}. ${protocolData.names[i]}`);
      console.log(`      APY: ${protocolData.apys[i].toNumber() / 100}%`);
      console.log(`      TVL: $${(protocolData.tvls[i] / 1e6).toFixed(2)}M`);
    }

    // Test optimal strategy calculation
    console.log("\n🎯 Testing Optimal Strategy Calculation...");
    const testAmount = ethers.utils.parseUnits("10000", 6); // 10k USDC
    const riskTolerance = 5000; // Medium risk
    
    const optimal = await strategy.getOptimalStrategy(testAmount, riskTolerance);
    console.log("   Best Protocol:", protocolData.names[protocolData.addresses.indexOf(optimal.bestProtocol)]);
    console.log("   Expected APY:", optimal.expectedApy.toNumber() / 100, "%");
    console.log("   Confidence:", optimal.confidence.toNumber(), "%");

    // Get USDC price from Chainlink
    console.log("\n💰 Getting USDC Price from Chainlink...");
    const usdcPrice = await strategy.getUSDCPrice();
    console.log("   USDC/USD Price: $", (usdcPrice / 1e8).toFixed(4));

    // Save deployment
    const deployment = {
      network: hre.network.name,
      timestamp: new Date().toISOString(),
      contracts: {
        USDC: USDC_ADDRESS,
        YieldMaxVault: VAULT_ADDRESS,
        RealStrategyEngine: strategy.address
      },
      features: {
        realYieldData: true,
        chainlinkPriceFeeds: true,
        dynamicAPY: true,
        multipleProtocols: 3
      }
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }

    fs.writeFileSync(
      path.join(deploymentsDir, `${hre.network.name}-real-strategy.json`),
      JSON.stringify(deployment, null, 2)
    );

    console.log("\n✅ Deployment complete!");
    console.log("\n📋 Contract Addresses:");
    console.log("====================");
    console.log("USDC:", USDC_ADDRESS);
    console.log("Vault:", VAULT_ADDRESS);
    console.log("RealStrategyEngine:", strategy.address);
    console.log("====================\n");

    console.log("🎯 Next Steps:");
    console.log("1. Update STRATEGY_ENGINE_ADDRESS in AIOptimization.tsx to:");
    console.log(`   const STRATEGY_ENGINE_ADDRESS = "${strategy.address}";`);
    console.log("2. The yields will now update dynamically based on block time");
    console.log("3. Real Chainlink price feeds are integrated");
    console.log("4. Multiple protocols with different risk/reward profiles");

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