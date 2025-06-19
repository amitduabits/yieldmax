// lib/contracts/enhanced-contracts.js
export const ENHANCED_CONTRACTS = {
  sepolia: {
    // Core contracts
    vault: "0xECbA31cf51F88BA5193186abf35225ECE097df44",
    usdc: "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d", // Your test USDC from screenshots
    
    // Enhanced Strategy System (from your actual deployment)
    strategyEngine: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    oracleManager: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    automationManager: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    
    // Mock protocol addresses for testing
    mockAave: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    mockCompound: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    mockYearn: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    mockCurve: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
  }
};

// Enhanced Strategy Engine ABI
export const ENHANCED_STRATEGY_ABI = [
  // View functions - simplified return format
  {
    "inputs": [],
    "name": "getCurrentStrategy",
    "outputs": [
      { "name": "protocolName", "type": "string" },
      { "name": "allocation", "type": "uint256" },
      { "name": "expectedAPY", "type": "uint256" },
      { "name": "riskScore", "type": "uint256" },
      { "name": "confidence", "type": "uint256" },
      { "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentYields",
    "outputs": [
      { "name": "aaveAPY", "type": "uint256" },
      { "name": "compoundAPY", "type": "uint256" },
      { "name": "yearnAPY", "type": "uint256" },
      { "name": "curveAPY", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "name": "getBestYield",
    "outputs": [
      { "name": "protocol", "type": "string" },
      { "name": "expectedAPY", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "bytes" }],
    "name": "checkUpkeep",
    "outputs": [
      { "name": "upkeepNeeded", "type": "bool" },
      { "name": "performData", "type": "bytes" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  "function isDataFresh() external view returns (bool)",
  "function updateStrategy() external",
  "function performUpkeep(bytes calldata performData) external"
];

// Oracle Manager ABI
export const ORACLE_MANAGER_ABI = [
  {
    "inputs": [],
    "name": "getLatestYieldData",
    "outputs": [
      { "name": "aaveAPY", "type": "uint256" },
      { "name": "compoundAPY", "type": "uint256" },
      { "name": "yearnAPY", "type": "uint256" },
      { "name": "curveAPY", "type": "uint256" },
      { "name": "lastUpdate", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  "function updateYieldData() external",
  "function isDataFresh() external view returns (bool)"
];

// Automation Manager ABI
export const AUTOMATION_ABI = [
  "function checkUpkeep(bytes calldata) external view returns (bool upkeepNeeded, bytes memory performData)",
  "function performUpkeep(bytes calldata performData) external",
  "function getAutomationStatus() external view returns (bool needsUpkeep, uint256 nextRebalanceTime, uint256 totalRebalances, address currentProtocol, uint256 currentAPY)",
  "function getRebalanceHistory(uint256 limit) external view returns (tuple(uint256 timestamp, address fromProtocol, address toProtocol, uint256 amount, uint256 reason)[])"
];

// Vault ABI
export const VAULT_ABI = [
  "function totalAssets() view returns (uint256)",
  "function totalShares() view returns (uint256)",
  "function getUserShares(address user) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function deposit(uint256 amount, address receiver) returns (uint256 shares)",
  "function withdraw(uint256 shares, address receiver, address owner) returns (uint256 amount)",
  "function lastRebalance() view returns (uint256)",
];