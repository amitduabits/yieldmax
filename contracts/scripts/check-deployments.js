// scripts/check-deployments.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("📋 Checking YieldMax Deployments...\n");

  const [signer] = await ethers.getSigners();
  console.log("Your address:", signer.address);

  // Check for deployment files
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  console.log("\n📁 Looking for deployment files...");
  
  try {
    const networks = ["sepolia", "arbitrumSepolia"];
    
    for (const network of networks) {
      const networkDir = path.join(deploymentsDir, network);
      console.log(`\n🌐 ${network}:`);
      
      if (fs.existsSync(networkDir)) {
        const files = fs.readdirSync(networkDir);
        
        files.forEach(file => {
          if (file.endsWith(".json")) {
            const filePath = path.join(networkDir, file);
            const deployment = JSON.parse(fs.readFileSync(filePath, "utf8"));
            console.log(`  ${file.replace(".json", "")}:`, deployment.address);
          }
        });
      } else {
        console.log("  No deployments found");
      }
    }
  } catch (error) {
    console.log("Error reading deployment files:", error.message);
  }

  // Check if we have any contract addresses in our records
  console.log("\n🔍 Checking known addresses on current network...");
  
  const knownAddresses = {
    sepolia: {
      vault: "0x7043148386eD44Df90905a3f1379C1E36eF9c49E",
      usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
    },
    arbitrumSepolia: {
      vault: "0x7043148386eD44Df90905a3f1379C1E36eF9c49E",
      usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
    }
  };

  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  console.log("Current network chain ID:", chainId);

  const networkName = chainId === "11155111" ? "sepolia" : chainId === "421614" ? "arbitrumSepolia" : "unknown";
  
  if (networkName !== "unknown" && knownAddresses[networkName]) {
    console.log("\nChecking contracts on", networkName);
    
    for (const [name, address] of Object.entries(knownAddresses[networkName])) {
      const code = await ethers.provider.getCode(address);
      console.log(`${name} at ${address}:`, code !== "0x" ? "✅ Deployed" : "❌ Not found");
    }
  }

  // Check recent transactions from your address
  console.log("\n📜 Recent transactions from your address:");
  const latestBlock = await ethers.provider.getBlockNumber();
  let foundTx = 0;
  
  for (let i = 0; i < 100 && foundTx < 5; i++) {
    try {
      const block = await ethers.provider.getBlock(latestBlock - i, true);
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (tx.from.toLowerCase() === signer.address.toLowerCase()) {
            console.log(`  Block ${block.number}: ${tx.hash.substring(0, 10)}... to ${tx.to || "Contract Creation"}`);
            foundTx++;
          }
        }
      }
    } catch (e) {
      // Skip errors
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });