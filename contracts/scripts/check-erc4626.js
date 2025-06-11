// scripts/check-erc4626.js
const { ethers } = require("hardhat");

async function main() {
  const VAULT_ADDRESS = "0xBbAa35cC5EEBE2D4B8eA473CA2B7A49629469C3C";
  
  console.log("🔍 Checking ERC4626 Support for:", VAULT_ADDRESS);
  
  // Minimal ERC4626 ABI
  const erc4626ABI = [
    // ERC4626 Core
    "function asset() view returns (address)",
    "function totalAssets() view returns (uint256)",
    "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
    "function redeem(uint256 shares, address receiver, address owner) returns (uint256 assets)",
    "function maxDeposit(address) view returns (uint256)",
    "function previewDeposit(uint256 assets) view returns (uint256)",
    "function maxRedeem(address owner) view returns (uint256)",
    "function previewRedeem(uint256 shares) view returns (uint256)",
    // ERC20
    "function balanceOf(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    // Metadata (optional)
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
  ];
  
  const [signer] = await ethers.getSigners();
  const vault = new ethers.Contract(VAULT_ADDRESS, erc4626ABI, signer);
  
  console.log("\n📋 ERC4626 Core Functions:");
  
  // Test each function
  const tests = [
    { name: "asset", func: () => vault.asset() },
    { name: "totalAssets", func: () => vault.totalAssets() },
    { name: "totalSupply", func: () => vault.totalSupply() },
    { name: "balanceOf", func: () => vault.balanceOf(signer.address) },
    { name: "maxDeposit", func: () => vault.maxDeposit(signer.address) },
    { name: "previewDeposit", func: () => vault.previewDeposit(ethers.parseUnits("1", 6)) },
    { name: "maxRedeem", func: () => vault.maxRedeem(signer.address) },
    { name: "previewRedeem", func: () => vault.previewRedeem(ethers.parseUnits("1", 6)) },
  ];
  
  for (const test of tests) {
    try {
      const result = await test.func();
      console.log(`✅ ${test.name}:`, result.toString());
    } catch (e) {
      console.log(`❌ ${test.name}: ${e.reason || "Failed"}`);
    }
  }
  
  console.log("\n📋 Metadata (Optional):");
  const metadataTests = [
    { name: "name", func: () => vault.name() },
    { name: "symbol", func: () => vault.symbol() },
    { name: "decimals", func: () => vault.decimals() }
  ];
  
  for (const test of metadataTests) {
    try {
      const result = await test.func();
      console.log(`✅ ${test.name}:`, result.toString());
    } catch (e) {
      console.log(`❌ ${test.name}: Not implemented`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });