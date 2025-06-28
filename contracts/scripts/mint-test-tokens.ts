// contracts/scripts/mint-test-tokens.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("Minting test tokens to:", signer.address);

  // Determine the deployment file based on network
  let deploymentFileName: string;
  switch (network.chainId) {
    case 11155111: // Sepolia
      deploymentFileName = "sepolia.json";
      break;
    case 421614: // Arbitrum Sepolia
      deploymentFileName = "arbitrumSepolia.json";
      break;
    default:
      console.error("❌ Unsupported network. Chain ID:", network.chainId);
      return;
  }

  // Read deployment data
  const deploymentPath = path.join(__dirname, `../deployments/${deploymentFileName}`);
  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ No deployment data found for ${network.name}. Run deploy script first.`);
    console.error(`Expected file: ${deploymentPath}`);
    return;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const usdcAddress = deployment.contracts.usdc;

  console.log("Using USDC at:", usdcAddress);

  try {
    // Get USDC contract
    const usdc = await ethers.getContractAt("MockERC20", usdcAddress);
    
    // Check if contract exists
    const code = await ethers.provider.getCode(usdcAddress);
    if (code === "0x") {
      console.error("❌ No contract found at USDC address. Deploy contracts first.");
      return;
    }
    
    // Mint 10,000 USDC
    const amount = ethers.utils.parseUnits("10000", 6);
    console.log("Minting 10,000 USDC...");
    
    const tx = await usdc.mint(signer.address, amount);
    await tx.wait();
    
    console.log("✅ Successfully minted 10,000 USDC");
    
    // Check balance
    const balance = await usdc.balanceOf(signer.address);
    console.log("Your USDC balance:", ethers.utils.formatUnits(balance, 6));
    
  } catch (error: any) {
    if (error.code === 'CALL_EXCEPTION') {
      console.error("❌ Contract call failed. This usually means:");
      console.error("   - The contract is not deployed at this address");
      console.error("   - The contract doesn't have the expected methods");
      console.error("   - You need to deploy contracts on this network first");
      console.error("\nRun: npx hardhat run scripts/deploy/deploy-arbitrum.ts --network arbitrumSepolia");
    } else {
      console.error("❌ Error:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });