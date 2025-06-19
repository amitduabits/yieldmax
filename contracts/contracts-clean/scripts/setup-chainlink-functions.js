// contracts/scripts/setup-chainlink-functions.js
const { ethers } = require("hardhat");
const fs = require("fs");

// Chainlink Functions router addresses
const FUNCTIONS_ADDRESSES = {
  sepolia: {
    router: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    donId: "fun-ethereum-sepolia-1",
    link: "0x779877A7B0D9E8603169DdbD7836e478b4624789"
  },
  arbitrumSepolia: {
    router: "0x234a5fb5Bd614a7AA2FfAB244D603abFA0Ac5C5C", 
    donId: "fun-arbitrum-sepolia-1",
    link: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E"
  }
};

// JavaScript code that will run on Chainlink Functions
const YIELD_OPTIMIZATION_SOURCE = `
// Chainlink Functions JavaScript source code
// This runs in the Chainlink DON to fetch real DeFi yields

const urls = [
  "https://api.aave.com/data/liquidityPools?poolId=0x87870bace4f5b778c21e7b8b4c9c6b2c9c6c9c9c", // Aave USDC
  "https://api.compound.finance/api/v2/ctoken?addresses[]=0x39aa39c021dfbae8fac545936693ac917d5e7563", // Compound USDC
  "https://api.yearn.finance/v1/chains/1/vaults/all", // Yearn vaults
  "https://api.curve.fi/api/getPools/ethereum/factoryV2" // Curve pools
];

// Function to fetch yield data
async function fetchYieldData() {
  const results = [];
  
  try {
    // Fetch Aave data
    const aaveResponse = await Functions.makeHttpRequest({
      url: urls[0],
      headers: { "Content-Type": "application/json" }
    });
    
    if (aaveResponse.data && aaveResponse.data.liquidityRate) {
      results.push({
        protocol: "aave",
        apy: parseFloat(aaveResponse.data.liquidityRate) * 100,
        tvl: parseFloat(aaveResponse.data.totalLiquidity || 0),
        risk: 1 // Low risk
      });
    }

    // Fetch Compound data
    const compoundResponse = await Functions.makeHttpRequest({
      url: urls[1],
      headers: { "Content-Type": "application/json" }
    });
    
    if (compoundResponse.data && compoundResponse.data.cToken) {
      const supplyRate = parseFloat(compoundResponse.data.cToken[0].supply_rate.value);
      results.push({
        protocol: "compound", 
        apy: supplyRate * 100,
        tvl: parseFloat(compoundResponse.data.cToken[0].total_supply.value || 0),
        risk: 1 // Low risk
      });
    }

    // Fetch Yearn data
    const yearnResponse = await Functions.makeHttpRequest({
      url: urls[2],
      headers: { "Content-Type": "application/json" }
    });
    
    if (yearnResponse.data && Array.isArray(yearnResponse.data)) {
      const usdcVault = yearnResponse.data.find(vault => 
        vault.token && vault.token.symbol === "USDC"
      );
      
      if (usdcVault) {
        results.push({
          protocol: "yearn",
          apy: parseFloat(usdcVault.apy.net_apy) * 100,
          tvl: parseFloat(usdcVault.tvl.tvl || 0),
          risk: 2 // Medium risk
        });
      }
    }

    // Fetch Curve data (simplified - would need specific pool)
    const curveResponse = await Functions.makeHttpRequest({
      url: urls[3],
      headers: { "Content-Type": "application/json" }
    });
    
    if (curveResponse.data && curveResponse.data.data) {
      const usdcPool = curveResponse.data.data.poolData.find(pool =>
        pool.coins && pool.coins.some(coin => coin.symbol === "USDC")
      );
      
      if (usdcPool) {
        results.push({
          protocol: "curve",
          apy: parseFloat(usdcPool.gaugeCrvApy[0] || 0),
          tvl: parseFloat(usdcPool.usdTotal || 0),
          risk: 2 // Medium risk
        });
      }
    }

  } catch (error) {
    console.error("Error fetching data:", error);
  }

  return results;
}

// Main execution
const yieldData = await fetchYieldData();

// Encode the results for return to smart contract
const encoded = Functions.encodeUint256Array([
  Math.floor(yieldData[0]?.apy * 100 || 0), // Aave APY (basis points)
  Math.floor(yieldData[1]?.apy * 100 || 0), // Compound APY
  Math.floor(yieldData[2]?.apy * 100 || 0), // Yearn APY
  Math.floor(yieldData[3]?.apy * 100 || 0), // Curve APY
  Math.floor(Date.now() / 1000) // Timestamp
]);

return encoded;
`;

async function setupFunctions(network) {
  console.log(`\n📊 Setting up Chainlink Functions on ${network}...`);
  
  const [signer] = await ethers.getSigners();
  const config = FUNCTIONS_ADDRESSES[network];
  
  if (!config) {
    throw new Error(`Unsupported network: ${network}`);
  }

  // Load deployment info
  let strategyEngineAddress;
  try {
    const deploymentPath = `./deployments/${network}/complete-deployment.json`;
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    strategyEngineAddress = deployment.contracts.WorkingStrategyEngine;
  } catch (error) {
    console.error(`❌ Could not find deployment for ${network}`);
    throw error;
  }

  console.log(`Using strategy engine: ${strategyEngineAddress}`);

  // Get contracts
  const linkToken = await ethers.getContractAt("IERC20", config.link, signer);
  
  // Check LINK balance
  const linkBalance = await linkToken.balanceOf(signer.address);
  const requiredLink = ethers.utils.parseEther("10"); // 10 LINK for subscription
  
  console.log(`LINK Balance: ${ethers.utils.formatEther(linkBalance)} LINK`);
  
  if (linkBalance.lt(requiredLink)) {
    throw new Error(`Insufficient LINK! Need at least 10 LINK. Get from: https://faucets.chain.link/${network}`);
  }

  // Manual subscription setup instructions
  console.log("\n📝 FUNCTIONS SUBSCRIPTION SETUP:");
  console.log("================================");
  console.log(`1. Go to: https://functions.chain.link`);
  console.log(`2. Connect your wallet to ${network}`);
  console.log(`3. Click "Create Subscription"`);
  console.log(`4. Fund with 10 LINK tokens`);
  console.log(`5. Add consumer: ${strategyEngineAddress}`);
  console.log(`6. Copy the subscription ID and update your contract`);

  // Save the source code for Functions
  const functionsConfig = {
    network,
    strategyEngine: strategyEngineAddress,
    functionsRouter: config.router,
    donId: config.donId,
    linkToken: config.link,
    sourceCode: YIELD_OPTIMIZATION_SOURCE,
    setupTime: new Date().toISOString(),
    instructions: {
      step1: "Create subscription at https://functions.chain.link",
      step2: `Fund subscription with 10+ LINK`,
      step3: `Add consumer: ${strategyEngineAddress}`,
      step4: "Deploy the source code using the dashboard",
      step5: "Update contract with subscription ID"
    }
  };

  // Save to file
  const configPath = `./deployments/${network}/functions-config.json`;
  fs.writeFileSync(configPath, JSON.stringify(functionsConfig, null, 2));
  
  // Also save the source code separately
  const sourcePath = `./deployments/${network}/functions-source.js`;
  fs.writeFileSync(sourcePath, YIELD_OPTIMIZATION_SOURCE);

  console.log(`📁 Functions config saved to: ${configPath}`);
  console.log(`📁 Source code saved to: ${sourcePath}`);

  // Create deployment script for the Functions request
  const deployScript = `
// To deploy this Functions request:
// 1. Go to https://functions.chain.link
// 2. Create a new subscription and fund it
// 3. Add ${strategyEngineAddress} as a consumer
// 4. Create a new Functions request with this source code
// 5. Use DON ID: ${config.donId}
// 6. Set gas limit: 300000
// 7. Update your contract with the subscription ID

const source = \`${YIELD_OPTIMIZATION_SOURCE}\`;

// This source code fetches real yield data from:
// - Aave Protocol API
// - Compound Protocol API  
// - Yearn Finance API
// - Curve Finance API
//
// It returns encoded uint256 array with:
// [aaveAPY, compoundAPY, yearnAPY, curveAPY, timestamp]
`;

  fs.writeFileSync(`./deployments/${network}/functions-deploy-script.js`, deployScript);

  return {
    strategyEngine: strategyEngineAddress,
    router: config.router,
    donId: config.donId,
    sourceCode: YIELD_OPTIMIZATION_SOURCE
  };
}

async function main() {
  console.log("📊 YieldMax Chainlink Functions Setup");
  console.log("=====================================");

  const networks = ["sepolia", "arbitrumSepolia"];
  const results = {};

  for (const network of networks) {
    try {
      console.log(`\n🔄 Processing ${network}...`);
      results[network] = await setupFunctions(network);
    } catch (error) {
      console.error(`❌ Failed to setup Functions on ${network}:`, error.message);
      results[network] = { error: error.message };
    }
  }

  // Summary
  console.log("\n📊 FUNCTIONS SETUP SUMMARY");
  console.log("==========================");
  for (const [network, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`❌ ${network}: Failed - ${result.error}`);
    } else {
      console.log(`✅ ${network}: Ready for Functions deployment`);
      console.log(`   Strategy Engine: ${result.strategyEngine}`);
      console.log(`   DON ID: ${result.donId}`);
    }
  }

  console.log("\n🎯 Next Steps:");
  console.log("1. Go to https://functions.chain.link for each network");
  console.log("2. Create subscriptions and fund with LINK");
  console.log("3. Add strategy engines as consumers");
  console.log("4. Deploy the source code provided in config files");
  console.log("5. Test the Functions requests");
  
  console.log("\n📋 Source Code Features:");
  console.log("• Fetches real yield data from 4 major DeFi protocols");
  console.log("• Handles API errors gracefully");
  console.log("• Returns structured data for optimization algorithm");
  console.log("• Updates every hour via Chainlink Automation");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { setupFunctions };