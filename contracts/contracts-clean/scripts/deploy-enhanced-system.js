// scripts/deploy-enhanced-system.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Enhanced YieldMax System...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // First, let's check what contracts are already in the artifacts
  console.log("📦 Checking available contracts...\n");

  try {
    // Try to get the SimpleEnhancedVault first since it's already deployed
    const EXISTING_VAULT = "0x173a4Adc3e84BC182c614856db66d7Cb814cF019";
    const EXISTING_CONNECTOR = "0x76cB3d20431F43C3cbe42ade8d0c246F41c78641";
    const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

    console.log("✅ Using existing contracts:");
    console.log("   Vault:", EXISTING_VAULT);
    console.log("   Connector:", EXISTING_CONNECTOR);
    console.log("   USDC:", USDC_ADDRESS);

    // Deploy the AI Optimizer (simplified version)
    console.log("\n📦 Deploying AI Optimizer...");
    
    // Create the AI Optimizer contract in the contracts directory
    const aiOptimizerCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleAIOptimizer {
    struct Strategy {
        string name;
        uint256 apy; // in basis points
        uint256 risk; // 1-100
    }
    
    mapping(uint256 => Strategy) public strategies;
    uint256 public strategyCount;
    
    constructor() {
        _addStrategy("Aave V3", 550, 10);
        _addStrategy("Compound V3", 480, 10);
        _addStrategy("GMX GLP", 2100, 35);
        _addStrategy("Curve 3Pool", 620, 15);
    }
    
    function _addStrategy(string memory name, uint256 apy, uint256 risk) private {
        strategies[strategyCount] = Strategy(name, apy, risk);
        strategyCount++;
    }
    
    function getOptimalStrategy(uint256 maxRisk) external view returns (uint256 strategyId, uint256 expectedApy) {
        uint256 bestApy = 0;
        strategyId = 0;
        
        for (uint256 i = 0; i < strategyCount; i++) {
            if (strategies[i].risk <= maxRisk && strategies[i].apy > bestApy) {
                bestApy = strategies[i].apy;
                strategyId = i;
            }
        }
        
        expectedApy = bestApy;
    }
    
    function getStrategy(uint256 id) external view returns (string memory name, uint256 apy, uint256 risk) {
        Strategy memory s = strategies[id];
        return (s.name, s.apy, s.risk);
    }
}
    `;

    // Write the contract
    const contractsDir = path.join(__dirname, "../contracts");
    fs.writeFileSync(
      path.join(contractsDir, "SimpleAIOptimizer.sol"),
      aiOptimizerCode
    );

    // Compile and deploy
    await hre.run("compile");
    
    const SimpleAIOptimizer = await ethers.getContractFactory("SimpleAIOptimizer");
    const aiOptimizer = await SimpleAIOptimizer.deploy();
    await aiOptimizer.waitForDeployment();
    const aiOptimizerAddress = await aiOptimizer.getAddress();
    
    console.log("✅ AI Optimizer deployed to:", aiOptimizerAddress);

    // Deploy a simple protocol registry
    console.log("\n📦 Deploying Protocol Registry...");
    
    const protocolRegistryCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleProtocolRegistry {
    struct Protocol {
        string name;
        address adapter;
        bool active;
    }
    
    mapping(uint256 => Protocol) public protocols;
    uint256 public protocolCount;
    
    function registerProtocol(string memory name, address adapter) external returns (uint256) {
        uint256 id = protocolCount++;
        protocols[id] = Protocol(name, adapter, true);
        return id;
    }
    
    function getProtocol(uint256 id) external view returns (string memory, address, bool) {
        Protocol memory p = protocols[id];
        return (p.name, p.adapter, p.active);
    }
}
    `;

    fs.writeFileSync(
      path.join(contractsDir, "SimpleProtocolRegistry.sol"),
      protocolRegistryCode
    );

    await hre.run("compile");
    
    const SimpleProtocolRegistry = await ethers.getContractFactory("SimpleProtocolRegistry");
    const protocolRegistry = await SimpleProtocolRegistry.deploy();
    await protocolRegistry.waitForDeployment();
    const protocolRegistryAddress = await protocolRegistry.getAddress();
    
    console.log("✅ Protocol Registry deployed to:", protocolRegistryAddress);

    // Save deployment info
    const deployment = {
      network: "sepolia",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        vault: EXISTING_VAULT,
        automationConnector: EXISTING_CONNECTOR,
        aiOptimizer: aiOptimizerAddress,
        protocolRegistry: protocolRegistryAddress,
        usdc: USDC_ADDRESS
      }
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(deploymentsDir, "sepolia-enhanced.json"),
      JSON.stringify(deployment, null, 2)
    );

    console.log("\n✅ Deployment complete!");
    console.log("\n📋 Summary:");
    console.log("- Existing Vault:", EXISTING_VAULT);
    console.log("- Existing Automation:", EXISTING_CONNECTOR);
    console.log("- New AI Optimizer:", aiOptimizerAddress);
    console.log("- New Protocol Registry:", protocolRegistryAddress);
    
    console.log("\n📝 Frontend Configuration:");
    console.log("```typescript");
    console.log("export const CONTRACTS = {");
    console.log("  sepolia: {");
    console.log(`    vault: '${EXISTING_VAULT}',`);
    console.log(`    automationConnector: '${EXISTING_CONNECTOR}',`);
    console.log(`    aiOptimizer: '${aiOptimizerAddress}',`);
    console.log(`    protocolRegistry: '${protocolRegistryAddress}',`);
    console.log(`    usdc: '${USDC_ADDRESS}'`);
    console.log("  }");
    console.log("};");
    console.log("```");
    
    console.log("\n🎯 Next Steps:");
    console.log("1. Copy the configuration above to your frontend");
    console.log("2. Your Chainlink Automation is already set up and running");
    console.log("3. Test the enhanced features");

  } catch (error) {
    console.error("Error:", error.message);
    
    // Fallback: Just output the configuration for existing contracts
    console.log("\n📝 Using existing deployment:");
    console.log("```typescript");
    console.log("export const CONTRACTS = {");
    console.log("  sepolia: {");
    console.log("    vault: '0x173a4Adc3e84BC182c614856db66d7Cb814cF019',");
    console.log("    automationConnector: '0x76cB3d20431F43C3cbe42ade8d0c246F41c78641',");
    console.log("    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'");
    console.log("  }");
    console.log("};");
    console.log("```");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });