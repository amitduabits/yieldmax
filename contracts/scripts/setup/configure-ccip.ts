// scripts/setup/configure-ccip.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Configuring CCIP on:", network.name);
  console.log("Using account:", signer.address);

  // Map network names to file names
  const networkFileMap: { [key: number]: string } = {
    11155111: "sepolia",
    421614: "arbitrumSepolia"
  };

  const deploymentFileName = networkFileMap[network.chainId];
  if (!deploymentFileName) {
    throw new Error(`Unsupported network: ${network.name} (${network.chainId})`);
  }

  // Read deployment data
  const deploymentPath = path.join(__dirname, `../../deployments/${deploymentFileName}.json`);
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  const crossChainManager = await ethers.getContractAt(
    "CrossChainManager",
    deployment.contracts.crossChainManager
  );

  // Configure remote chains
  if (network.chainId === 11155111) { // Sepolia
    // Configure Arbitrum Sepolia
    const arbitrumDeployment = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../../deployments/arbitrumSepolia.json"), "utf8")
    );
    
    await crossChainManager.configureChain(
      "3478487238524512106", // Arbitrum Sepolia chain selector
      arbitrumDeployment.contracts.vault
    );
    console.log("✅ Configured Arbitrum Sepolia as destination");
    
  } else if (network.chainId === 421614) { // Arbitrum Sepolia
    // Configure Sepolia
    const sepoliaDeployment = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../../deployments/sepolia.json"), "utf8")
    );
    
    await crossChainManager.configureChain(
      "16015286601757825753", // Sepolia chain selector
      sepoliaDeployment.contracts.vault
    );
    console.log("✅ Configured Sepolia as destination");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });