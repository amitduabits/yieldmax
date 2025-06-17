// scripts/emergency-minimal.js
const { ethers } = require("hardhat");

async function main() {
    console.log("🚨 Emergency Minimal Deployment");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);
    
    const SEPOLIA_CCIP_ROUTER = "0xD0daae2231E9CB96b94C8512223533293C3693Bf";
    
    try {
        // 1. Just deploy MockERC20
        console.log("1️⃣ Deploying MockERC20...");
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
        await usdc.deployed();
        console.log("✅ USDC:", usdc.address);
        
        // 2. Deploy CrossChainManager
        console.log("2️⃣ Deploying CrossChainManager...");
        const CrossChainManager = await ethers.getContractFactory("CrossChainManager");
        const ccm = await CrossChainManager.deploy(SEPOLIA_CCIP_ROUTER, usdc.address);
        await ccm.deployed();
        console.log("✅ CrossChainManager:", ccm.address);
        
        // 3. Test USDC functionality
        await usdc.mint(deployer.address, ethers.utils.parseUnits("10000", 6));
        const balance = await usdc.balanceOf(deployer.address);
        console.log("✅ USDC Balance:", ethers.utils.formatUnits(balance, 6));
        
        console.log("\n🎉 Minimal deployment successful!");
        console.log("Core contracts are working. You can build from here.");
        
        // Save minimal deployment
        const deploymentInfo = {
            network: "sepolia",
            contracts: {
                usdc: usdc.address,
                crossChainManager: ccm.address,
                ccipRouter: SEPOLIA_CCIP_ROUTER
            }
        };
        
        const fs = require("fs");
        const path = require("path");
        fs.writeFileSync(
            path.join(__dirname, "../deployments/sepolia-minimal.json"),
            JSON.stringify(deploymentInfo, null, 2)
        );
        
    } catch (error) {
        console.error("❌ Even minimal deployment failed:", error.message);
        console.log("\n🔍 Debug info:");
        console.log("- Check if all import paths are correct");
        console.log("- Verify Chainlink package versions");
        console.log("- Make sure OpenZeppelin contracts are installed");
    }
}

main().catch(console.error);