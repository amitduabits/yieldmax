// scripts/deploy-automation.js
const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Chainlink Automation Registry on Sepolia
const CHAINLINK_AUTOMATION_REGISTRY = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
const CHAINLINK_LINK_TOKEN = "0x779877A7B0D9E8603169DdbD7836e478b4624789";

// Your deployed contracts
const DEPLOYED_CONTRACTS = {
    vault: "0xECbA31cf51F88BA5193186abf35225ECE097df44",
    crossChainManager: "0x75184db477E030aD316CabaD72e18292F350560C",
    aiOptimizer: "0xAF1b506b0dCD839785997DDE6A3fbaC7B3d6f41A"
};

async function main() {
    console.log("⚡ Deploying Automation Handler for YieldMax...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Deploy MockAutomationHandler
    console.log("\n📦 Deploying MockAutomationHandler...");
    const AutomationHandler = await ethers.getContractFactory("MockAutomationHandler");
    const automationHandler = await AutomationHandler.deploy();
    await automationHandler.deployed();
    
    console.log("✅ Automation Handler deployed to:", automationHandler.address);
    
    // Configure the handler
    console.log("\n🔧 Configuring Automation Handler...");
    
    // Set contract addresses
    const tx1 = await automationHandler.setContracts(
        DEPLOYED_CONTRACTS.vault,
        DEPLOYED_CONTRACTS.crossChainManager,
        DEPLOYED_CONTRACTS.aiOptimizer
    );
    await tx1.wait();
    console.log("✅ Contract addresses configured");
    
    // Set automation parameters
    const tx2 = await automationHandler.updateParameters(
        3600,        // 1 hour rebalance interval
        200,         // 2% APY difference threshold
        1000000000   // 1000 USDC minimum
    );
    await tx2.wait();
    console.log("✅ Automation parameters set");
    
    // Test the automation
    console.log("\n🧪 Testing Automation Handler...");
    
    // Check automation status
    const status = await automationHandler.getAutomationStatus();
    console.log("\n📊 Automation Status:");
    console.log("Enabled:", status.enabled);
    console.log("Total Rebalances:", status.totalRebalancesCount.toString());
    console.log("Should Rebalance Now:", status.shouldRebalanceNow);
    
    // Simulate automation
    const simulation = await automationHandler.simulateAutomation();
    console.log("\n🔮 Automation Simulation:");
    console.log("Status:", simulation.status);
    console.log("Time till next:", simulation.timeTillNext.toString(), "seconds");
    console.log("Recommendation:", simulation.recommendation);
    
    // Test manual trigger
    console.log("\n🎯 Testing manual rebalance trigger...");
    const tx3 = await automationHandler.triggerManualRebalance();
    await tx3.wait();
    console.log("✅ Manual rebalance triggered successfully");
    
    // Check updated stats
    const newStatus = await automationHandler.getAutomationStatus();
    console.log("Total Rebalances after trigger:", newStatus.totalRebalancesCount.toString());
    
    // Save deployment
    const deployment = {
        network: "sepolia",
        automationHandler: automationHandler.address,
        chainlinkAutomationRegistry: CHAINLINK_AUTOMATION_REGISTRY,
        deployedAt: new Date().toISOString(),
        configuration: {
            rebalanceInterval: "3600 seconds (1 hour)",
            apyThreshold: "2%",
            minRebalanceAmount: "1000 USDC"
        },
        linkedContracts: DEPLOYED_CONTRACTS,
        features: [
            "Time-based rebalancing",
            "APY difference triggers",
            "Manual override capability",
            "Chainlink Automation compatible",
            "Gas-efficient checks"
        ]
    };
    
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(
        path.join(deploymentsDir, "automation-sepolia.json"),
        JSON.stringify(deployment, null, 2)
    );
    
    console.log("\n🎉 Automation Handler deployment complete!");
    console.log("\n📋 Deployment Summary:");
    console.log("-----------------------------------");
    console.log(`Automation Handler: ${automationHandler.address}`);
    console.log("-----------------------------------");
    
    console.log("\n✨ Features:");
    console.log("✅ Automated rebalancing every hour");
    console.log("✅ APY difference monitoring (2% threshold)");
    console.log("✅ Chainlink Automation compatible");
    console.log("✅ Manual trigger for testing");
    console.log("✅ Gas-efficient upkeep checks");
    
    console.log("\n🔗 Next Steps:");
    console.log("1. Fund the contract with LINK for automation");
    console.log("2. Register with Chainlink Automation (optional)");
    console.log("3. Update frontend with Automation address");
    console.log("4. Show automated rebalancing in demo");
    
    console.log("\n📝 Add to config/contracts.ts:");
    console.log(`AutomationHandler: '${automationHandler.address}',`);
    
    console.log("\n💡 To register with Chainlink Automation:");
    console.log("1. Go to: https://automation.chain.link");
    console.log("2. Register new Upkeep");
    console.log("3. Contract address:", automationHandler.address);
    console.log("4. Fund with LINK tokens");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });