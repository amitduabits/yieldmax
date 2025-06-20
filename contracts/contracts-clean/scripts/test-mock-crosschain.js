// scripts/test-mock-crosschain.js
const hre = require("hardhat");
const { ethers } = require("hardhat");

const CONTRACTS = {
    sepolia: {
        crossChainManager: "0x75184db477E030aD316CabaD72e18292F350560C"
    },
    arbitrumSepolia: {
        crossChainManager: "0xE4d860E4bd22e4ae4685bB5D5b7c6c24d27E5fba"
    }
};

async function main() {
    console.log("🧪 Testing Mock Cross-Chain Functions...\n");
    
    const [signer] = await ethers.getSigners();
    console.log("Testing with account:", signer.address);
    
    // Mock contract ABI
    const MockCrossChainABI = [
        "function getChainComparison() view returns (tuple(uint256 bestAPY, string bestProtocol, uint256 tvl, uint256 lastUpdate, bool isActive), tuple(uint256 bestAPY, string bestProtocol, uint256 tvl, uint256 lastUpdate, bool isActive), tuple(uint256 bestAPY, string bestProtocol, uint256 tvl, uint256 lastUpdate, bool isActive), tuple(uint256 bestAPY, string bestProtocol, uint256 tvl, uint256 lastUpdate, bool isActive))",
        "function totalRebalances() view returns (uint256)",
        "function totalCrossChainVolume() view returns (uint256)",
        "function initiateCrossChainRebalance(uint64 destinationChain, address token, uint256 amount) payable returns (bytes32)",
        "function updateYieldData() external"
    ];
    
    const crossChain = new ethers.Contract(
        CONTRACTS.sepolia.crossChainManager,
        MockCrossChainABI,
        signer
    );
    
    // Test 1: Update yield data
    console.log("📊 Updating yield data...");
    try {
        const tx1 = await crossChain.updateYieldData();
        console.log("Transaction sent:", tx1.hash);
        await tx1.wait();
        console.log("✅ Yield data updated!");
    } catch (e) {
        console.log("❌ Update failed:", e.message.substring(0, 100));
    }
    
    // Test 2: Simulate cross-chain rebalance
    console.log("\n🌉 Testing cross-chain rebalance...");
    const destinationChain = "3478487238524512106"; // Arbitrum chain selector
    const mockToken = "0x0000000000000000000000000000000000000000"; // Mock address
    const amount = ethers.utils.parseUnits("100", 6); // 100 USDC
    
    try {
        // The mock contract simulates a rebalance
        const tx2 = await crossChain.initiateCrossChainRebalance(
            destinationChain,
            mockToken,
            amount,
            { value: ethers.utils.parseEther("0.001") } // Small ETH for simulation
        );
        
        console.log("Transaction sent:", tx2.hash);
        const receipt = await tx2.wait();
        console.log("✅ Cross-chain rebalance simulated!");
        
        // Check for events
        if (receipt.events && receipt.events.length > 0) {
            console.log("\n📢 Events emitted:");
            receipt.events.forEach((event, index) => {
                if (event.event) {
                    console.log(`Event ${index}: ${event.event}`);
                    if (event.args && event.args.messageId) {
                        console.log(`Message ID: ${event.args.messageId}`);
                    }
                }
            });
        }
        
    } catch (e) {
        console.log("❌ Rebalance failed:", e.message.substring(0, 150));
    }
    
    // Test 3: Check updated stats
    console.log("\n📈 Checking updated statistics...");
    const rebalances = await crossChain.totalRebalances();
    const volume = await crossChain.totalCrossChainVolume();
    
    console.log("Total Rebalances:", rebalances.toString());
    console.log("Total Volume:", ethers.utils.formatUnits(volume, 6), "USDC");
    
    // Show current yields
    console.log("\n🏆 Current Best Yields:");
    const chainData = await crossChain.getChainComparison();
    const chains = ["Ethereum", "Arbitrum", "Polygon", "Optimism"];
    
    chains.forEach((chain, index) => {
        const apy = ethers.utils.formatUnits(chainData[index].bestAPY, 2);
        const protocol = chainData[index].bestProtocol;
        console.log(`${chain}: ${apy}% on ${protocol}`);
    });
    
    console.log("\n✅ Mock cross-chain testing complete!");
    console.log("\n💡 Note: This is a mock contract for UI demonstration.");
    console.log("In production, real CCIP integration would:");
    console.log("- Send actual cross-chain messages");
    console.log("- Bridge real assets between chains");
    console.log("- Use Chainlink CCIP for secure messaging");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });