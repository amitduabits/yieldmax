// scripts/deploy-simplified-system.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Simplified YieldMax System...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Sepolia USDC
  const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  
  console.log("📦 Starting deployment...\n");

  try {
    // 1. Deploy Simple AI Optimizer
    console.log("1. Deploying AI Optimizer...");
    const AIOptimizer = await ethers.getContractFactory("YieldMaxAIOptimizer");
    const aiOptimizer = await AIOptimizer.deploy();
    await aiOptimizer.waitForDeployment();
    const aiOptimizerAddress = await aiOptimizer.getAddress();
    console.log("✅ AI Optimizer deployed to:", aiOptimizerAddress);

    // 2. Deploy Simple Enhanced Vault
    console.log("\n2. Deploying Simple Enhanced Vault V2...");
    const SimpleVault = await ethers.getContractFactory("SimpleEnhancedVaultV2");
    const vault = await SimpleVault.deploy(
      USDC_ADDRESS,
      "YieldMax USD",
      "ymUSD"
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("✅ Vault deployed to:", vaultAddress);

    // 3. Deploy Simple Protocol Adapters
    console.log("\n3. Deploying Protocol Adapters...");
    
    // Deploy a simple mock adapter for testing
    const MockAdapter = await ethers.getContractFactory("MockProtocolAdapter");
    const mockAdapter = await MockAdapter.deploy();
    await mockAdapter.waitForDeployment();
    const mockAdapterAddress = await mockAdapter.getAddress();
    console.log("✅ Mock Adapter deployed to:", mockAdapterAddress);

    // 4. Configure System
    console.log("\n🔧 Configuring system...");
    
    // Set AI Optimizer in vault
    await vault.setAIOptimizer(aiOptimizerAddress);
    console.log("✅ AI Optimizer connected to vault");
    
    // Authorize vault in AI Optimizer
    await aiOptimizer.authorizeVault(vaultAddress, true);
    console.log("✅ Vault authorized in AI Optimizer");
    
    // Set protocol adapter
    await vault.setProtocolAdapter(mockAdapterAddress);
    console.log("✅ Protocol adapter set");

    // 5. Deploy Automation Connector for existing SimpleEnhancedVault
    console.log("\n4. Deploying Automation Connector...");
    const AutomationConnector = await ethers.getContractFactory("AutomationConnector");
    const automationConnector = await AutomationConnector.deploy(vaultAddress);
    await automationConnector.waitForDeployment();
    const automationAddress = await automationConnector.getAddress();
    console.log("✅ Automation Connector deployed to:", automationAddress);

    // Save deployment info
    const deployment = {
      network: "sepolia",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        aiOptimizer: aiOptimizerAddress,
        vault: vaultAddress,
        mockAdapter: mockAdapterAddress,
        automationConnector: automationAddress,
        usdc: USDC_ADDRESS
      }
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(deploymentsDir, "sepolia-simplified.json"),
      JSON.stringify(deployment, null, 2)
    );

    console.log("\n✅ Deployment complete!");
    console.log("\n📋 Deployed Addresses:");
    console.log("- AI Optimizer:", aiOptimizerAddress);
    console.log("- Enhanced Vault:", vaultAddress);
    console.log("- Mock Adapter:", mockAdapterAddress);
    console.log("- Automation Connector:", automationAddress);
    
    console.log("\n📝 Next Steps:");
    console.log("1. Update frontend with vault address:", vaultAddress);
    console.log("2. Update Chainlink Automation to use:", automationAddress);
    console.log("3. Test deposit/withdraw functionality");
    console.log("4. Monitor AI optimization");
    
    return deployment;

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
  }
}

// Also create the Mock Protocol Adapter contract
const mockAdapterContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockProtocolAdapter {
    mapping(address => uint256) public balances;
    
    function deposit(address asset, uint256 amount) external returns (uint256) {
        balances[asset] += amount;
        return amount;
    }
    
    function withdraw(address asset, uint256 amount) external returns (uint256) {
        balances[asset] -= amount;
        return amount;
    }
    
    function getBalance(address asset) external view returns (uint256) {
        return balances[asset];
    }
    
    function getCurrentAPY() external pure returns (uint256) {
        return 850; // 8.5% APY
    }
}
`;

// Save the mock adapter contract
const contractsDir = path.join(__dirname, "../contracts");
if (!fs.existsSync(contractsDir)) {
  fs.mkdirSync(contractsDir, { recursive: true });
}

fs.writeFileSync(
  path.join(contractsDir, "MockProtocolAdapter.sol"),
  mockAdapterContract
);

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });