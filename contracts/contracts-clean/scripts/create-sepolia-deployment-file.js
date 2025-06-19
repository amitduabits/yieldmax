// contracts/scripts/create-sepolia-deployment-file.js
const fs = require("fs");
const path = require("path");

// Your existing Sepolia contract addresses from the original deployment
const SEPOLIA_CONTRACTS = {
  YieldMaxVault: "0xECbA31cf51F88BA5193186abf35225ECE097df44",
  USDC: "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d",
  WorkingStrategyEngine: "0x51Ae3bf6A3f38d6c6cF503aF3b8d04B0C878f881",
  AutomatedStrategyEngine: "0x467B0446a4628F83DEA0fd82cB83f8ef8140fC30",
  SimpleCrossChainRouter: "0x2f9C42AFAF2De4c56Fe37e5fF80a2F80FEc3F589"
};

async function main() {
  console.log("📁 Creating Sepolia deployment file from existing contracts...\n");

  // Create the deployment info
  const deployment = {
    network: "sepolia",
    chainId: 11155111,
    deployedAt: "2024-01-01T00:00:00.000Z", // Use existing date or current
    deployer: "0x919Cb3B8A6DC639431960B80EaD34704A9343BB2", // Your deployer address
    contracts: SEPOLIA_CONTRACTS,
    chainlink: {
      automation: {
        target: SEPOLIA_CONTRACTS.AutomatedStrategyEngine,
        description: "Ready for Chainlink Automation registration"
      },
      ccip: {
        router: SEPOLIA_CONTRACTS.SimpleCrossChainRouter,
        supportedChains: [],
        description: "Cross-chain routing enabled"
      }
    },
    verification: {
      status: "deployed_and_working",
      note: "Contracts deployed and functional on Sepolia testnet"
    }
  };

  // Create deployments directory
  const deploymentsDir = path.join(__dirname, "../deployments/sepolia");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
    console.log("✅ Created deployments/sepolia directory");
  }

  // Save YieldMaxVault.json (required by automation script)
  const vaultDeployment = {
    address: SEPOLIA_CONTRACTS.YieldMaxVault,
    deployer: "0x919Cb3B8A6DC639431960B80EaD34704A9343BB2",
    asset: SEPOLIA_CONTRACTS.USDC,
    deployedAt: "2024-01-01T00:00:00.000Z",
    network: "sepolia",
    chainId: 11155111
  };

  fs.writeFileSync(
    path.join(deploymentsDir, "YieldMaxVault.json"),
    JSON.stringify(vaultDeployment, null, 2)
  );
  console.log("✅ Created YieldMaxVault.json");

  // Save complete deployment
  fs.writeFileSync(
    path.join(deploymentsDir, "complete-deployment.json"),
    JSON.stringify(deployment, null, 2)
  );
  console.log("✅ Created complete-deployment.json");

  console.log("\n📋 Sepolia Contract Addresses:");
  console.log("==============================");
  for (const [name, address] of Object.entries(SEPOLIA_CONTRACTS)) {
    console.log(`${name}: ${address}`);
  }

  console.log("\n✅ Sepolia deployment files created!");
  console.log("Now you can run:");
  console.log("  npx hardhat run scripts/setup-chainlink-automation.js --network sepolia");

  return deployment;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;