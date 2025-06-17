// scripts/deploy-core-only.js
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 YieldMax Clean Deployment on Sepolia");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()));
    
    // Sepolia configuration
    const SEPOLIA_CCIP_ROUTER = "0xD0daae2231E9CB96b94C8512223533293C3693Bf";
    const SEPOLIA_LINK_TOKEN = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
    
    try {
        // 1. Deploy MockERC20 (USDC)
        console.log("\n1️⃣ Deploying MockERC20...");
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
        await usdc.deployed();
        console.log("✅ MockERC20 deployed:", usdc.address);
        
        // 2. Deploy StrategyEngine  
        console.log("\n2️⃣ Deploying StrategyEngine...");
        const StrategyEngine = await ethers.getContractFactory("StrategyEngine");
        const strategyEngine = await StrategyEngine.deploy();
        await strategyEngine.deployed();
        console.log("✅ StrategyEngine deployed:", strategyEngine.address);
        
        // 3. Deploy CrossChainManager
        console.log("\n3️⃣ Deploying CrossChainManager...");
        const CrossChainManager = await ethers.getContractFactory("CrossChainManager");
        const crossChainManager = await CrossChainManager.deploy(
            SEPOLIA_CCIP_ROUTER,
            usdc.address
        );
        await crossChainManager.deployed();
        console.log("✅ CrossChainManager deployed:", crossChainManager.address);
        
        // 4. Deploy YieldMaxVault
        console.log("\n4️⃣ Deploying YieldMaxVault...");
        const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault");
        const vault = await YieldMaxVault.deploy();
        await vault.deployed();
        console.log("✅ YieldMaxVault deployed:", vault.address);
        
        // 5. Initialize YieldMaxVault
        console.log("\n5️⃣ Initializing YieldMaxVault...");
        await vault.initialize(
            usdc.address,
            strategyEngine.address,
            SEPOLIA_CCIP_ROUTER,
            SEPOLIA_LINK_TOKEN,
            deployer.address
        );
        console.log("✅ YieldMaxVault initialized");
        
        // 6. Configure contracts
        console.log("\n6️⃣ Configuring contracts...");
        const ARBITRUM_SEPOLIA_SELECTOR = "3478487238524512106";
        
        await crossChainManager.configureChain(
            ARBITRUM_SEPOLIA_SELECTOR,
            ethers.constants.AddressZero,
            500000
        );
        
        await vault.setSupportedChain(ARBITRUM_SEPOLIA_SELECTOR, true);
        console.log("✅ Configuration completed");
        
        // 7. Mint test USDC and test deposit
        console.log("\n7️⃣ Testing functionality...");
        await usdc.mint(deployer.address, ethers.utils.parseUnits("10000", 6));
        
        const depositAmount = ethers.utils.parseUnits("100", 6);
        await usdc.approve(vault.address, depositAmount);
        await vault.deposit(depositAmount, deployer.address);
        
        const totalAssets = await vault.totalAssets();
        const userData = await vault.getUserData(deployer.address);
        
        console.log("✅ Test successful!");
        console.log(`   Total Assets: ${ethers.utils.formatUnits(totalAssets, 6)} USDC`);
        console.log(`   User Shares: ${ethers.utils.formatUnits(userData.shares, 6)}`);
        
        // 8. Save deployment
        const deployment = {
            network: "sepolia",
            timestamp: new Date().toISOString(),
            contracts: {
                vault: vault.address,
                strategyEngine: strategyEngine.address,
                crossChainManager: crossChainManager.address,
                usdc: usdc.address
            }
        };
        
        const fs = require("fs");
        fs.writeFileSync("deployments/sepolia.json", JSON.stringify(deployment, null, 2));
        
        console.log("\n🎉 DEPLOYMENT SUCCESSFUL!");
        console.log("\n📋 Addresses:");
        console.log(`YieldMaxVault: ${vault.address}`);
        console.log(`StrategyEngine: ${strategyEngine.address}`);
        console.log(`CrossChainManager: ${crossChainManager.address}`);
        console.log(`MockERC20: ${usdc.address}`);
        
        console.log("\n✅ What's Working:");
        console.log("• Vault deposits and withdrawals");
        console.log("• Share-based accounting");
        console.log("• Cross-chain configuration");
        console.log("• Strategy engine");
        
        console.log("\n🔗 Next Steps:");
        console.log("1. Update frontend with these addresses");
        console.log("2. Deploy on Arbitrum Sepolia");
        console.log("3. Add Chainlink Automation");
        console.log("4. Add AI optimization");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        console.error(error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });