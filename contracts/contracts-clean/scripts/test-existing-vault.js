// scripts/test-existing-vault.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Testing YieldMax Deployment...\n");

  const [user] = await ethers.getSigners();
  console.log("Testing with account:", user.address);

  // Your deployed contracts
  const VAULT_ADDRESS = "0x173a4Adc3e84BC182c614856db66d7Cb814cF019";
  const AUTOMATION_ADDRESS = "0x76cB3d20431F43C3cbe42ade8d0c246F41c78641";
  const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

  console.log("📋 Contract Addresses:");
  console.log("   Vault:", VAULT_ADDRESS);
  console.log("   Automation:", AUTOMATION_ADDRESS);
  console.log("   USDC:", USDC_ADDRESS);

  // Simple ABI for testing
  const vaultABI = [
    "function currentProtocol() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function deposit(uint256 amount) external",
    "function withdraw(uint256 amount) external",
    "event Deposit(address indexed user, uint256 amount)",
    "event Withdraw(address indexed user, uint256 amount)"
  ];

  const erc20ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];

  try {
    // Get contract instances
    const vault = await ethers.getContractAt(vaultABI, VAULT_ADDRESS);
    const usdc = await ethers.getContractAt(erc20ABI, USDC_ADDRESS);

    // Check balances
    console.log("\n💰 Checking Balances:");
    const usdcBalance = await usdc.balanceOf(user.address);
    console.log("   USDC Balance:", ethers.formatUnits(usdcBalance, 6), "USDC");
    
    const vaultBalance = await vault.balanceOf(user.address);
    console.log("   Vault Shares:", ethers.formatUnits(vaultBalance, 18), "shares");

    // Check current protocol
    console.log("\n📊 Current Strategy:");
    const protocol = await vault.currentProtocol();
    const protocols = ["None", "Aave", "Compound", "Yearn"];
    console.log("   Active Protocol:", protocols[protocol] || "Unknown");

    // Check allowance
    const allowance = await usdc.allowance(user.address, VAULT_ADDRESS);
    console.log("\n✅ USDC Allowance:", ethers.formatUnits(allowance, 6));

    console.log("\n📝 Frontend Configuration:");
    console.log("```typescript");
    console.log("export const CONTRACTS = {");
    console.log("  sepolia: {");
    console.log(`    vault: '${VAULT_ADDRESS}',`);
    console.log(`    automation: '${AUTOMATION_ADDRESS}',`);
    console.log(`    usdc: '${USDC_ADDRESS}'`);
    console.log("  }");
    console.log("};");
    console.log("```");

    console.log("\n🎯 Next Steps:");
    console.log("1. Copy the configuration above to your frontend");
    console.log("2. Make sure you have USDC (balance:", ethers.formatUnits(usdcBalance, 6), ")");
    console.log("3. Approve the vault if needed");
    console.log("4. Deposit USDC to start earning yields");
    
    console.log("\n✅ Your YieldMax system is ready to use!");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.log("\nMake sure you're connected to Sepolia network");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });