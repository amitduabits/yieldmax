const { ethers } = require("hardhat");
require("dotenv").config();

// Chainlink addresses
const CHAINLINK_ADDRESSES = {
  ethereum: {
    link: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    functionsRouter: "0x65Dcc24F8ff9e51F10DCc7Ed1e4e2A61e6E14bd6",
    automationRegistry: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    ccipRouter: "0xE561d5E02207fb5eB32cca20a699E0d8919a1476"
  },
  arbitrum: {
    link: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
    functionsRouter: "0x234a5fb5Bd614a7AA2FfAB244D603abFA0Ac5C5C",
    automationRegistry: "0x75c0530885F385721fddA23C539AF3701d6183D4",
    ccipRouter: "0x141fa059441E0ca23ce184B6A78bafD2A517DdE8"
  }
};

async function setupChainlink(network) {
  console.log(`\n🔗 Setting up Chainlink services on ${network}...`);
  
  const deployment = require(`../deployments/${network}-mainnet.json`);
  const addresses = CHAINLINK_ADDRESSES[network];
  
  const provider = new ethers.providers.JsonRpcProvider(
    process.env[`${network.toUpperCase()}_RPC_URL`]
  );
  const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  
  // 1. Buy LINK tokens (you need to do this manually first)
  console.log("⚠️  Make sure you have LINK tokens!");
  console.log(`LINK token address: ${addresses.link}`);
  console.log(`You need ~50 LINK for complete setup\n`);
  
  // 2. Setup Functions Subscription
  console.log("📝 Creating Functions subscription...");
  const FunctionsRouter = await ethers.getContractAt(
    "IFunctionsRouter",
    addresses.functionsRouter,
    signer
  );
  
  // Create subscription
  const createSubTx = await FunctionsRouter.createSubscription();
  const createSubReceipt = await createSubTx.wait();
  const subscriptionId = createSubReceipt.events[0].args.subscriptionId;
  console.log(`✅ Created subscription: ${subscriptionId}`);
  
  // Fund subscription (requires LINK approval first)
  const linkToken = await ethers.getContractAt("IERC20", addresses.link, signer);
  const fundAmount = ethers.utils.parseEther("10"); // 10 LINK
  
  await linkToken.approve(addresses.functionsRouter, fundAmount);
  await FunctionsRouter.fundSubscription(subscriptionId, fundAmount);
  console.log(`✅ Funded subscription with 10 LINK`);
  
  // Add consumer
  await FunctionsRouter.addConsumer(subscriptionId, deployment.contracts.aiOptimizer);
  console.log(`✅ Added AIOptimizer as consumer`);
  
  // 3. Register Automation Upkeep
  console.log("\n🤖 Registering Automation upkeep...");
  const AutomationRegistry = await ethers.getContractAt(
    "KeeperRegistry2_1",
    addresses.automationRegistry,
    signer
  );
  
  // Encode registration params
  const registrationParams = {
    name: `YieldMax-${network}`,
    encryptedEmail: "0x",
    upkeepContract: deployment.contracts.keeper,
    gasLimit: 500000,
    adminAddress: signer.address,
    triggerType: 0, // Conditional trigger
    checkData: "0x",
    triggerConfig: "0x",
    offchainConfig: "0x",
    amount: ethers.utils.parseEther("5") // 5 LINK
  };
  
  // Need to approve LINK first
  await linkToken.approve(addresses.automationRegistry, registrationParams.amount);
  
  const registerTx = await AutomationRegistry.registerUpkeep(registrationParams);
  const registerReceipt = await registerTx.wait();
  const upkeepId = registerReceipt.events.find(e => e.event === "UpkeepRegistered").args.id;
  console.log(`✅ Registered upkeep: ${upkeepId}`);
  
  // 4. Configure CCIP
  console.log("\n🌉 Configuring CCIP...");
  const vault = await ethers.getContractAt(
    "YieldMaxVault",
    deployment.contracts.yieldMaxVault,
    signer
  );
  
  // Enable chains
  const chainSelectors = {
    ethereum: "5009297550715157269",
    arbitrum: "4949039107694359620",
    polygon: "4051577828743386545",
    optimism: "3734403246176062136"
  };
  
  for (const [chain, selector] of Object.entries(chainSelectors)) {
    if (chain !== network) {
      await vault.setSupportedChain(selector, true);
      console.log(`✅ Enabled ${chain} (${selector})`);
    }
  }
  
  // Fund vault with LINK for CCIP fees
  await linkToken.transfer(deployment.contracts.yieldMaxVault, ethers.utils.parseEther("10"));
  console.log(`✅ Funded vault with 10 LINK for CCIP`);
  
  // 5. Initialize Data Streams
  console.log("\n📊 Setting up Data Streams...");
  // Data Streams are accessed via API, no on-chain setup needed
  console.log("✅ Data Streams ready (API-based)");
  
  // Save configuration
  const config = {
    network,
    timestamp: new Date().toISOString(),
    chainlink: {
      functionsSubscriptionId: subscriptionId.toString(),
      automationUpkeepId: upkeepId.toString(),
      ccipEnabled: true,
      dataStreamsEnabled: true
    },
    funding: {
      functionsSubscription: "10 LINK",
      automationUpkeep: "5 LINK",
      ccipFees: "10 LINK",
      total: "25 LINK"
    }
  };
  
  const fs = require("fs");
  fs.writeFileSync(
    `deployments/${network}-chainlink-config.json`,
    JSON.stringify(config, null, 2)
  );
  
  console.log(`\n✅ Chainlink setup complete for ${network}!`);
  return config;
}

async function main() {
  console.log("🔗 YieldMax Chainlink Setup");
  console.log("===========================\n");
  
  // Check LINK balance first
  const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const linkToken = await ethers.getContractAt(
    "IERC20",
    CHAINLINK_ADDRESSES.ethereum.link,
    signer
  );
  
  const linkBalance = await linkToken.balanceOf(signer.address);
  console.log(`Your LINK balance: ${ethers.utils.formatEther(linkBalance)} LINK`);
  
  if (linkBalance.lt(ethers.utils.parseEther("100"))) {
    console.log("\n⚠️  WARNING: You need at least 100 LINK for full setup!");
    console.log("Buy LINK from:");
    console.log("- Uniswap: https://app.uniswap.org");
    console.log("- Binance: https://www.binance.com");
    console.log("- Coinbase: https://www.coinbase.com");
    return;
  }
  
  // Setup each network
  const networks = ["ethereum", "arbitrum"];
  for (const network of networks) {
    await setupChainlink(network);
  }
  
  console.log("\n🎉 All Chainlink services configured!");
  console.log("\n📋 Next steps:");
  console.log("1. Monitor your upkeeps at: https://automation.chain.link");
  console.log("2. Check Functions at: https://functions.chain.link");
  console.log("3. Monitor CCIP at: https://ccip.chain.link");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });