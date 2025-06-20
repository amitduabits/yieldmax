// scripts/verify-all-contracts.js
const hre = require("hardhat");

async function main() {
    console.log("🔍 Verifying YieldMax Contracts on Etherscan...\n");
    
    const contracts = [
        {
            name: "MockAIOptimizer",
            address: "0xAF1b506b0dCD839785997DDE6A3fbaC7B3d6f41A",
            constructorArgs: [] // No constructor arguments
        },
        {
            name: "MockCrossChainYieldManager",
            address: "0x75184db477E030aD316CabaD72e18292F350560C",
            constructorArgs: [] // No constructor arguments
        },
        {
            name: "YieldMaxVault",
            address: "0xECbA31cf51F88BA5193186abf35225ECE097df44",
            constructorArgs: ["0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d"] // USDC address
        }
    ];
    
    for (const contract of contracts) {
        console.log(`\n📋 Verifying ${contract.name}...`);
        console.log(`Address: ${contract.address}`);
        
        try {
            await hre.run("verify:verify", {
                address: contract.address,
                constructorArguments: contract.constructorArgs,
            });
            
            console.log(`✅ ${contract.name} verified successfully!`);
            console.log(`View on Etherscan: https://sepolia.etherscan.io/address/${contract.address}#code`);
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log(`✅ ${contract.name} is already verified!`);
                console.log(`View on Etherscan: https://sepolia.etherscan.io/address/${contract.address}#code`);
            } else {
                console.log(`❌ Error verifying ${contract.name}:`, error.message);
            }
        }
    }
    
    // Also verify on Arbitrum if needed
    console.log("\n\n📋 Arbitrum Sepolia Contracts:");
    const arbitrumContracts = [
        {
            name: "MockCrossChainYieldManager (Arbitrum)",
            address: "0xE4d860E4bd22e4ae4685bB5D5b7c6c24d27E5fba",
            constructorArgs: []
        },
        {
            name: "YieldMaxVault (Arbitrum)",
            address: "0xb83970215ba34e25DDE5a9Db07737aA48ABfa802",
            constructorArgs: ["0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"] // Arbitrum USDC
        }
    ];
    
    console.log("\nTo verify Arbitrum contracts, run:");
    arbitrumContracts.forEach(contract => {
        console.log(`npx hardhat verify --network arbitrumSepolia ${contract.address} ${contract.constructorArgs.join(' ')}`);
    });
    
    console.log("\n✨ Verification Summary:");
    console.log("- AI Optimizer: Ready for verification");
    console.log("- Cross-Chain Manager: Ready for verification");
    console.log("- YieldMax Vault: Ready for verification");
    console.log("\nVerified contracts show a green checkmark on Etherscan!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });