// scripts/deploy.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 Deploying YieldMax to", hre.network.name, "\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance < hre.ethers.parseEther("0.01")) {
    console.error("⚠️  Low balance! You need at least 0.01 ETH for deployment");
  }
  
  // USDC addresses
  const USDC_ADDRESSES = {
    sepolia: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    arbitrumSepolia: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    hardhat: hre.ethers.ZeroAddress
  };
  
  const usdcAddress = USDC_ADDRESSES[hre.network.name] || USDC_ADDRESSES.sepolia;
  console.log("USDC Address:", usdcAddress);
  
  // Deploy YieldMaxVault
  console.log("\nDeploying YieldMaxVault...");
  const YieldMaxVault = await hre.ethers.getContractFactory("YieldMaxVault");
  const vault = await YieldMaxVault.deploy(usdcAddress);
  await vault.waitForDeployment();
  
  const vaultAddress = await vault.getAddress();
  console.log("✅ YieldMaxVault deployed to:", vaultAddress);
  
  // Verify deployment
  console.log("\nVerifying deployment...");
  const assetAddress = await vault.asset();
  const owner = await vault.owner();
  const keeper = await vault.keeper();
  
  console.log("Vault Configuration:");
  console.log("- Asset (USDC):", assetAddress);
  console.log("- Owner:", owner);
  console.log("- Keeper:", keeper);
  console.log("- Total Assets:", await vault.totalAssets());
  console.log("- Total Shares:", await vault.totalShares());
  
  // Save deployment
  const deployment = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contracts: {
      YieldMaxVault: vaultAddress
    },
    configuration: {
      usdc: usdcAddress,
      deployer: deployer.address,
      owner: owner,
      keeper: keeper
    },
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };
  
  // Save deployment file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentPath = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\n📁 Deployment saved to:", deploymentPath);
  
  // Explorer link
  const explorerUrl = getExplorerUrl(hre.network.name, vaultAddress);
  console.log("\n🔍 View on Explorer:", explorerUrl);
  
  // Instructions
  console.log("\n📋 Next Steps:");
  console.log("1. Get test USDC from: https://app.aave.com/faucet/");
  console.log("2. Update frontend with contract address:", vaultAddress);
  console.log("3. Verify contract on Etherscan (optional)");
  console.log("\n✅ Deployment Complete!");
  
  return deployment;
}

function getExplorerUrl(network, address) {
  const explorers = {
    sepolia: `https://sepolia.etherscan.io/address/${address}`,
    arbitrumSepolia: `https://sepolia.arbiscan.io/address/${address}`,
    hardhat: `http://localhost:8545/address/${address}`
  };
  return explorers[network] || address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });