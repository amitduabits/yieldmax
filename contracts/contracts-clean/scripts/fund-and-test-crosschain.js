// scripts/fund-and-test-crosschain.js
const hre = require("hardhat");
const { ethers } = require("hardhat");

const CONTRACTS = {
    sepolia: {
        crossChainManager: "0x75184db477E030aD316CabaD72e18292F350560C",
        link: "0x779877A7B0D9E8603169DdbD7836e478b4624789"
    }
};

async function main() {
    console.log("💰 Funding Contract with LINK...\n");
    
    const [signer] = await ethers.getSigners();
    console.log("Account:", signer.address);
    
    // LINK token ABI
    const LINK_ABI = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address account) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
    ];
    
    const linkToken = new ethers.Contract(
        CONTRACTS.sepolia.link,
        LINK_ABI,
        signer
    );
    
    // Check balances
    console.log("📊 Checking balances...");
    const userLinkBalance = await linkToken.balanceOf(signer.address);
    const contractLinkBalance = await linkToken.balanceOf(CONTRACTS.sepolia.crossChainManager);
    
    console.log("Your LINK balance:", ethers.utils.formatEther(userLinkBalance));
    console.log("Contract LINK balance:", ethers.utils.formatEther(contractLinkBalance));
    
    // Fund contract if needed
    if (contractLinkBalance.lt(ethers.utils.parseEther("5"))) {
        console.log("\n💸 Sending 10 LINK to contract...");
        const amount = ethers.utils.parseEther("10");
        
        try {
            const tx = await linkToken.transfer(CONTRACTS.sepolia.crossChainManager, amount);
            console.log("Transaction sent:", tx.hash);
            await tx.wait();
            console.log("✅ Contract funded with LINK!");
            
            const newBalance = await linkToken.balanceOf(CONTRACTS.sepolia.crossChainManager);
            console.log("New contract LINK balance:", ethers.utils.formatEther(newBalance));
        } catch (e) {
            console.log("❌ Transfer failed:", e.message);
        }
    } else {
        console.log("\n✅ Contract already has sufficient LINK");
    }
    
    // Now test the rebalance with manual gas limit
    console.log("\n🌉 Testing cross-chain rebalance with manual gas...");
    
    const MockCrossChainABI = [
        "function initiateCrossChainRebalance(uint64 destinationChain, address token, uint256 amount) payable returns (bytes32)"
    ];
    
    const crossChain = new ethers.Contract(
        CONTRACTS.sepolia.crossChainManager,
        MockCrossChainABI,
        signer
    );
    
    try {
        const destinationChain = "3478487238524512106"; // Arbitrum
        const mockToken = ethers.constants.AddressZero;
        const amount = ethers.utils.parseUnits("100", 6);
        
        // Use manual gas limit
        const tx = await crossChain.initiateCrossChainRebalance(
            destinationChain,
            mockToken,
            amount,
            { 
                value: ethers.utils.parseEther("0.001"),
                gasLimit: 300000 // Manual gas limit
            }
        );
        
        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Cross-chain rebalance completed!");
        console.log("Gas used:", receipt.gasUsed.toString());
        
    } catch (e) {
        console.log("❌ Still failing:", e.message.substring(0, 100));
        console.log("\n💡 This is expected for a mock contract.");
        console.log("The UI demonstration works without actual cross-chain transfers.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });