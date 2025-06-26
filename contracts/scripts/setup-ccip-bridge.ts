// scripts/setup-ccip-bridge.ts
import { ethers } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

// Chain selectors from Chainlink CCIP
const CHAIN_SELECTORS = {
  sepolia: "16015286601757825753",
  arbitrumSepolia: "3478487238524512106"
};

// Contract addresses
const ADDRESSES = {
  sepolia: {
    crossChainManager: "0xC033b4Eea791ba83C0FcDAC8cD67c563B5b98eC3",
    vault: "0xc2A4d1a2F1200680F1024d7310e3e84DeE3E5777",
    linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789"
  },
  arbitrumSepolia: {
    crossChainManager: "0x0110f1f9f69539B14D7d38A5fc1Ec5D9B5850dF6",
    vault: "0x10d2ECF290f56BdBF6B8e014c426c17299b4E3B2",
    linkToken: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E"
  }
};

async function main() {
  console.log("🔧 Setting up CCIP Bridge Configuration...\n");

  // Get signers for both networks
  const sepoliaProvider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const arbitrumProvider = new ethers.providers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
  
  const sepoliaSigner = new ethers.Wallet(process.env.PRIVATE_KEY!, sepoliaProvider);
  const arbitrumSigner = new ethers.Wallet(process.env.PRIVATE_KEY!, arbitrumProvider);

  console.log("Configuring with account:", sepoliaSigner.address);

  // Step 1: Configure Sepolia CrossChainManager to recognize Arbitrum
  console.log("\n📡 Configuring Sepolia -> Arbitrum connection...");
  const sepoliaCCM = await ethers.getContractAt(
    "CrossChainManager",
    ADDRESSES.sepolia.crossChainManager,
    sepoliaSigner
  );

  try {
    const tx1 = await sepoliaCCM.configureChain(
      CHAIN_SELECTORS.arbitrumSepolia,
      ADDRESSES.arbitrumSepolia.vault
    );
    await tx1.wait();
    console.log("✅ Sepolia configured to send to Arbitrum");
  } catch (error) {
    console.error("❌ Failed to configure Sepolia:", error);
  }

  // Step 2: Configure Arbitrum CrossChainManager to recognize Sepolia
  console.log("\n📡 Configuring Arbitrum -> Sepolia connection...");
  const arbitrumCCM = await ethers.getContractAt(
    "CrossChainManager",
    ADDRESSES.arbitrumSepolia.crossChainManager,
    arbitrumSigner
  );

  try {
    const tx2 = await arbitrumCCM.configureChain(
      CHAIN_SELECTORS.sepolia,
      ADDRESSES.sepolia.vault
    );
    await tx2.wait();
    console.log("✅ Arbitrum configured to send to Sepolia");
  } catch (error) {
    console.error("❌ Failed to configure Arbitrum:", error);
  }

  // Step 3: Check LINK balances and fund if needed
  console.log("\n💰 Checking LINK token balances...");
  
  const sepoliaLink = await ethers.getContractAt(
    "IERC20",
    ADDRESSES.sepolia.linkToken,
    sepoliaSigner
  );
  
  const arbitrumLink = await ethers.getContractAt(
    "IERC20",
    ADDRESSES.arbitrumSepolia.linkToken,
    arbitrumSigner
  );

  const sepoliaLinkBalance = await sepoliaLink.balanceOf(ADDRESSES.sepolia.crossChainManager);
  const arbitrumLinkBalance = await arbitrumLink.balanceOf(ADDRESSES.arbitrumSepolia.crossChainManager);

  console.log("Sepolia CCM LINK balance:", ethers.utils.formatEther(sepoliaLinkBalance));
  console.log("Arbitrum CCM LINK balance:", ethers.utils.formatEther(arbitrumLinkBalance));

  // Fund with LINK if balance is low (you need to have LINK tokens first)
  const MIN_LINK_BALANCE = ethers.utils.parseEther("0.1"); // 0.1 LINK minimum

  if (sepoliaLinkBalance.lt(MIN_LINK_BALANCE)) {
    console.log("\n⚠️  Sepolia CCM needs LINK tokens!");
    console.log("Please fund the contract with LINK tokens at:", ADDRESSES.sepolia.crossChainManager);
    console.log("You can get testnet LINK from: https://faucets.chain.link/sepolia");
  }

  if (arbitrumLinkBalance.lt(MIN_LINK_BALANCE)) {
    console.log("\n⚠️  Arbitrum CCM needs LINK tokens!");
    console.log("Please fund the contract with LINK tokens at:", ADDRESSES.arbitrumSepolia.crossChainManager);
    console.log("You can get testnet LINK from: https://faucets.chain.link/arbitrum-sepolia");
  }

  // Step 4: Verify configuration
  console.log("\n🔍 Verifying configuration...");
  
  const isSepoliaToArbitrumSupported = await sepoliaCCM.supportedChains(CHAIN_SELECTORS.arbitrumSepolia);
  const isArbitrumToSepoliaSupported = await arbitrumCCM.supportedChains(CHAIN_SELECTORS.sepolia);
  
  const sepoliaRemoteVault = await sepoliaCCM.remoteVaults(CHAIN_SELECTORS.arbitrumSepolia);
  const arbitrumRemoteVault = await arbitrumCCM.remoteVaults(CHAIN_SELECTORS.sepolia);

  console.log("\nConfiguration Status:");
  console.log("Sepolia -> Arbitrum supported:", isSepoliaToArbitrumSupported);
  console.log("Arbitrum -> Sepolia supported:", isArbitrumToSepoliaSupported);
  console.log("Sepolia remote vault:", sepoliaRemoteVault);
  console.log("Arbitrum remote vault:", arbitrumRemoteVault);

  if (isSepoliaToArbitrumSupported && isArbitrumToSepoliaSupported) {
    console.log("\n✅ CCIP Bridge configuration complete!");
    console.log("\n⚠️  Important: Make sure both CrossChainManager contracts have LINK tokens before bridging!");
  } else {
    console.log("\n❌ Configuration incomplete. Please check the errors above.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });