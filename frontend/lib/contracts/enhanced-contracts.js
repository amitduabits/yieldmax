// lib/contracts/enhanced-contracts-fixed.js
// Use this file instead of the current enhanced-contracts.js

export const ENHANCED_CONTRACTS = {
  sepolia: {
    // Your working vault contracts
    // vault: "0xECbA31cf51F88BA5193186abf35225ECE097df44",
    vault: "0x173a4Adc3e84BC182c614856db66d7Cb814cF019",
    usdc: "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d",
    
    // Production contracts deployed on Sepolia
    strategyEngine: "0x0235d22774f60abbf779Fa289Fd1CCdD351c69bE",
    oracleManager: "0xb42F39D88BE90e1841D7553Ecc1b8eBb214E98f8",
    automationManager: "0x4038A682239616579DaA227Be5dbB78d6674fB41"
  }
};

// Simplified ABIs that won't cause errors
export const ENHANCED_STRATEGY_ABI = [
  "function getCurrentStrategy() view returns (string, uint256, uint256, uint256, uint256, uint256)",
  "function getCurrentYields() view returns (uint256, uint256, uint256, uint256)",
  "function checkUpkeep(bytes) view returns (bool, bytes)",
  "function updateStrategy()",
  "function performUpkeep(bytes)"
];

export const ORACLE_MANAGER_ABI = [
  "function getLatestYieldData() view returns (uint256, uint256, uint256, uint256, uint256)",
  "function updateYieldData()",
  "function isDataFresh() view returns (bool)"
];

export const AUTOMATION_ABI = [
  "function getAutomationStatus() view returns (bool, uint256, uint256, address, uint256)",
  "function checkUpkeep(bytes) view returns (bool, bytes)",
  "function performUpkeep(bytes)",
  "function getRebalanceHistory(uint256) view returns (tuple(uint256,address,address,uint256,uint256)[])"
];

export const VAULT_ABI = [
  "function totalAssets() view returns (uint256)",
  "function totalShares() view returns (uint256)",
  "function getUserShares(address user) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function deposit(uint256 amount, address receiver) returns (uint256 shares)",
  "function withdraw(uint256 shares) returns (uint256 amount)",
  "function lastRebalance() view returns (uint256)"
];