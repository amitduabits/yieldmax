// scripts/setup-chainlink-testnet.js
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying YieldMax Core Contracts on Sepolia...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()));
    
    // Sepolia addresses
    const SEPOLIA_CCIP_ROUTER = "0xD0daae2231E9CB96b94C8512223533293C3693Bf";
    const SEPOLIA_LINK_TOKEN = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
    
    try {
        // 1. Deploy MockERC20 (USDC)
        console.log("\n1️⃣ Deploying Mock USDC...");
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
        await usdc.deployed();
        console.log("✅ Mock USDC deployed:", usdc.address);
        
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
        
        // 5. Initialize the vault
        console.log("\n5️⃣ Initializing YieldMaxVault...");
        await vault.initialize(
            usdc.address,                    // asset
            strategyEngine.address,          // strategy engine
            SEPOLIA_CCIP_ROUTER,            // CCIP router
            SEPOLIA_LINK_TOKEN,             // LINK token
            deployer.address                // keeper (deployer for now)
        );
        console.log("✅ YieldMaxVault initialized");
        
        // 6. Basic configuration
        console.log("\n6️⃣ Basic configuration...");
        const ARBITRUM_SEPOLIA_CHAIN_SELECTOR = "3478487238524512106";
        
        // Configure cross-chain manager
        await crossChainManager.configureChain(
            ARBITRUM_SEPOLIA_CHAIN_SELECTOR,
            ethers.constants.AddressZero, // Will update when Arbitrum vault is deployed
            500000
        );
        
        // Configure vault
        await vault.setSupportedChain(ARBITRUM_SEPOLIA_CHAIN_SELECTOR, true);
        
        console.log("✅ Basic configuration completed");
        
        // 7. Mint test USDC
        console.log("\n7️⃣ Minting test USDC...");
        await usdc.mint(deployer.address, ethers.utils.parseUnits("10000", 6)); // 10,000 USDC
        console.log("✅ Minted 10,000 test USDC to deployer");
        
        // 8. Save deployment info
        const deploymentInfo = {
            network: "sepolia",
            timestamp: new Date().toISOString(),
            contracts: {
                vault: vault.address,
                strategyEngine: strategyEngine.address,
                crossChainManager: crossChainManager.address,
                usdc: usdc.address,
                ccipRouter: SEPOLIA_CCIP_ROUTER,
                linkToken: SEPOLIA_LINK_TOKEN
            },
            configuration: {
                performanceFee: "1000", // 10%
                withdrawalDelay: "86400", // 24 hours
                supportedChains: [ARBITRUM_SEPOLIA_CHAIN_SELECTOR]
            }
        };
        
        // Save to file
        const fs = require("fs");
        const path = require("path");
        const deploymentsDir = path.join(__dirname, "../deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        fs.writeFileSync(
            path.join(deploymentsDir, "sepolia-complete.json"),
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log("\n🎉 Core deployment completed successfully!");
        console.log("📋 Contract Addresses:");
        console.log(`   YieldMaxVault: ${vault.address}`);
        console.log(`   StrategyEngine: ${strategyEngine.address}`);
        console.log(`   CrossChainManager: ${crossChainManager.address}`);
        console.log(`   Mock USDC: ${usdc.address}`);
        
        console.log("\n🔗 Next steps:");
        console.log("1. Fund CrossChainManager with LINK tokens for CCIP");
        console.log("2. Test basic deposit functionality");
        console.log("3. Deploy optional Chainlink components (AIOptimizer, Keeper)");
        console.log("4. Deploy on Arbitrum Sepolia");
        console.log("5. Update vault addresses for cross-chain");
        console.log("6. Verify contracts on Etherscan");
        
        console.log("\n📄 Deployment saved to: deployments/sepolia-complete.json");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        console.error("Full error:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });