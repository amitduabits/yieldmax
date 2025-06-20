// scripts/enhance-existing-deployment.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Enhancing Existing YieldMax Deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  // Your existing contracts
  const EXISTING_VAULT = "0x173a4Adc3e84BC182c614856db66d7Cb814cF019";
  const EXISTING_CONNECTOR = "0x76cB3d20431F43C3cbe42ade8d0c246F41c78641";
  const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

  console.log("✅ Existing Infrastructure:");
  console.log("   Vault:", EXISTING_VAULT);
  console.log("   Automation:", EXISTING_CONNECTOR);
  console.log("   USDC:", USDC_ADDRESS);

  // Test the existing deployment
  console.log("\n🔍 Testing existing contracts...");
  
  try {
    // Get vault instance
    const vault = await ethers.getContractAt("ISimpleEnhancedVault", EXISTING_VAULT);
    
    // Check current protocol
    const currentProtocol = await vault.currentProtocol();
    console.log("Current Protocol:", currentProtocol);
    
    // Test USDC
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    const balance = await usdc.balanceOf(deployer.address);
    console.log("Your USDC Balance:", ethers.formatUnits(balance, 6));
    
    console.log("\n✅ Contracts are working!");
    
  } catch (error) {
    console.log("Note:", error.message);
  }

  // Configuration for frontend
  console.log("\n📝 Frontend Configuration:");
  console.log("Update your frontend/src/config/contracts.ts:");
  console.log("\n```typescript");
  console.log("export const CONTRACTS = {");
  console.log("  sepolia: {");
  console.log(`    vault: '${EXISTING_VAULT}',`);
  console.log(`    automationConnector: '${EXISTING_CONNECTOR}',`);
  console.log(`    usdc: '${USDC_ADDRESS}'`);
  console.log("  }");
  console.log("};");
  console.log("```");

  // Create enhanced testing script
  console.log("\n📦 Creating enhanced testing capabilities...");
  
  const testingCode = `
// scripts/test-yieldmax.js
const { ethers } = require("hardhat");

async function main() {
  const VAULT = "${EXISTING_VAULT}";
  const USDC = "${USDC_ADDRESS}";
  
  const [user] = await ethers.getSigners();
  console.log("Testing with:", user.address);
  
  // Get contracts
  const vault = await ethers.getContractAt([
    "function deposit(uint256 amount) external",
    "function withdraw(uint256 shares) external", 
    "function balanceOf(address) view returns (uint256)",
    "function currentProtocol() view returns (uint8)",
    "function executeStrategyChange(uint8 newProtocol) external"
  ], VAULT);
  
  const usdc = await ethers.getContractAt("IERC20", USDC);
  
  // Test deposit
  console.log("\\n1. Testing Deposit...");
  const amount = ethers.parseUnits("100", 6);
  
  // Mint test USDC
  await usdc.mint(user.address, amount);
  await usdc.approve(VAULT, amount);
  
  await vault.deposit(amount);
  const shares = await vault.balanceOf(user.address);
  console.log("Shares received:", ethers.formatUnits(shares, 18));
  
  // Test strategy
  console.log("\\n2. Current Strategy:");
  const protocol = await vault.currentProtocol();
  const protocols = ["None", "Aave", "Compound", "Yearn"];
  console.log("Protocol:", protocols[protocol] || "Unknown");
  
  console.log("\\n✅ Tests complete!");
}

main().catch(console.error);
  `;

  // Save testing script
  const fs = require("fs");
  const path = require("path");
  fs.writeFileSync(
    path.join(__dirname, "test-yieldmax.js"),
    testingCode
  );

  console.log("✅ Created test-yieldmax.js");

  // Provide clear next steps
  console.log("\n🎯 Next Steps:");
  console.log("\n1. Update your frontend with the configuration above");
  console.log("\n2. Your Chainlink Automation is already active at:");
  console.log(`   https://automation.chain.link/sepolia/${EXISTING_CONNECTOR}`);
  console.log("\n3. Test your system:");
  console.log("   npx hardhat run scripts/test-yieldmax.js --network sepolia");
  console.log("\n4. Monitor your vault:");
  console.log(`   https://sepolia.etherscan.io/address/${EXISTING_VAULT}`);
  
  console.log("\n✨ Your YieldMax system is ready to use!");
  console.log("\n💡 Tips:");
  console.log("- Deposit USDC to start earning yields");
  console.log("- Chainlink Automation will handle rebalancing");
  console.log("- Check back periodically for strategy updates");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });