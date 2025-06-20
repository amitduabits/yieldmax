// scripts/check-ccip-setup.js
const hre = require("hardhat");
const { ethers } = require("hardhat");

const CONTRACTS = {
    sepolia: {
        crossChainManager: "0x75184db477E030aD316CabaD72e18292F350560C",
        link: "0x779877A7B0D9E8603169DdbD7836e478b4624789"
    },
    arbitrum: {
        crossChainManager: "0xE4d860E4bd22e4ae4685bB5D5b7c6c24d27E5fba",
        link: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E"
    }
};

async function main() {
    console.log("🔍 Checking CCIP Setup Status...\n");
    
    const [signer] = await ethers.getSigners();
    console.log("Your address:", signer.address);
    
    // Check LINK balances
    const LINK_ABI = ["function balanceOf(address) view returns (uint256)"];
    
    // Sepolia LINK
    console.log("\n📊 Sepolia Status:");
    const sepoliaLink = new ethers.Contract(CONTRACTS.sepolia.link, LINK_ABI, ethers.provider);
    const sepoliaContractBalance = await sepoliaLink.balanceOf(CONTRACTS.sepolia.crossChainManager);
    console.log("CrossChainManager LINK balance:", ethers.utils.formatEther(sepoliaContractBalance), "LINK");
    
    // Your wallet LINK balance
    const yourSepoliaLink = await sepoliaLink.balanceOf(signer.address);
    console.log("Your wallet LINK balance:", ethers.utils.formatEther(yourSepoliaLink), "LINK");
    
    console.log("\n📊 Arbitrum Status:");
    console.log("CrossChainManager:", CONTRACTS.arbitrum.crossChainManager);
    console.log("Note: Need to check Arbitrum LINK balance on Arbitrum network");
    
    console.log("\n🎯 Next Steps:");
    if (sepoliaContractBalance.gt(0)) {
        console.log("✅ Sepolia contract has LINK");
    } else {
        console.log("❌ Sepolia contract needs LINK");
    }
    console.log("❓ Arbitrum contract needs to be checked and funded");
    
    console.log("\n💡 To complete CCIP setup:");
    console.log("1. Fund Arbitrum contract with LINK");
    console.log("2. Configure cross-chain lanes");
    console.log("3. Enable message passing");
    console.log("4. Test cross-chain transfer");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });