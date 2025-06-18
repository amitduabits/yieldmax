// test-contracts.js
const { ethers } = require("ethers");
require("dotenv").config();

async function testContracts() {
  const provider = new ethers.providers.JsonRpcProvider("https://rpc.sepolia.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Test USDC
  const USDC = new ethers.Contract(
    "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d",
    ["function balanceOf(address) view returns (uint256)"],
    wallet
  );
  
  const balance = await USDC.balanceOf(wallet.address);
  console.log("USDC Balance:", ethers.utils.formatUnits(balance, 6));
  
  // Test Vault
  const Vault = new ethers.Contract(
    "0xECbA31cf51F88BA5193186abf35225ECE097df44",
    ["function totalAssets() view returns (uint256)"],
    wallet
  );
  
  const totalAssets = await Vault.totalAssets();
  console.log("Vault Total Assets:", ethers.utils.formatUnits(totalAssets, 6));
}

testContracts();