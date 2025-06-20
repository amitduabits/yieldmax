// scripts/check-contract-status.js
const hre = require("hardhat");
const { ethers } = require("hardhat");

const CONTRACTS = {
    sepolia: {
        crossChainManager: "0x75184db477E030aD316CabaD72e18292F350560C",
        vault: "0xECbA31cf51F88BA5193186abf35225ECE097df44"
    },
    arbitrumSepolia: {
        crossChainManager: "0xE4d860E4bd22e4ae4685bB5D5b7c6c24d27E5fba",
        vault: "0xb83970215ba34e25DDE5a9Db07737aA48ABfa802"
    }
};

async function main() {
    console.log("🔍 Checking contract status...\n");
    
    const [signer] = await ethers.getSigners();
    console.log("Current account:", signer.address);
    
    // Check Sepolia contract
    console.log("\n📋 Sepolia Contracts:");
    console.log("CrossChainManager:", CONTRACTS.sepolia.crossChainManager);
    
    // ABI to check ownership and state
    const CheckABI = [
        "function owner() view returns (address)",
        "function totalRebalances() view returns (uint256)",
        "function totalCrossChainVolume() view returns (uint256)",
        "function getChainComparison() view returns (tuple(uint256 bestAPY, string bestProtocol, uint256 tvl, uint256 lastUpdate, bool isActive), tuple(uint256 bestAPY, string bestProtocol, uint256 tvl, uint256 lastUpdate, bool isActive), tuple(uint256 bestAPY, string bestProtocol, uint256 tvl, uint256 lastUpdate, bool isActive), tuple(uint256 bestAPY, string bestProtocol, uint256 tvl, uint256 lastUpdate, bool isActive))"
    ];
    
    try {
        const crossChain = new ethers.Contract(
            CONTRACTS.sepolia.crossChainManager,
            CheckABI,
            signer
        );
        
        // Check if contract exists
        const code = await ethers.provider.getCode(CONTRACTS.sepolia.crossChainManager);
        if (code === "0x") {
            console.log("❌ Contract not deployed at this address!");
            return;
        }
        
        console.log("✅ Contract exists");
        
        // Try to get owner (might fail if no owner function)
        try {
            const owner = await crossChain.owner();
            console.log("Owner:", owner);
            console.log("You are owner:", owner.toLowerCase() === signer.address.toLowerCase() ? "✅ YES" : "❌ NO");
        } catch (e) {
            console.log("Owner: Cannot read (might not have owner function)");
        }
        
        // Check contract state
        try {
            const rebalances = await crossChain.totalRebalances();
            const volume = await crossChain.totalCrossChainVolume();
            console.log("\nContract Stats:");
            console.log("Total Rebalances:", rebalances.toString());
            console.log("Total Volume:", ethers.utils.formatUnits(volume, 6), "USDC");
            
            // Get chain data
            const chainData = await crossChain.getChainComparison();
            console.log("\nChain APYs:");
            console.log("Ethereum:", ethers.utils.formatUnits(chainData[0].bestAPY, 2) + "%");
            console.log("Arbitrum:", ethers.utils.formatUnits(chainData[1].bestAPY, 2) + "%");
            console.log("Polygon:", ethers.utils.formatUnits(chainData[2].bestAPY, 2) + "%");
            console.log("Optimism:", ethers.utils.formatUnits(chainData[3].bestAPY, 2) + "%");
        } catch (e) {
            console.log("Error reading contract state:", e.message);
        }
        
    } catch (error) {
        console.error("Error:", error.message);
    }
    
    // Check wallet balances
    console.log("\n💰 Wallet Balances:");
    const ethBalance = await ethers.provider.getBalance(signer.address);
    console.log("ETH:", ethers.utils.formatEther(ethBalance));
    
    // Check LINK balance
    const LINK_ABI = ["function balanceOf(address) view returns (uint256)"];
    const linkToken = new ethers.Contract(
        "0x779877A7B0D9E8603169DdbD7836e478b4624789", // Sepolia LINK
        LINK_ABI,
        signer
    );
    
    try {
        const linkBalance = await linkToken.balanceOf(signer.address);
        console.log("LINK:", ethers.utils.formatEther(linkBalance));
    } catch (e) {
        console.log("LINK: Error reading balance");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });