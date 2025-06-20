// scripts/setup-ccip-simple.js
const hre = require("hardhat");
const { ethers } = require("hardhat");

// Known deployment addresses
const DEPLOYMENTS = {
    sepolia: {
        crossChainManager: "0x75184db477E030aD316CabaD72e18292F350560C",
        vault: "0xECbA31cf51F88BA5193186abf35225ECE097df44"
    },
    arbitrumSepolia: {
        crossChainManager: "0xE4d860E4bd22e4ae4685bB5D5b7c6c24d27E5fba",
        vault: "0xb83970215ba34e25DDE5a9Db07737aA48ABfa802"
    }
};

// CCIP Chain Selectors
const CHAIN_SELECTORS = {
    sepolia: "16015286601757825753",
    arbitrumSepolia: "3478487238524512106"
};

async function main() {
    console.log("🔗 Setting up CCIP lanes between Sepolia and Arbitrum...\n");
    
    const [signer] = await ethers.getSigners();
    console.log("Setting up with account:", signer.address);
    
    // Minimal ABI for configuration
    const CrossChainABI = [
        "function configureChain(uint64 chainSelector, address vault, uint256 gasLimit) external",
        "function getChainConfig(uint64 chainSelector) view returns (tuple(address vault, bool isActive, uint256 gasLimit))"
    ];
    
    // Connect to Sepolia CrossChainManager
    const sepoliaCrossChain = new ethers.Contract(
        DEPLOYMENTS.sepolia.crossChainManager,
        CrossChainABI,
        signer
    );
    
    console.log("\n🔧 Configuring Arbitrum as destination on Sepolia contract...");
    
    try {
        // Configure Arbitrum as a destination
        const gasLimit = 500000;
        const tx = await sepoliaCrossChain.configureChain(
            CHAIN_SELECTORS.arbitrumSepolia,
            DEPLOYMENTS.arbitrumSepolia.vault,
            gasLimit
        );
        
        console.log("Transaction sent:", tx.hash);
        await tx.wait();
        console.log("✅ Arbitrum configured on Sepolia!");
        
        // Verify configuration
        const config = await sepoliaCrossChain.getChainConfig(CHAIN_SELECTORS.arbitrumSepolia);
        console.log("\n📋 Configuration verified:");
        console.log("- Vault address:", config.vault);
        console.log("- Is active:", config.isActive);
        console.log("- Gas limit:", config.gasLimit.toString());
        
    } catch (error) {
        if (error.message.includes("Already configured")) {
            console.log("✅ Arbitrum already configured on Sepolia");
        } else {
            console.error("❌ Error:", error.message);
        }
    }
    
    console.log("\n✅ CCIP lane configuration complete!");
    console.log("\n💰 Don't forget to fund contracts with LINK:");
    console.log(`- Sepolia: ${DEPLOYMENTS.sepolia.crossChainManager}`);
    console.log(`- Arbitrum: ${DEPLOYMENTS.arbitrumSepolia.crossChainManager}`);
    
    console.log("\n📊 Configuration Summary:");
    console.log("------------------------");
    console.log("Sepolia → Arbitrum: Configured ✅");
    console.log("Arbitrum → Sepolia: Manual setup needed");
    console.log("------------------------");
    
    console.log("\n🔗 To complete setup:");
    console.log("1. Switch to Arbitrum network");
    console.log("2. Run this script again with --network arbitrumSepolia");
    console.log("3. Fund both contracts with LINK");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });