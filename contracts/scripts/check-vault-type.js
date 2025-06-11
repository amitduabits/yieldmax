// scripts/check-vault-type.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Vault Contract Type...\n");

  const VAULT_ADDRESS = "0x7043148386eD44Df90905a3f1379C1E36eF9c49E";
  
  // Try different possible function signatures
  const possibleABIs = {
    "ERC20 Basic": [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
    ],
    "Basic Vault": [
      "function asset() view returns (address)",
      "function totalAssets() view returns (uint256)",
    ],
    "Access Control": [
      "function owner() view returns (address)",
      "function keeper() view returns (address)",
    ],
    "YieldMax Specific": [
      "function getYieldEarnedPerShare() view returns (uint256)",
      "function lastHarvest() view returns (uint256)",
    ],
    "Constructor Test": [
      "function USDC() view returns (address)", // Maybe USDC is stored differently
      "function underlying() view returns (address)", // Alternative name
      "function token() view returns (address)", // Another alternative
    ]
  };

  const [signer] = await ethers.getSigners();

  console.log("Testing different function signatures:\n");

  for (const [category, abi] of Object.entries(possibleABIs)) {
    console.log(`📋 ${category}:`);
    const contract = new ethers.Contract(VAULT_ADDRESS, abi, signer);
    
    for (const func of abi) {
      const funcName = func.split(" ")[1].split("(")[0];
      try {
        const result = await contract[funcName]();
        console.log(`  ✅ ${funcName}():`, result.toString());
      } catch (e) {
        console.log(`  ❌ ${funcName}(): ${e.reason || "reverted"}`);
      }
    }
    console.log("");
  }

  // Let's also check the bytecode to see if it matches our YieldMaxVault
  console.log("📊 Checking if bytecode matches YieldMaxVault...");
  
  try {
    const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault");
    const deployedBytecode = await ethers.provider.getCode(VAULT_ADDRESS);
    
    // Get the expected bytecode (note: constructor args will make it different)
    console.log("Deployed bytecode length:", deployedBytecode.length);
    console.log("Deployed bytecode start:", deployedBytecode.substring(0, 20));
    
    // Check if it's just a basic contract
    if (deployedBytecode.length < 1000) {
      console.log("⚠️  Contract bytecode is suspiciously short!");
    }
  } catch (e) {
    console.log("Could not compare bytecode:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });