// scripts/setup-ccip-lanes.js
const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// CCIP Configuration
const CCIP_CONFIG = {
    sepolia: {
        router: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
        link: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
        chainSelector: "16015286601757825753"
    },
    arbitrumSepolia: {
        router: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
        link: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
        chainSelector: "3478487238524512106"
    }
};

async function main() {
    console.log("🔗 Setting up CCIP lanes between Sepolia and Arbitrum...\n");
    
    // Load deployments
    const sepoliaDeploymentPath = path.join(__dirname, "../../deployments/sepolia.json");
    const arbitrumDeploymentPath = path.join(__dirname, "../../deployments/arbitrum-sepolia.json");
    
    // Check if files exist, if not try the alternate path
    let sepoliaDeployment;
    let arbitrumDeployment;
    
    if (fs.existsSync(sepoliaDeploymentPath)) {
        sepoliaDeployment = JSON.parse(fs.readFileSync(sepoliaDeploymentPath, 'utf8'));
    } else {
        // Use hardcoded values from our deployment
        sepoliaDeployment = {
            crossChainManager: "0x75184db477E030aD316CabaD72e18292F350560C",
            YieldMaxVault: "0xECbA31cf51F88BA5193186abf35225ECE097df44"
        };
        console.log("📝 Using known Sepolia deployment addresses");
    }
    
    if (fs.existsSync(arbitrumDeploymentPath)) {
        arbitrumDeployment = JSON.parse(fs.readFileSync(arbitrumDeploymentPath, 'utf8'));
    } else {
        // Use hardcoded values from our deployment
        arbitrumDeployment = {
            contracts: {
                crossChainManager: "0xE4d860E4bd22e4ae4685bB5D5b7c6c24d27E5fba",
                vault: "0xb83970215ba34e25DDE5a9Db07737aA48ABfa802"
            }
        };
        console.log("📝 Using known Arbitrum deployment addresses");
    }
    
    console.log("📋 Loaded deployments:");
    console.log(`Sepolia CrossChain: ${sepoliaDeployment.crossChainManager}`);
    console.log(`Arbitrum CrossChain: ${arbitrumDeployment.contracts.crossChainManager}`);
    
    // Setup Sepolia -> Arbitrum lane
    console.log("\n🔧 Configuring Sepolia -> Arbitrum lane...");
    
    // Connect to Sepolia
    const sepoliaProvider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const sepoliaSigner = new ethers.Wallet(process.env.PRIVATE_KEY, sepoliaProvider);
    
    const CrossChainABI = [
        "function configureChain(uint64 chainSelector, address vault, uint256 gasLimit) external",
        "function setTrustedRemote(uint64 chainSelector, address remoteAddress) external",
        "function sendCrossChainMessage(uint64 destinationChain, address receiver, bytes calldata data, uint256 gasLimit) external payable returns (bytes32)",
    ];
    
    const sepoliaCrossChain = new ethers.Contract(
        sepoliaDeployment.crossChainManager,
        CrossChainABI,
        sepoliaSigner
    );
    
    // Configure Arbitrum as destination
    console.log("Setting Arbitrum as destination chain...");
    const arbitrumChainSelector = CCIP_CONFIG.arbitrumSepolia.chainSelector;
    const gasLimit = 500000; // Adjust based on needs
    
    try {
        const tx1 = await sepoliaCrossChain.configureChain(
            arbitrumChainSelector,
            arbitrumDeployment.contracts.vault,
            gasLimit
        );
        await tx1.wait();
        console.log("✅ Arbitrum configured on Sepolia");
    } catch (error) {
        console.log("⚠️  Configuration might already exist:", error.message);
    }
    
    // Setup Arbitrum -> Sepolia lane
    console.log("\n🔧 Configuring Arbitrum -> Sepolia lane...");
    
    // Connect to Arbitrum
    const arbitrumProvider = new ethers.providers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
    const arbitrumSigner = new ethers.Wallet(process.env.PRIVATE_KEY, arbitrumProvider);
    
    const arbitrumCrossChain = new ethers.Contract(
        arbitrumDeployment.contracts.crossChainManager,
        CrossChainABI,
        arbitrumSigner
    );
    
    // Configure Sepolia as destination
    console.log("Setting Sepolia as destination chain...");
    const sepoliaChainSelector = CCIP_CONFIG.sepolia.chainSelector;
    
    try {
        const tx2 = await arbitrumCrossChain.configureChain(
            sepoliaChainSelector,
            sepoliaDeployment.vault || sepoliaDeployment.YieldMaxVault,
            gasLimit
        );
        await tx2.wait();
        console.log("✅ Sepolia configured on Arbitrum");
    } catch (error) {
        console.log("⚠️  Configuration might already exist:", error.message);
    }
    
    // Create cross-chain configuration file
    const crossChainConfig = {
        lanes: {
            "sepolia-arbitrum": {
                source: {
                    chain: "sepolia",
                    crossChainManager: sepoliaDeployment.crossChainManager,
                    chainSelector: CCIP_CONFIG.sepolia.chainSelector,
                },
                destination: {
                    chain: "arbitrumSepolia",
                    crossChainManager: arbitrumDeployment.contracts.crossChainManager,
                    chainSelector: CCIP_CONFIG.arbitrumSepolia.chainSelector,
                },
                gasLimit: gasLimit,
                status: "active"
            },
            "arbitrum-sepolia": {
                source: {
                    chain: "arbitrumSepolia",
                    crossChainManager: arbitrumDeployment.contracts.crossChainManager,
                    chainSelector: CCIP_CONFIG.arbitrumSepolia.chainSelector,
                },
                destination: {
                    chain: "sepolia",
                    crossChainManager: sepoliaDeployment.crossChainManager,
                    chainSelector: CCIP_CONFIG.sepolia.chainSelector,
                },
                gasLimit: gasLimit,
                status: "active"
            }
        },
        ccipConfig: CCIP_CONFIG,
        timestamp: new Date().toISOString()
    };
    
    // Save configuration
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(
        path.join(deploymentsDir, "cross-chain-config.json"),
        JSON.stringify(crossChainConfig, null, 2)
    );
    
    console.log("\n✅ Cross-chain configuration complete!");
    console.log("\n📋 Active CCIP Lanes:");
    console.log("- Sepolia → Arbitrum ✅");
    console.log("- Arbitrum → Sepolia ✅");
    
    console.log("\n💰 Required LINK Funding:");
    console.log(`Sepolia contract needs LINK at: ${sepoliaDeployment.crossChainManager}`);
    console.log(`Arbitrum contract needs LINK at: ${arbitrumDeployment.contracts.crossChainManager}`);
    console.log("Recommended: 10 LINK per contract for testing");
    
    console.log("\n🔗 LINK Faucets:");
    console.log("Sepolia: https://faucets.chain.link/sepolia");
    console.log("Arbitrum: https://faucets.chain.link/arbitrum-sepolia");
    
    console.log("\n🎯 Next Steps:");
    console.log("1. Fund contracts with LINK");
    console.log("2. Run test-cross-chain.js to verify setup");
    console.log("3. Update frontend to show both chains");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });