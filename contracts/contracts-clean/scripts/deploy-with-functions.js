const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Chainlink Functions Router addresses
const FUNCTIONS_ROUTERS = {
  sepoliaeth: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
  arbitrumSepolia: "0x234a5fb5Bd614a7AA2FfAB244D603abFA0Ac5C5C",
  polygonAmoy: "0xC22a79eBA640940ABB6dF0f7982cc119578E11De",
  optimismSepolia: "0xC17094E3A1348E5C7544D4fF8A36c28f2C6AAE28"
};

// DON IDs for each network
const DON_IDS = {
  sepoliaeth: "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000",
  arbitrumSepolia: "0x66756e2d617262697472756d2d7365706f6c69612d3100000000000000000000",
  polygonAmoy: "0x66756e2d706f6c79676f6e2d616d6f792d3100000000000000000000000000",
  optimismSepolia: "0x66756e2d6f7074696d69736d2d7365706f6c69612d3100000000000000000000"
};

async function main() {
  console.log("🚀 Starting YieldMax deployment with Chainlink Functions...\n");

  const network = hre.network.name;
  const [deployer] = await ethers.getSigners();
  
  console.log("📍 Network:", network);
  console.log("💰 Deployer:", deployer.address);
  console.log("💸 Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  // Get Chainlink configuration for network
  const functionsRouter = FUNCTIONS_ROUTERS[network] || FUNCTIONS_ROUTERS.sepoliaeth;
  const donId = DON_IDS[network] || DON_IDS.sepoliaeth;

  console.log("🔗 Chainlink Functions Configuration:");
  console.log("   Router:", functionsRouter);
  console.log("   DON ID:", donId);
  console.log("   Subscription ID: (Will be created)\n");

  try {
    // 1. Deploy MockERC20 (USDC)
    console.log("1️⃣ Deploying MockERC20 (USDC)...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdc.deployed();
    console.log("   ✅ USDC deployed to:", usdc.address);

    // 2. Deploy YieldMaxVault
    console.log("\n2️⃣ Deploying YieldMaxVault...");
    const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault");
    const vault = await YieldMaxVault.deploy(usdc.address, "YieldMax Shares", "ymUSDC");
    await vault.deployed();
    console.log("   ✅ Vault deployed to:", vault.address);

    // 3. Deploy StrategyEngine with Chainlink Functions
    console.log("\n3️⃣ Deploying StrategyEngine (AI Optimization)...");
    const StrategyEngine = await ethers.getContractFactory("StrategyEngine");
    const strategy = await StrategyEngine.deploy(
      functionsRouter,
      donId,
      0 // Subscription ID will be set later
    );
    await strategy.deployed();
    console.log("   ✅ StrategyEngine deployed to:", strategy.address);

    // 4. Configure contracts
    console.log("\n4️⃣ Configuring contracts...");
    
    // Add some example protocols to track
    const exampleProtocols = [
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap
      "0x1111111254fb6c44bAC0beD2854e76F90643097d", // 1inch
      "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"  // Uniswap V3
    ];

    for (const protocol of exampleProtocols) {
      console.log(`   Adding protocol ${protocol}...`);
      const tx = await strategy.addProtocol(protocol);
      await tx.wait();
    }

    // Set strategy engine in vault (if needed)
    console.log("   Setting strategy engine in vault...");
    // await vault.setStrategyEngine(strategy.address);

    // 5. Setup Chainlink Functions Subscription
    console.log("\n5️⃣ Setting up Chainlink Functions subscription...");
    console.log("   ⚠️  IMPORTANT: You need to:");
    console.log("   1. Go to https://functions.chain.link");
    console.log("   2. Create a new subscription");
    console.log("   3. Fund it with LINK tokens");
    console.log("   4. Add consumer:", strategy.address);
    console.log("   5. Update subscription ID in StrategyEngine\n");

    // 6. Verify contracts
    if (network !== "hardhat" && network !== "localhost") {
      console.log("6️⃣ Verifying contracts on Etherscan...");
      
      await hre.run("verify:verify", {
        address: usdc.address,
        constructorArguments: ["USD Coin", "USDC", 6],
      });
      
      await hre.run("verify:verify", {
        address: vault.address,
        constructorArguments: [usdc.address, "YieldMax Shares", "ymUSDC"],
      });
      
      await hre.run("verify:verify", {
        address: strategy.address,
        constructorArguments: [functionsRouter, donId, 0],
      });
    }

    // 7. Save deployment info
    const deployment = {
      network: network,
      timestamp: new Date().toISOString(),
      contracts: {
        USDC: usdc.address,
        YieldMaxVault: vault.address,
        StrategyEngine: strategy.address
      },
      chainlink: {
        functionsRouter: functionsRouter,
        donId: donId,
        subscriptionId: "TO_BE_SET"
      },
      protocols: exampleProtocols
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }

    fs.writeFileSync(
      path.join(deploymentsDir, `${network}-functions.json`),
      JSON.stringify(deployment, null, 2)
    );

    console.log("\n✅ Deployment complete!");
    console.log("\n📋 Summary:");
    console.log("====================");
    console.log("USDC:", usdc.address);
    console.log("Vault:", vault.address);
    console.log("StrategyEngine:", strategy.address);
    console.log("====================\n");

    console.log("🎯 Next Steps:");
    console.log("1. Create Chainlink Functions subscription at https://functions.chain.link");
    console.log("2. Fund subscription with LINK tokens");
    console.log("3. Add StrategyEngine as consumer");
    console.log("4. Update subscription ID in contract");
    console.log("5. Test yield optimization with requestYieldUpdate()");

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