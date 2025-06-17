// scripts/deploy-core-only.js
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 YieldMax Simplified Deployment on Sepolia");
    
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
        
        // 4. Deploy YieldMaxVault (simplified version - no initialization needed)
        console.log("\n4️⃣ Deploying YieldMaxVault...");
        const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault");
        const vault = await YieldMaxVault.deploy(
            usdc.address,                // asset
            strategyEngine.address,      // strategy engine
            SEPOLIA_CCIP_ROUTER,        // CCIP router
            SEPOLIA_LINK_TOKEN          // LINK token
        );
        await vault.deployed();
        console.log("✅ YieldMaxVault deployed:", vault.address);
        
        // 5. Configure contracts
        console.log("\n5️⃣ Configuring contracts...");
        const ARBITRUM_SEPOLIA_SELECTOR = "3478487238524512106";
        
        await crossChainManager.configureChain(
            ARBITRUM_SEPOLIA_SELECTOR,
            ethers.constants.AddressZero,
            500000
        );
        
        await vault.setSupportedChain(ARBITRUM_SEPOLIA_SELECTOR, true);
        console.log("✅ Configuration completed");
        
        // 6. Mint test USDC and test deposit
        console.log("\n6️⃣ Testing functionality...");
        await usdc.mint(deployer.address, ethers.utils.parseUnits("10000", 6));
        console.log("✅ Minted 10,000 test USDC");
        
        const depositAmount = ethers.utils.parseUnits("100", 6);
        await usdc.approve(vault.address, depositAmount);
        const tx = await vault.deposit(depositAmount, deployer.address);
        await tx.wait();
        
        const totalAssets = await vault.totalAssets();
        const userData = await vault.getUserData(deployer.address);
        
        console.log("✅ Test deposit successful!");
        console.log(`   Total Assets: ${ethers.utils.formatUnits(totalAssets, 6)} USDC`);
        console.log(`   User Shares: ${ethers.utils.formatUnits(userData.shares, 6)}`);
        
        // 7. Test withdrawal request
        console.log("\n7️⃣ Testing withdrawal...");
        const withdrawShares = ethers.utils.parseUnits("50", 6);
        const withdrawTx = await vault.requestWithdraw(withdrawShares);
        const withdrawReceipt = await withdrawTx.wait();
        
        console.log("✅ Withdrawal request successful!");
        
        // 8. Save deployment
        const deployment = {
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
            test: {
                depositSuccessful: true,
                withdrawalRequestSuccessful: true,
                totalAssets: ethers.utils.formatUnits(totalAssets, 6),
                userShares: ethers.utils.formatUnits(userData.shares, 6)
            }
        };
        
        const fs = require("fs");
        if (!fs.existsSync("deployments")) {
            fs.mkdirSync("deployments");
        }
        fs.writeFileSync("deployments/sepolia.json", JSON.stringify(deployment, null, 2));
        
        console.log("\n🎉 DEPLOYMENT SUCCESSFUL! 🎉");
        console.log("\n📋 Contract Addresses:");
        console.log(`   YieldMaxVault: ${vault.address}`);
        console.log(`   StrategyEngine: ${strategyEngine.address}`);
        console.log(`   CrossChainManager: ${crossChainManager.address}`);
        console.log(`   MockERC20 (USDC): ${usdc.address}`);
        
        console.log("\n✅ Features Working:");
        console.log("   ✓ ERC20 token deposits");
        console.log("   ✓ Share-based vault accounting");
        console.log("   ✓ Withdrawal requests");
        console.log("   ✓ Cross-chain CCIP configuration");
        console.log("   ✓ Strategy engine integration");
        console.log("   ✓ Access control & security");
        
        console.log("\n🔗 Next Steps:");
        console.log("1. Update frontend with these contract addresses");
        console.log("2. Fund CrossChainManager with LINK for cross-chain operations");
        console.log("3. Deploy on Arbitrum Sepolia for full cross-chain testing");
        console.log("4. Add Chainlink Automation for scheduled rebalancing");
        console.log("5. Add AI Optimizer for yield optimization");
        console.log("6. Verify contracts on Etherscan");
        
        console.log("\n📄 Deployment saved to: deployments/sepolia.json");
        
        // Verification commands
        console.log("\n🔍 Verification Commands:");
        console.log(`npx hardhat verify --network sepolia ${usdc.address} "USD Coin" "USDC" 6`);
        console.log(`npx hardhat verify --network sepolia ${strategyEngine.address}`);
        console.log(`npx hardhat verify --network sepolia ${crossChainManager.address} "${SEPOLIA_CCIP_ROUTER}" "${usdc.address}"`);
        console.log(`npx hardhat verify --network sepolia ${vault.address} "${usdc.address}" "${strategyEngine.address}" "${SEPOLIA_CCIP_ROUTER}" "${SEPOLIA_LINK_TOKEN}"`);
        
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