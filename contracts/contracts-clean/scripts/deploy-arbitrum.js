// scripts/deploy-arbitrum.js
const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Arbitrum Sepolia addresses
const ARBITRUM_SEPOLIA_CCIP_ROUTER = "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165";
const ARBITRUM_SEPOLIA_LINK = "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E";
const ARBITRUM_SEPOLIA_USDC = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";

// Sepolia chain selector for CCIP
const SEPOLIA_CHAIN_SELECTOR = "16015286601757825753";
const ARBITRUM_CHAIN_SELECTOR = "3478487238524512106";

async function main() {
    console.log("🌐 Deploying YieldMax to Arbitrum Sepolia...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Get Sepolia deployment info
    const sepoliaDeploymentPath = path.join(__dirname, "../deployments/sepolia.json");
    let sepoliaDeployment = {};
    
    if (fs.existsSync(sepoliaDeploymentPath)) {
        sepoliaDeployment = JSON.parse(fs.readFileSync(sepoliaDeploymentPath, 'utf8'));
        console.log("📋 Found Sepolia deployment at:", sepoliaDeployment.crossChainManager);
    }
    
    // Deploy Mock USDC if needed (for testing)
    console.log("\n📦 Deploying contracts to Arbitrum Sepolia...");
    
    // Deploy CrossChainManager on Arbitrum
    const CrossChainManager = await ethers.getContractFactory("MockCrossChainYieldManager");
    const crossChainManager = await CrossChainManager.deploy();
    await crossChainManager.deployed();
    
    console.log("✅ CrossChainManager deployed to:", crossChainManager.address);
    
    // Initialize with chain data
    console.log("\n🔧 Initializing Arbitrum chain data...");
    await crossChainManager.updateYieldData();
    
    // Deploy YieldMaxVault on Arbitrum
    console.log("\n📦 Deploying YieldMaxVault...");
    const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault");
    
    // The simplified YieldMaxVault only takes the asset address
    const vault = await YieldMaxVault.deploy(ARBITRUM_SEPOLIA_USDC);
    await vault.deployed();
    
    console.log("✅ YieldMaxVault deployed to:", vault.address);
    
    // Configure cross-chain connections
    console.log("\n🔗 Configuring cross-chain connections...");
    
    // Set up trusted remote addresses
    if (sepoliaDeployment.crossChainManager) {
        console.log("Setting Sepolia as trusted remote...");
        
        // This would be done through CCIP configuration
        // For the mock, we'll store the addresses
        console.log(`Sepolia CrossChain: ${sepoliaDeployment.crossChainManager}`);
        console.log(`Arbitrum CrossChain: ${crossChainManager.address}`);
    }
    
    // Save deployment
    const deployment = {
        network: "arbitrumSepolia",
        chainId: 421614,
        contracts: {
            crossChainManager: crossChainManager.address,
            vault: vault.address,
            usdc: ARBITRUM_SEPOLIA_USDC,
        },
        ccip: {
            router: ARBITRUM_SEPOLIA_CCIP_ROUTER,
            link: ARBITRUM_SEPOLIA_LINK,
            chainSelector: ARBITRUM_CHAIN_SELECTOR,
        },
        linkedChains: {
            sepolia: {
                chainSelector: SEPOLIA_CHAIN_SELECTOR,
                crossChainManager: sepoliaDeployment.crossChainManager || "Not deployed",
            }
        },
        timestamp: new Date().toISOString()
    };
    
    // Save to file
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }
    
    fs.writeFileSync(
        path.join(deploymentsDir, "arbitrum-sepolia.json"),
        JSON.stringify(deployment, null, 2)
    );
    
    console.log("\n🎉 Arbitrum Sepolia deployment complete!");
    console.log("\n📋 Deployment Summary:");
    console.log("------------------------");
    console.log(`CrossChainManager: ${crossChainManager.address}`);
    console.log(`YieldMaxVault: ${vault.address}`);
    console.log("------------------------");
    
    console.log("\n🔗 Cross-Chain Setup Instructions:");
    console.log("1. Fund Arbitrum contracts with LINK for CCIP");
    console.log("2. Run setup-ccip-lanes.js to configure message passing");
    console.log("3. Update frontend with Arbitrum addresses");
    
    // Return deployment info
    return deployment;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });