// scripts/deploy-ai-optimizer.js
const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Chainlink Functions configuration for Sepolia
const CHAINLINK_FUNCTIONS_ROUTER = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0";
const CHAINLINK_DON_ID = "fun-ethereum-sepolia-1";

async function main() {
    console.log("🤖 Deploying AI Optimizer for YieldMax...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Deploy MockAIOptimizer
    console.log("\n📦 Deploying MockAIOptimizer...");
    const AIOptimizer = await ethers.getContractFactory("MockAIOptimizer");
    const aiOptimizer = await AIOptimizer.deploy();
    await aiOptimizer.deployed();
    
    console.log("✅ AI Optimizer deployed to:", aiOptimizer.address);
    
    // Test the AI Optimizer
    console.log("\n🧪 Testing AI Optimizer...");
    
    // Test optimization request
    const testUser = deployer.address;
    const testAmount = ethers.utils.parseUnits("10000", 6); // 10,000 USDC
    const riskTolerance = 5; // Medium risk
    
    console.log("Requesting optimization...");
    const tx = await aiOptimizer.requestOptimization(testUser, testAmount, riskTolerance);
    await tx.wait();
    
    // Get optimization result
    const result = await aiOptimizer.getOptimization(testUser);
    console.log("\n📊 AI Optimization Result:");
    console.log("Total Expected APY:", result.totalExpectedAPY.toString() / 100 + "%");
    console.log("Confidence:", result.confidence.toString() + "%");
    console.log("Strategies:", result.strategies.length);
    
    // Display strategies
    console.log("\n📈 Recommended Strategies:");
    for (let i = 0; i < result.strategies.length; i++) {
        const strategy = result.strategies[i];
        console.log(`\nStrategy ${i + 1}:`);
        console.log(`  Protocol: ${getProtocolName(strategy.protocol)}`);
        console.log(`  Allocation: ${strategy.allocation / 100}%`);
        console.log(`  Expected APY: ${strategy.expectedAPY / 100}%`);
        console.log(`  Risk Score: ${strategy.riskScore}/10`);
        console.log(`  Reasoning: ${strategy.reasoning}`);
    }
    
    // Get stats
    const stats = await aiOptimizer.getStats();
    console.log("\n📈 AI Optimizer Statistics:");
    console.log("Total Optimizations:", stats._totalOptimizations.toString());
    console.log("Average Confidence:", stats._averageConfidence.toString() + "%");
    
    // Save deployment
    const deployment = {
        network: "sepolia",
        aiOptimizer: aiOptimizer.address,
        chainlinkFunctionsRouter: CHAINLINK_FUNCTIONS_ROUTER,
        deployedAt: new Date().toISOString(),
        features: [
            "Risk-based strategy optimization",
            "Multi-protocol allocation",
            "Confidence scoring",
            "Gas estimation",
            "Chainlink Functions ready"
        ]
    };
    
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(
        path.join(deploymentsDir, "ai-optimizer-sepolia.json"),
        JSON.stringify(deployment, null, 2)
    );
    
    console.log("\n🎉 AI Optimizer deployment complete!");
    console.log("\n📋 Deployment Summary:");
    console.log("-----------------------------------");
    console.log(`AI Optimizer: ${aiOptimizer.address}`);
    console.log("-----------------------------------");
    
    console.log("\n✨ Features:");
    console.log("✅ Risk-based portfolio optimization");
    console.log("✅ Multi-protocol strategy allocation");
    console.log("✅ AI confidence scoring");
    console.log("✅ Gas cost estimation");
    console.log("✅ Ready for Chainlink Functions integration");
    
    console.log("\n🔗 Next Steps:");
    console.log("1. Update frontend with AI Optimizer address");
    console.log("2. Configure Chainlink Functions subscription (optional)");
    console.log("3. Test different risk profiles in the UI");
    console.log("4. Show AI recommendations in your demo");
    
    console.log("\n📝 Add to config/contracts.ts:");
    console.log(`AIOptimizer: '${aiOptimizer.address}',`);
}

function getProtocolName(address) {
    const protocols = {
        "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2": "Aave",
        "0xc3d688B66703497DAA19211EEdff47f25384cdc3": "Compound",
        "0x5f1111111111111111111111111111111111111": "Yearn Finance"
    };
    return protocols[address] || address;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });