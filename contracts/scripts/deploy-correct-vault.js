// scripts/deploy-correct-vault.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying YieldMax Vault with Correct Parameters...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Network specific addresses
  const USDC_ADDRESSES = {
    sepolia: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    arbitrumSepolia: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
  };

  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  const networkName = chainId === "11155111" ? "sepolia" : chainId === "421614" ? "arbitrumSepolia" : "unknown";

  if (!USDC_ADDRESSES[networkName]) {
    throw new Error(`Unknown network: ${networkName}`);
  }

  const USDC_ADDRESS = USDC_ADDRESSES[networkName];
  console.log("\nUsing USDC address:", USDC_ADDRESS);

  // Deploy YieldMaxVault with ONLY the asset parameter
  console.log("\n📄 Deploying YieldMaxVault...");
  const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault");
  
  // Constructor only takes _asset parameter
  const vault = await YieldMaxVault.deploy(USDC_ADDRESS);

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log("✅ YieldMaxVault deployed to:", vaultAddress);

  // Wait for a few blocks
  console.log("\n⏳ Waiting for confirmation...");
  await vault.deploymentTransaction().wait(3);

  // Verify the deployment
  console.log("\n🔍 Verifying deployment...");
  
  try {
    const owner = await vault.owner();
    console.log("Owner:", owner);
    
    const asset = await vault.asset();
    console.log("Asset:", asset);
    console.log("Asset correct:", asset.toLowerCase() === USDC_ADDRESS.toLowerCase());
    
    const name = await vault.name();
    console.log("Name:", name);
    
    const symbol = await vault.symbol();
    console.log("Symbol:", symbol);
    
    const totalAssets = await vault.totalAssets();
    console.log("Total Assets:", totalAssets.toString());
    
    const totalSupply = await vault.totalSupply();
    console.log("Total Supply:", totalSupply.toString());
    
    // If your contract has keeper, set it after deployment
    if (vault.setKeeper) {
      console.log("\n🔑 Setting keeper...");
      const tx = await vault.setKeeper(deployer.address);
      await tx.wait();
      console.log("Keeper set to:", deployer.address);
    }
    
  } catch (error) {
    console.error("Verification error:", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    address: vaultAddress,
    deployer: deployer.address,
    asset: USDC_ADDRESS,
    deployedAt: new Date().toISOString(),
    network: networkName,
    chainId: chainId,
    txHash: vault.deploymentTransaction().hash
  };

  const deploymentsDir = path.join(__dirname, `../deployments/${networkName}`);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "YieldMaxVault.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📝 Deployment info saved!");
  console.log("\n🎉 Deployment complete!");
  console.log("\n⚡ IMPORTANT: Update your frontend config:");
  console.log(`   In frontend/src/config/contracts.ts:`);
  console.log(`   ${networkName}: {`);
  console.log(`     vault: '${vaultAddress}',`);
  console.log(`     usdc: '${USDC_ADDRESS}'`);
  console.log(`   }`);

  return vaultAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });