// scripts/fund-bridges-eth.ts
import { ethers } from "hardhat";

async function main() {
  const BRIDGES = {
    sepolia: "0x537A6FFA3c76eD8B440cF960EF1611a5Fa114ecD",
    arbitrumSepolia: "0x58Ea4Dd03339A2EBEaa9C81Ee02Abaaa4F9956ce"
  };

  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("💰 Funding bridge with ETH for CCIP fees...\n");
  console.log("Your address:", signer.address);
  console.log("Your balance:", ethers.utils.formatEther(await signer.getBalance()), "ETH");
  
  let bridgeAddress: string;
  let bridgeName: string;
  
  if (network.chainId === 11155111) {
    bridgeAddress = BRIDGES.sepolia;
    bridgeName = "Sepolia";
  } else if (network.chainId === 421614) {
    bridgeAddress = BRIDGES.arbitrumSepolia;
    bridgeName = "Arbitrum Sepolia";
  } else {
    console.error("❌ Unsupported network. Use Sepolia or Arbitrum Sepolia");
    return;
  }
  
  console.log(`\nChecking ${bridgeName} bridge...`);
  console.log("Bridge address:", bridgeAddress);
  
  const bridgeBalance = await ethers.provider.getBalance(bridgeAddress);
  console.log("Current bridge ETH balance:", ethers.utils.formatEther(bridgeBalance), "ETH");
  
  if (bridgeBalance.lt(ethers.utils.parseEther("0.05"))) {
    console.log("\n⚠️  Bridge needs ETH for CCIP fees!");
    
    // Check how much we can afford to send
    const signerBalance = await signer.getBalance();
    const gasEstimate = ethers.utils.parseEther("0.005"); // Reserve for gas
    const maxSend = signerBalance.sub(gasEstimate);
    const amountToSend = maxSend.gt(ethers.utils.parseEther("0.05")) 
      ? ethers.utils.parseEther("0.05") 
      : maxSend;
    
    if (amountToSend.lte(0)) {
      console.log("❌ Insufficient ETH balance to fund bridge");
      console.log(`You need at least ${ethers.utils.formatEther(gasEstimate.add(ethers.utils.parseEther("0.01")))} ETH`);
      return;
    }
    
    console.log(`Sending ${ethers.utils.formatEther(amountToSend)} ETH to bridge...`);
    
    try {
      const tx = await signer.sendTransaction({
        to: bridgeAddress,
        value: amountToSend
      });
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log(`✅ Successfully sent ${ethers.utils.formatEther(amountToSend)} ETH to bridge!`);
      
      const newBalance = await ethers.provider.getBalance(bridgeAddress);
      console.log("New bridge balance:", ethers.utils.formatEther(newBalance), "ETH");
    } catch (error) {
      console.error("❌ Failed to send ETH:", error);
    }
  } else {
    console.log("✅ Bridge has sufficient ETH");
  }
  
  console.log("\n📝 Summary:");
  console.log("- Both bridges need ETH to pay for CCIP message fees");
  console.log("- Each bridge should have at least 0.1 ETH");
  console.log("- Fund both bridges before attempting to bridge tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });