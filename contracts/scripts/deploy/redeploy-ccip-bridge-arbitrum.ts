// scripts/deploy/redeploy-ccip-bridge-arbitrum.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🌉 Re-deploying CCIP Bridge to Arbitrum Sepolia with correct USDC...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()));
  
  // Read the deployment file to get the correct USDC address
  const deploymentPath = path.join(__dirname, "../../deployments/arbitrumSepolia.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const usdcAddress = deployment.contracts.usdc || "0x0D6aF2D2bcEaf53B29a12ac4331509E36D810CCf";
  
  const routerAddress = "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165"; // Arbitrum Sepolia CCIP Router
  
  console.log("\nDeployment parameters:");
  console.log("  Router:", routerAddress);
  console.log("  USDC:", usdcAddress);
  
  // Deploy CCIP Bridge
  console.log("\n📦 Deploying CCIPBridge...");
  const CCIPBridge = await ethers.getContractFactory("CCIPBridge");
  const bridge = await CCIPBridge.deploy(routerAddress, usdcAddress);
  await bridge.deployed();
  console.log("✅ CCIPBridge deployed to:", bridge.address);
  
  // Configure allowed chains
  console.log("\n⚙️ Configuring allowed chains...");
  const CHAIN_SELECTORS = {
    sepolia: "16015286601757825753",
    polygonAmoy: "16281711391670634445",
    optimismSepolia: "5224473277236331295"
  };
  
  for (const [chainName, selector] of Object.entries(CHAIN_SELECTORS)) {
    console.log(`  Allowing ${chainName} (${selector})...`);
    const tx = await bridge.allowChain(selector, true);
    await tx.wait();
  }
  console.log("✅ Chains configured");
  
  // Update deployment data
  deployment.contracts.ccipBridge = bridge.address;
  deployment.ccip = {
    router: routerAddress,
    chainSelector: "3478487238524512106", // Arbitrum Sepolia selector
    allowedChains: Object.entries(CHAIN_SELECTORS).map(([name, selector]) => ({ name, selector }))
  };
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  
  console.log("\n🎉 CCIP Bridge re-deployment complete!");
  console.log("\nNew Bridge address:", bridge.address);
  console.log("USDC address:", usdcAddress);
  
  console.log("\n📝 Next steps:");
  console.log("1. Update BridgeInterface.tsx with the new bridge address:", bridge.address);
  console.log("2. Fund the bridge with LINK tokens for CCIP fees");
  console.log("3. Test bridging from Sepolia to Arbitrum Sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });