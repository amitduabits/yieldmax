// scripts/test-manual-rebalance.js
const { ethers } = require("hardhat");

const AUTOMATION_ADDRESS = "0x15E5A976D8ca503ab9756f6b3a9064cc0510EC31";

async function main() {
    console.log("🧪 Testing Manual Rebalance...\n");
    
    const [signer] = await ethers.getSigners();
    console.log("Account:", signer.address);
    
    const ABI = [
        "function triggerManualRebalance() external",
        "function totalRebalances() view returns (uint256)",
        "function owner() view returns (address)"
    ];
    
    const automation = new ethers.Contract(AUTOMATION_ADDRESS, ABI, signer);
    
    // Check current state
    console.log("Current total rebalances:", (await automation.totalRebalances()).toString());
    
    // Check if we're the owner
    try {
        const owner = await automation.owner();
        console.log("Contract owner:", owner);
        console.log("Are you owner?", owner.toLowerCase() === signer.address.toLowerCase());
    } catch (e) {
        console.log("Owner check failed");
    }
    
    // Try manual rebalance
    console.log("\n🎯 Triggering manual rebalance...");
    try {
        const tx = await automation.triggerManualRebalance();
        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Success! Gas used:", receipt.gasUsed.toString());
        
        // Check new count
        const newCount = await automation.totalRebalances();
        console.log("New total rebalances:", newCount.toString());
    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.message.includes("Only owner")) {
            console.log("\n⚠️  The triggerManualRebalance function requires owner permission");
            console.log("Solution: Deploy a new contract or remove the onlyOwner modifier");
        }
    }
}

main().catch(console.error);