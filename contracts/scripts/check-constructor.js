// scripts/check-constructor.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("📋 Checking YieldMaxVault Constructor...\n");

  // Read the contract ABI from artifacts
  const artifactPath = path.join(__dirname, "../artifacts/contracts/YieldMaxVault.sol/YieldMaxVault.json");
  
  if (!fs.existsSync(artifactPath)) {
    console.log("❌ YieldMaxVault artifact not found!");
    console.log("Make sure you've compiled the contracts with: npx hardhat compile");
    return;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Find constructor in ABI
  const constructor = artifact.abi.find(item => item.type === "constructor");
  
  if (constructor) {
    console.log("✅ Constructor found!");
    console.log("Parameters:");
    constructor.inputs.forEach((input, index) => {
      console.log(`  ${index + 1}. ${input.name} (${input.type})`);
    });
  } else {
    console.log("❌ No constructor found in ABI");
  }

  // Also check for initialization functions
  console.log("\n📋 Checking for initialize functions:");
  const initFunctions = artifact.abi.filter(item => 
    item.type === "function" && 
    (item.name.includes("init") || item.name.includes("Init"))
  );

  if (initFunctions.length > 0) {
    initFunctions.forEach(func => {
      console.log(`\n✅ ${func.name}:`);
      func.inputs.forEach((input, index) => {
        console.log(`  ${index + 1}. ${input.name} (${input.type})`);
      });
    });
  } else {
    console.log("No initialization functions found");
  }

  // Let's also check the contract source
  console.log("\n📄 Looking for contract source...");
  const sourcePath = path.join(__dirname, "../contracts/YieldMaxVault.sol");
  
  if (fs.existsSync(sourcePath)) {
    const source = fs.readFileSync(sourcePath, "utf8");
    
    // Find constructor in source
    const constructorMatch = source.match(/constructor\s*\([^)]*\)/);
    if (constructorMatch) {
      console.log("Constructor in source:");
      console.log(constructorMatch[0]);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });