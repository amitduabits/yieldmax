// scripts/fund-bridges-with-link.ts
import { ethers } from "hardhat";

const BRIDGES = {
  sepolia: {
    bridge: "0x537A6FFA3c76eD8B440cF960EF1611a5Fa114ecD",
    linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789"
  },
  arbitrumSepolia: {
    bridge: "0x58Ea4Dd03339A2EBEaa9C81Ee02Abaaa4F9956ce",
    linkToken: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E"
  }
};

async function main() {
  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("🔗 Checking LINK balances for bridges...\n");
  console.log("Current network:", network.name || `Chain ID ${network.chainId}`);

  // Check based on current network
  if (network.chainId === 11155111) { // Sepolia
    console.log("\n=== SEPOLIA ===");
    const sepoliaLink = await ethers.getContractAt("IERC20", BRIDGES.sepolia.linkToken);
    const sepoliaBridgeBalance = await sepoliaLink.balanceOf(BRIDGES.sepolia.bridge);
    const sepoliaUserBalance = await sepoliaLink.balanceOf(signer.address);
    
    console.log("Bridge LINK balance:", ethers.utils.formatEther(sepoliaBridgeBalance));
    console.log("Your LINK balance:", ethers.utils.formatEther(sepoliaUserBalance));
    
    if (sepoliaBridgeBalance.lt(ethers.utils.parseEther("1"))) {
      console.log("\n⚠️  Sepolia bridge needs LINK!");
      if (sepoliaUserBalance.gte(ethers.utils.parseEther("1"))) {
        console.log("Sending 1 LINK to bridge...");
        const tx = await sepoliaLink.transfer(BRIDGES.sepolia.bridge, ethers.utils.parseEther("1"));
        await tx.wait();
        console.log("✅ Sent 1 LINK to Sepolia bridge");
      } else {
        console.log("❌ You don't have enough LINK. Get some from: https://faucets.chain.link/sepolia");
      }
    } else {
      console.log("✅ Sepolia bridge has sufficient LINK");
    }
  } else if (network.chainId === 421614) { // Arbitrum Sepolia
    console.log("\n=== ARBITRUM SEPOLIA ===");
    const arbitrumLink = await ethers.getContractAt("IERC20", BRIDGES.arbitrumSepolia.linkToken);
    const arbitrumBridgeBalance = await arbitrumLink.balanceOf(BRIDGES.arbitrumSepolia.bridge);
    const arbitrumUserBalance = await arbitrumLink.balanceOf(signer.address);
    
    console.log("Bridge LINK balance:", ethers.utils.formatEther(arbitrumBridgeBalance));
    console.log("Your LINK balance:", ethers.utils.formatEther(arbitrumUserBalance));
    
    if (arbitrumBridgeBalance.lt(ethers.utils.parseEther("1"))) {
      console.log("\n⚠️  Arbitrum bridge needs LINK!");
      if (arbitrumUserBalance.gte(ethers.utils.parseEther("1"))) {
        console.log("Sending 1 LINK to bridge...");
        const tx = await arbitrumLink.transfer(BRIDGES.arbitrumSepolia.bridge, ethers.utils.parseEther("1"));
        await tx.wait();
        console.log("✅ Sent 1 LINK to Arbitrum bridge");
      } else {
        console.log("❌ You don't have enough LINK. Get some from: https://faucets.chain.link/arbitrum-sepolia");
      }
    } else {
      console.log("✅ Arbitrum bridge has sufficient LINK");
    }
  } else {
    console.log("❌ Unsupported network. Please use Sepolia or Arbitrum Sepolia");
  }

  console.log("\n📝 Bridge addresses for manual funding:");
  console.log("Sepolia Bridge:", BRIDGES.sepolia.bridge);
  console.log("Arbitrum Bridge:", BRIDGES.arbitrumSepolia.bridge);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });