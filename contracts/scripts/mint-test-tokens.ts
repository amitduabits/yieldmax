// contracts/scripts/mint-test-tokens.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Minting test tokens to:", signer.address);

  // Read deployment data
  const deploymentPath = path.join(__dirname, "../deployments/sepolia.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment data found. Run deploy script first.");
    return;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const usdcAddress = deployment.contracts.usdc;

  // Get USDC contract
  const usdc = await ethers.getContractAt("MockERC20", usdcAddress);
  
  // Mint 10,000 USDC
  const amount = ethers.utils.parseUnits("10000", 6);
  console.log("Minting 10,000 USDC...");
  
  const tx = await usdc.mint(signer.address, amount);
  await tx.wait();
  
  console.log("✅ Successfully minted 10,000 USDC");
  
  // Check balance
  const balance = await usdc.balanceOf(signer.address);
  console.log("Your USDC balance:", ethers.utils.formatUnits(balance, 6));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });