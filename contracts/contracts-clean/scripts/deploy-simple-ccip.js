const hre = require("hardhat");

async function main() {
  console.log("🌐 Deploying Simplified Cross-Chain Router...\n");

  const [deployer] = await ethers.getSigners();
  console.log("💰 Deployer:", deployer.address);
  console.log("💸 Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  try {
    // Deploy SimpleCrossChainRouter
    console.log("🚀 Deploying SimpleCrossChainRouter...");
    const SimpleCrossChainRouter = await ethers.getContractFactory("SimpleCrossChainRouter");
    const router = await SimpleCrossChainRouter.deploy();
    await router.deployed();
    console.log("   ✅ Cross-Chain Router deployed to:", router.address);

    // Get chain data
    console.log("\n📊 Multi-Chain Yield Data:");
    const chainData = await router.getAllChainData();
    for (let i = 0; i < chainData.names.length; i++) {
      console.log(`   ${chainData.names[i]}: ${(chainData.apys[i].toNumber() / 100).toFixed(2)}% APY`);
    }

    // Find best opportunity
    console.log("\n🎯 Finding Cross-Chain Opportunities...");
    const opportunity = await router.findBestOpportunity(
      ethers.utils.parseUnits("1000", 6) // 1000 USDC
    );
    
    console.log(`   Current: ${opportunity.currentChainName} @ ${(opportunity.currentApy.toNumber() / 100).toFixed(2)}%`);
    console.log(`   Best: ${opportunity.targetChainName} @ ${(opportunity.targetApy.toNumber() / 100).toFixed(2)}%`);
    console.log(`   Improvement: +${(opportunity.apyImprovement.toNumber() / 100).toFixed(2)}%`);

    // Simulate a cross-chain transfer
    if (opportunity.apyImprovement.toNumber() > 200) { // >2% improvement
      console.log("\n💸 Simulating Cross-Chain Transfer...");
      const ARBITRUM_SELECTOR = "3478487238524512106";
      const tx = await router.initiateCrossChainTransfer(
        ARBITRUM_SELECTOR,
        ethers.utils.parseUnits("100", 6) // 100 USDC
      );
      await tx.wait();
      console.log("   ✅ Cross-chain transfer recorded!");
    }

    console.log("\n✅ Deployment Complete!");
    console.log("\n📋 Contract Summary:");
    console.log("====================");
    console.log("SimpleCrossChainRouter:", router.address);
    console.log("====================");
    
    console.log("\n🌟 Features Demonstrated:");
    console.log("   ✅ Multi-chain yield comparison");
    console.log("   ✅ Cross-chain opportunity detection");
    console.log("   ✅ Transfer simulation (CCIP-ready)");
    console.log("   ✅ Gas-optimized implementation");
    
    console.log("\n💡 Frontend Integration:");
    console.log(`   const CROSS_CHAIN_ROUTER = "${router.address}";`);
    
    // Save deployment
    const fs = require("fs");
    const path = require("path");
    const deployment = {
      network: hre.network.name,
      timestamp: new Date().toISOString(),
      contracts: {
        SimpleCrossChainRouter: router.address
      }
    };
    
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }
    
    fs.writeFileSync(
      path.join(deploymentsDir, `${hre.network.name}-simple-ccip.json`),
      JSON.stringify(deployment, null, 2)
    );

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