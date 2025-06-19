const hre = require("hardhat");

// CCIP Router addresses
const CCIP_ROUTERS = {
  sepolia: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  arbitrumSepolia: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
  optimismSepolia: "0x114A20A10b43D4115e5aeef7345a1A71d2a60C57",
  polygonAmoy: "0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2"
};

// LINK Token addresses
const LINK_TOKENS = {
  sepolia: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  arbitrumSepolia: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
  optimismSepolia: "0xE4aB69C077896252FAFBD49EFD26B5D171A32410",
  polygonAmoy: "0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904"
};

// Chain Selectors
const CHAIN_SELECTORS = {
  sepolia: "16015286601757825753",
  arbitrumSepolia: "3478487238524512106",
  optimismSepolia: "5224473277236331295",
  polygonAmoy: "16281711391670634445"
};

async function main() {
  console.log("🌐 Deploying YieldMax Cross-Chain Infrastructure with CCIP...\n");

  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;
  
  console.log("💰 Deployer:", deployer.address);
  console.log("🔗 Network:", network);
  console.log("💸 Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  // Get network-specific addresses
  const ccipRouter = CCIP_ROUTERS[network] || CCIP_ROUTERS.sepolia;
  const linkToken = LINK_TOKENS[network] || LINK_TOKENS.sepolia;
  
  console.log("📍 CCIP Configuration:");
  console.log("   Router:", ccipRouter);
  console.log("   LINK Token:", linkToken);
  console.log("   Chain Selector:", CHAIN_SELECTORS[network]);

  try {
    // Deploy CrossChainRouter
    console.log("\n🚀 Deploying CrossChainRouter...");
    const CrossChainRouter = await ethers.getContractFactory("CrossChainRouter");
    const router = await CrossChainRouter.deploy(ccipRouter, linkToken);
    await router.deployed();
    console.log("   ✅ CrossChainRouter deployed to:", router.address);

    // Configure current chain
    const VAULT_ADDRESS = "0xECbA31cf51F88BA5193186abf35225ECE097df44";
    const STRATEGY_ADDRESS = "0x467B0446a4628F83DEA0fd82cB83f8ef8140fC30";
    
    console.log("\n⚙️ Configuring current chain...");
    const currentChainSelector = CHAIN_SELECTORS[network];
    await router.configureChain(
      currentChainSelector,
      VAULT_ADDRESS,
      STRATEGY_ADDRESS
    );
    console.log("   ✅ Current chain configured");

    // Add other chains (for demo purposes)
    console.log("\n🔗 Adding cross-chain destinations...");
    
    if (network === "sepolia") {
      // Add Arbitrum Sepolia
      await router.configureChain(
        CHAIN_SELECTORS.arbitrumSepolia,
        "0x0000000000000000000000000000000000000001", // Placeholder
        "0x0000000000000000000000000000000000000002"  // Placeholder
      );
      console.log("   ✅ Added Arbitrum Sepolia");
      
      // Add Optimism Sepolia
      await router.configureChain(
        CHAIN_SELECTORS.optimismSepolia,
        "0x0000000000000000000000000000000000000003", // Placeholder
        "0x0000000000000000000000000000000000000004"  // Placeholder
      );
      console.log("   ✅ Added Optimism Sepolia");
    }

    // Set mock yield data for demo
    console.log("\n📊 Setting mock yield data...");
    
    // Current chain - lower yield
    await router.updateChainYield(
      currentChainSelector,
      650, // 6.5% APY
      STRATEGY_ADDRESS,
      ethers.utils.parseUnits("10000000", 6) // 10M TVL
    );
    console.log("   ✅ Current chain: 6.5% APY");
    
    if (network === "sepolia") {
      // Arbitrum - higher yield
      await router.updateChainYield(
        CHAIN_SELECTORS.arbitrumSepolia,
        920, // 9.2% APY
        "0x0000000000000000000000000000000000000002",
        ethers.utils.parseUnits("5000000", 6) // 5M TVL
      );
      console.log("   ✅ Arbitrum: 9.2% APY");
      
      // Optimism - medium yield
      await router.updateChainYield(
        CHAIN_SELECTORS.optimismSepolia,
        780, // 7.8% APY
        "0x0000000000000000000000000000000000000004",
        ethers.utils.parseUnits("8000000", 6) // 8M TVL
      );
      console.log("   ✅ Optimism: 7.8% APY");
    }

    // Find best opportunity
    console.log("\n🎯 Finding best cross-chain opportunity...");
    const opportunity = await router.findBestCrossChainOpportunity(
      ethers.utils.parseUnits("1000", 6) // 1000 USDC
    );
    
    console.log("   Current Chain APY:", opportunity.currentApy.toNumber() / 100, "%");
    console.log("   Best Chain APY:", opportunity.targetApy.toNumber() / 100, "%");
    console.log("   Yield Improvement:", opportunity.yieldImprovement.toNumber() / 100, "%");

    console.log("\n✅ Cross-Chain Infrastructure Deployed!");
    console.log("\n📋 Deployment Summary:");
    console.log("====================");
    console.log("Network:", network);
    console.log("CrossChainRouter:", router.address);
    console.log("CCIP Router:", ccipRouter);
    console.log("LINK Token:", linkToken);
    console.log("====================");
    
    console.log("\n🎯 Next Steps:");
    console.log("1. Deploy this same contract on Arbitrum Sepolia");
    console.log("2. Fund router with LINK tokens for CCIP fees");
    console.log("3. Test cross-chain rebalancing");
    console.log("4. Update frontend with cross-chain features");
    
    console.log("\n💡 To deploy on another chain:");
    console.log("   npx hardhat run scripts/deploy-ccip.js --network arbitrumSepolia");
    
    // Save deployment info
    const deployment = {
      network: network,
      timestamp: new Date().toISOString(),
      contracts: {
        CrossChainRouter: router.address
      },
      ccip: {
        router: ccipRouter,
        linkToken: linkToken,
        chainSelector: currentChainSelector
      },
      existingContracts: {
        USDC: "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d",
        Vault: VAULT_ADDRESS,
        AutomatedStrategy: STRATEGY_ADDRESS
      }
    };
    
    const fs = require("fs");
    const path = require("path");
    const deploymentsDir = path.join(__dirname, "../deployments");
    
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }
    
    fs.writeFileSync(
      path.join(deploymentsDir, `${network}-ccip.json`),
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