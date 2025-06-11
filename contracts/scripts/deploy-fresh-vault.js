// scripts/deploy-fresh-vault.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Fresh YieldMax Vault...\n");

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

  // Deploy YieldMaxVault
  console.log("\n📄 Deploying YieldMaxVault...");
  const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault");
  
  const vault = await YieldMaxVault.deploy(
    USDC_ADDRESS,
    "YieldMax USDC Vault",
    "ymUSDC",
    deployer.address // keeper address
  );

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log("✅ YieldMaxVault deployed to:", vaultAddress);

  // Verify the deployment
  console.log("\n🔍 Verifying deployment...");
  const asset = await vault.asset();
  const owner = await vault.owner();
  const keeper = await vault.keeper();
  
  console.log("Asset:", asset);
  console.log("Owner:", owner);
  console.log("Keeper:", keeper);

  // Save deployment info
  const deploymentInfo = {
    address: vaultAddress,
    deployer: deployer.address,
    asset: USDC_ADDRESS,
    deployedAt: new Date().toISOString(),
    network: networkName,
    chainId: chainId
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
  console.log("\nNext steps:");
  console.log("1. Update your frontend config with the new vault address:", vaultAddress);
  console.log("2. Verify the contract on Etherscan");
  console.log("3. Test with a small deposit");

  return vaultAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });