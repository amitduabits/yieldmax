// scripts/verify-integration.js
const hre = require("hardhat");

async function main() {
  console.log("🔍 Verifying YieldMax Integration...\n");

  const VAULT_ADDRESS = "0xECbA31cf51F88BA5193186abf35225ECE097df44";
  const STRATEGY_ENGINE_ADDRESS = "0x2B469ab2Ff4b7198d06c6D3b927130B891e9E846";

  // Get contract instances
  const vault = await hre.ethers.getContractAt("YieldMaxVault", VAULT_ADDRESS);
  const strategyEngine = await hre.ethers.getContractAt("SimpleEnhancedStrategyEngine", STRATEGY_ENGINE_ADDRESS);

  // Check vault status
  const totalAssets = await vault.totalAssets();
  const totalShares = await vault.totalShares();
  
  console.log("📊 Vault Status:");
  console.log("   Total Assets:", hre.ethers.utils.formatUnits(totalAssets, 6), "USDC");
  console.log("   Total Shares:", totalShares.toString());

  // Check strategy engine
  const contractInfo = await strategyEngine.getContractInfo();
  console.log("\n🤖 Strategy Engine Status:");
  console.log("   Assets Managed:", hre.ethers.utils.formatUnits(contractInfo.totalAssetsManaged, 6), "USDC");
  console.log("   Protocols:", contractInfo.protocolCount.toString());
  console.log("   Data Fresh:", contractInfo.dataFreshness);

  // Get current strategy
  const currentStrategy = await strategyEngine.getCurrentStrategy();
  console.log("\n🎯 Current Strategy:");
  console.log("   Protocol:", currentStrategy.protocolName);
  console.log("   Expected APY:", Number(currentStrategy.expectedAPY) / 100, "%");
  console.log("   Risk Score:", Number(currentStrategy.riskScore), "/100");
  console.log("   Confidence:", Number(currentStrategy.confidence), "%");

  // Get recommendation for vault assets
  const recommendation = await strategyEngine.getBestYield(totalAssets);
  console.log("\n📈 AI Recommendation for", hre.ethers.utils.formatUnits(totalAssets, 6), "USDC:");
  console.log("   Best Protocol:", recommendation[0]);
  console.log("   Expected APY:", Number(recommendation[1]) / 100, "%");

  // Calculate potential yield
  const vaultUSDC = Number(hre.ethers.utils.formatUnits(totalAssets, 6));
  const bestAPY = Number(recommendation[1]) / 100;
  const yearlyYield = (vaultUSDC * bestAPY) / 100;
  
  console.log("\n💰 Yield Calculation:");
  console.log("   Vault Assets:", vaultUSDC, "USDC");
  console.log("   Optimal APY:", bestAPY, "%");
  console.log("   Potential Yearly Yield:", yearlyYield.toFixed(3), "USDC");

  // Check rebalance status
  const upkeepCheck = await strategyEngine.checkUpkeep("0x");
  console.log("\n⚖️  Rebalance Status:");
  console.log("   Rebalance Needed:", upkeepCheck.shouldRebalance);
  console.log("   Reason:", upkeepCheck.shouldRebalance ? "Better opportunity found" : "Currently optimal");

  // Integration summary
  console.log("\n✅ Integration Summary:");
  console.log("==================================");
  console.log("✅ Vault Connected:", VAULT_ADDRESS.slice(0, 10) + "...");
  console.log("✅ Strategy Engine:", STRATEGY_ENGINE_ADDRESS.slice(0, 10) + "...");
  console.log("✅ Assets Tracked:", vaultUSDC, "USDC");
  console.log("✅ AI Strategy:", currentStrategy.protocolName, `(${bestAPY}%)`);
  console.log("✅ Risk Managed:", Number(currentStrategy.riskScore), "/100");
  console.log("✅ Status:", upkeepCheck.shouldRebalance ? "Rebalance Available" : "Optimal");
  console.log("==================================");

  console.log("\n🚀 Integration Complete! Ready for demo!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });