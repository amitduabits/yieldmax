// scripts/deploy/deploy-ccip-bridge.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// CCIP Router addresses
const ROUTERS = {
  sepolia: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  "arbitrum-sepolia": "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
  arbitrumSepolia: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
  "polygon-amoy": "0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2",
  polygonAmoy: "0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2",
  "optimism-sepolia": "0x114A20A10b43D4115e5aeef7345a1A71d2a60C57",
  optimismSepolia: "0x114A20A10b43D4115e5aeef7345a1A71d2a60C57"
};

// Chain selectors for CCIP
const CHAIN_SELECTORS = {
  sepolia: "16015286601757825753",
  "arbitrum-sepolia": "3478487238524512106",
  arbitrumSepolia: "3478487238524512106",
  "polygon-amoy": "16281711391670634445",
  polygonAmoy: "16281711391670634445",
  "optimism-sepolia": "5224473277236331295",
  optimismSepolia: "5224473277236331295"
};

// Network name mapping for deployment files
const DEPLOYMENT_NAMES = {
  sepolia: "sepolia",
  "arbitrum-sepolia": "arbitrumSepolia",
  arbitrumSepolia: "arbitrumSepolia",
  "polygon-amoy": "polygonAmoy", 
  polygonAmoy: "polygonAmoy",
  "optimism-sepolia": "optimismSepolia",
  optimismSepolia: "optimismSepolia"
};

async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "sepolia" : network.name;
  const deploymentName = DEPLOYMENT_NAMES[networkName as keyof typeof DEPLOYMENT_NAMES] || networkName;
  
  console.log(`\n🌉 Deploying CCIP Bridge to ${networkName}...`);
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()));
  
  // Get router address for current network
  const routerAddress = ROUTERS[networkName as keyof typeof ROUTERS];
  if (!routerAddress) {
    console.error(`Available networks: ${Object.keys(ROUTERS).join(", ")}`);
    throw new Error(`No router address for network ${networkName}`);
  }
  
  // Get USDC address from deployment data
  const deploymentPath = path.join(__dirname, `../../deployments/${deploymentName}.json`);
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`No deployment data found for ${deploymentName}. Deploy main contracts first.`);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const usdcAddress = deployment.contracts.usdc;
  
  console.log("\nDeployment parameters:");
  console.log("  Network:", networkName);
  console.log("  Deployment file:", deploymentName);
  console.log("  Router:", routerAddress);
  console.log("  USDC:", usdcAddress);
  
  // Deploy CCIP Bridge
  console.log("\n📦 Deploying CCIPBridge...");
  const CCIPBridge = await ethers.getContractFactory("CCIPBridge");
  const bridge = await CCIPBridge.deploy(routerAddress, usdcAddress);
  await bridge.deployed();
  console.log("✅ CCIPBridge deployed to:", bridge.address);
  
  // Configure allowed chains (exclude current network)
  console.log("\n⚙️ Configuring allowed chains...");
  const currentChainSelector = CHAIN_SELECTORS[networkName as keyof typeof CHAIN_SELECTORS];
  const chainsToAllow = Object.entries(CHAIN_SELECTORS)
    .filter(([name, selector]) => selector !== currentChainSelector);
  
  for (const [chainName, selector] of chainsToAllow) {
    console.log(`  Allowing ${chainName} (${selector})...`);
    const tx = await bridge.allowChain(selector, true);
    await tx.wait();
  }
  console.log("✅ Chains configured");
  
  // Update deployment data
  deployment.contracts.ccipBridge = bridge.address;
  deployment.ccip = {
    router: routerAddress,
    chainSelector: currentChainSelector,
    allowedChains: chainsToAllow.map(([name, selector]) => ({ name, selector }))
  };
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  
  console.log("\n🎉 CCIP Bridge deployment complete!");
  console.log("\nBridge address:", bridge.address);
  console.log("\nTo bridge tokens:");
  console.log("1. Approve USDC spending by the bridge contract");
  console.log("2. Call bridgeTokens() with destination chain selector and amount");
  console.log("\nAllowed destination chains:");
  chainsToAllow.forEach(([name, selector]) => {
    console.log(`  - ${name}: ${selector}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });