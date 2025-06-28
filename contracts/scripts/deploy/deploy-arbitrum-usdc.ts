// scripts/deploy/deploy-arbitrum-usdc.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying Mock USDC to Arbitrum Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  // Deploy Mock USDC
  console.log("\n📦 Deploying Mock USDC...");
  
  // First, create the MockERC20 contract if it doesn't exist
  const mockERC20Code = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}`;

  // Write the contract file
  const contractsDir = path.join(__dirname, "../../contracts/test");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  const contractPath = path.join(contractsDir, "MockERC20.sol");
  if (!fs.existsSync(contractPath)) {
    fs.writeFileSync(contractPath, mockERC20Code);
    console.log("✅ Created MockERC20.sol");
  }

  // Compile if needed
  await hre.run("compile");
  
  // Deploy MockERC20
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.deployed();
  
  console.log("✅ Mock USDC deployed to:", usdc.address);
  
  // Mint some USDC to the deployer
  const mintAmount = ethers.utils.parseUnits("100000", 6); // 100k USDC
  await usdc.mint(deployer.address, mintAmount);
  console.log("✅ Minted 100,000 USDC to deployer");
  
  // Update the CCIPBridge to use this USDC
  console.log("\n📝 CCIPBridge should be updated to use this USDC address:", usdc.address);
  console.log("CCIPBridge address on Arbitrum Sepolia: 0xEcf699e13E8AfdBce8A68E01F7686E1b680C624e");
  
  // Save deployment info
  const deploymentPath = path.join(__dirname, "../../deployments/arbitrumSepolia.json");
  let deployment: any = {};
  
  if (fs.existsSync(deploymentPath)) {
    deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  }
  
  deployment.contracts = deployment.contracts || {};
  deployment.contracts.usdc = usdc.address;
  deployment.contracts.mockUsdc = usdc.address;
  deployment.network = "arbitrumSepolia";
  deployment.chainId = 421614;
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\n✅ Deployment info saved to:", deploymentPath);
  
  console.log("\n🎯 Next steps:");
  console.log("1. Update the frontend BridgeInterface.tsx with this USDC address:", usdc.address);
  console.log("2. The CCIPBridge contract at 0xEcf699e13E8AfdBce8A68E01F7686E1b680C624e");
  console.log("   needs to be configured to use this USDC address");
  console.log("3. Or deploy a new CCIPBridge with the correct USDC address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });