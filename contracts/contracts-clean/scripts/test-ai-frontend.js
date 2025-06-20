// scripts/test-ai-frontend.js
const hre = require("hardhat");
const { ethers } = require("hardhat");

const AI_OPTIMIZER_ADDRESS = "0xAF1b506b0dCD839785997DDE6A3fbaC7B3d6f41A";

async function main() {
    console.log("🧪 Testing AI Optimizer Frontend Integration...\n");
    
    const [signer] = await ethers.getSigners();
    console.log("Testing with account:", signer.address);
    
    // AI Optimizer ABI (same as used in frontend)
    const AI_OPTIMIZER_ABI = [
        "function requestOptimization(address user, uint256 amount, uint8 riskTolerance) external returns (bytes32)",
        "function getOptimization(address user) external view returns (tuple(address protocol, uint256 allocation, uint256 expectedAPY, uint256 riskScore, string reasoning)[] strategies, uint256 totalExpectedAPY, uint256 confidence, uint256 gasEstimate, uint256 timestamp)",
        "function getStats() external view returns (uint256 _totalOptimizations, uint256 _lastOptimizationTime, uint256 _averageConfidence)",
        "function optimizationCount(address) external view returns (uint256)"
    ];
    
    const aiOptimizer = new ethers.Contract(
        AI_OPTIMIZER_ADDRESS,
        AI_OPTIMIZER_ABI,
        signer
    );
    
    console.log("📊 Current AI Optimizer Stats:");
    const stats = await aiOptimizer.getStats();
    console.log("Total Optimizations:", stats._totalOptimizations.toString());
    console.log("Average Confidence:", stats._averageConfidence.toString() + "%");
    
    // Test different risk profiles
    const testCases = [
        { risk: 2, amount: "5000", label: "Conservative" },
        { risk: 5, amount: "10000", label: "Balanced" },
        { risk: 9, amount: "20000", label: "Aggressive" }
    ];
    
    for (const test of testCases) {
        console.log(`\n🎯 Testing ${test.label} Strategy (Risk: ${test.risk}):`);
        
        const amount = ethers.utils.parseUnits(test.amount, 6);
        
        // Request optimization
        const tx = await aiOptimizer.requestOptimization(
            signer.address,
            amount,
            test.risk
        );
        await tx.wait();
        
        // Get results
        const result = await aiOptimizer.getOptimization(signer.address);
        
        console.log(`Total Expected APY: ${result.totalExpectedAPY / 100}%`);
        console.log(`Confidence: ${result.confidence}%`);
        console.log(`Strategies: ${result.strategies.length}`);
        
        // Show allocation
        console.log("Allocation:");
        result.strategies.forEach((strategy, i) => {
            console.log(`  - ${getProtocolName(strategy.protocol)}: ${strategy.allocation / 100}% (${strategy.expectedAPY / 100}% APY)`);
        });
    }
    
    // Check user's optimization count
    const userOptCount = await aiOptimizer.optimizationCount(signer.address);
    console.log(`\n📈 Your total optimizations: ${userOptCount}`);
    
    console.log("\n✅ AI Optimizer is working correctly!");
    console.log("\n🎨 Frontend Integration Tips:");
    console.log("1. The AIOptimization component should now show real recommendations");
    console.log("2. Try different risk levels (slider from 1-10)");
    console.log("3. The optimization happens instantly (no Chainlink Functions wait time)");
    console.log("4. Each optimization updates the global stats");
    
    console.log("\n🌐 To test in your app:");
    console.log("1. Go to http://localhost:3000");
    console.log("2. Connect your wallet");
    console.log("3. Navigate to 'AI Optimization' tab");
    console.log("4. Adjust risk tolerance slider");
    console.log("5. Click 'Optimize Strategy'");
}

function getProtocolName(address) {
    const protocols = {
        "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2": "Aave",
        "0xc3d688B66703497DAA19211EEdff47f25384cdc3": "Compound", 
        "0x5f11111111111111111111111111111111111111": "Yearn"
    };
    return protocols[address] || "Unknown";
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });