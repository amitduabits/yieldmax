// scripts/deploy-ai-optimizer.js
const { ethers } = require("hardhat");

async function main() {
    console.log("🤖 Deploying AIOptimizer...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Sepolia Functions Router
    const SEPOLIA_FUNCTIONS_ROUTER = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0";
    const DON_ID = ethers.utils.formatBytes32String("fun-ethereum-sepolia-1");
    const SUBSCRIPTION_ID = 0; // You'll need to create this at functions.chain.link
    
    try {
        console.log("\n🤖 Deploying AIOptimizer...");
        const AIOptimizer = await ethers.getContractFactory("AIOptimizer");
        const aiOptimizer = await AIOptimizer.deploy(
            SEPOLIA_FUNCTIONS_ROUTER,
            DON_ID,
            SUBSCRIPTION_ID
        );
        await aiOptimizer.deployed();
        console.log("✅ AIOptimizer deployed:", aiOptimizer.address);
        
        console.log("\n🔗 Next steps for Chainlink Functions:");
        console.log("1. Go to https://functions.chain.link/");
        console.log("2. Create a new subscription");
        console.log("3. Fund it with LINK tokens");
        console.log("4. Add this contract as a consumer:", aiOptimizer.address);
        console.log("5. Update subscription ID:", `await aiOptimizer.setSubscriptionId(YOUR_SUB_ID)`);
        
    } catch (error) {
        console.error("❌ AIOptimizer deployment failed:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });