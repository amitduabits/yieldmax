const { ethers } = require("hardhat");

async function setupChainlinkServices() {
  console.log("🔗 Setting up Chainlink Services...");
  
  // Load deployments
  const deployments = {
    ethereum: require("../deployments/ethereum-mainnet.json"),
    arbitrum: require("../deployments/arbitrum-mainnet.json")
  };
  
  // Setup for each chain
  for (const [network, deployment] of Object.entries(deployments)) {
    console.log(`\nConfiguring ${network}...`);
    
    const provider = new ethers.providers.JsonRpcProvider(
      process.env[`${network.toUpperCase()}_RPC_URL`]
    );
    const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    
    // 1. Configure CCIP
    console.log("Setting up CCIP...");
    const crossChainManager = await ethers.getContractAt(
      "CrossChainManager",
      deployment.contracts.crossChainManager,
      signer
    );
    
    // Configure supported chains
    const chains = {
      ethereum: "5009297550715157269", // Ethereum mainnet selector
      arbitrum: "4949039107694359620", // Arbitrum mainnet selector
      polygon: "4051577828743386545",  // Polygon mainnet selector
      optimism: "3734403246176062136"  // Optimism mainnet selector
    };
    
    for (const [chainName, selector] of Object.entries(chains)) {
      if (chainName !== network) {
        await crossChainManager.configureChain(
          selector,
          deployments[chainName]?.contracts.yieldMaxVault || ethers.constants.AddressZero,
          500000 // gas limit
        );
        console.log(`  ✓ Configured ${chainName} (${selector})`);
      }
    }
    
    // 2. Fund with LINK
    console.log("Funding with LINK...");
    const linkToken = await ethers.getContractAt(
      "LinkTokenInterface",
      deployment.config.linkToken,
      signer
    );
    
    const linkAmount = ethers.utils.parseEther("10"); // 10 LINK per contract
    
    // Fund CrossChainManager
    await linkToken.transfer(crossChainManager.address, linkAmount);
    console.log(`  ✓ Funded CrossChainManager with 10 LINK`);
    
    // Fund AIOptimizer
    await linkToken.transfer(deployment.contracts.aiOptimizer, linkAmount);
    console.log(`  ✓ Funded AIOptimizer with 10 LINK`);
    
    // 3. Create Functions Subscription
    console.log("Creating Functions subscription...");
    const functionsRouter = await ethers.getContractAt(
      "FunctionsRouter",
      deployment.config.functionsRouter,
      signer
    );
    
    const tx = await functionsRouter.createSubscription();
    const receipt = await tx.wait();
    const subscriptionId = receipt.events[0].args.subscriptionId;
    console.log(`  ✓ Created subscription: ${subscriptionId}`);
    
    // Add consumer
    await functionsRouter.addConsumer(
      subscriptionId,
      deployment.contracts.aiOptimizer
    );
    console.log(`  ✓ Added AIOptimizer as consumer`);
    
    // Fund subscription
    await functionsRouter.fundSubscription(subscriptionId, linkAmount);
    console.log(`  ✓ Funded subscription with 10 LINK`);
    
    // 4. Register Automation Upkeep
    console.log("Registering Automation upkeep...");
    const automationRegistry = await ethers.getContractAt(
      "KeeperRegistry2_1",
      deployment.config.automationRegistry,
      signer
    );
    
    const upkeepTx = await automationRegistry.registerUpkeep({
      name: `YieldMax-${network}`,
      contract: deployment.contracts.keeper,
      gasLimit: 500000,
      adminAddress: signer.address,
      checkData: "0x",
      amount: linkAmount
    });
    
    const upkeepReceipt = await upkeepTx.wait();
    const upkeepId = upkeepReceipt.events.find(e => e.event === "UpkeepRegistered").args.id;
    console.log(`  ✓ Registered upkeep: ${upkeepId}`);
    
    // 5. Configure Keeper
    const keeper = await ethers.getContractAt(
      "YieldMaxKeeper",
      deployment.contracts.keeper,
      signer
    );
    
    await keeper.addVault(
      deployment.contracts.yieldMaxVault,
      3600, // 1 hour minimum interval
      50    // 0.5% minimum yield difference
    );
    console.log(`  ✓ Added vault to keeper`);
  }
  
  console.log("\n✅ Chainlink services setup complete!");
}

setupChainlinkServices()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });