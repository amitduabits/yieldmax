export const CONTRACTS = {
  sepolia: {
    vault: '0xc2A4d1a2F1200680F1024d7310e3e84DeE3E5777',
    strategyEngine: '0xcA5F43F98d41249CAd9d953f6f6967C582bAf78B',
    crossChainManager: '0xC033b4Eea791ba83C0FcDAC8cD67c563B5b98eC3',
    usdc: '0xe5f46A2dD1fCDdCDb86b3D9C1D23065B1572F818',
    chainlinkRouter: '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59',
    linkToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
  },
  arbitrumSepolia: {
    vault: '0x10d2ECF290f56BdBF6B8e014c426c17299b4E3B2',
    strategyEngine: '0xBEff1059bb19Db93a1f9Eb25B094719479792D31',
    crossChainManager: '0x0110f1f9f69539B14D7d38A5fc1Ec5D9B5850dF6',
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    chainlinkRouter: '0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165',
    linkToken: '0xb1D4538B4571d411F07960EF2838Ce337FE1E80E',
  },
};
export const CHAIN_SELECTORS = {
  sepolia: '16015286601757825753',
  arbitrumSepolia: '3478487238524512106',
  polygon: '12532609583862916517',
  optimism: '2664363617261496610',
};
// Basic ERC20 ABI for USDC interactions
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];
// YieldMaxVault ABI - essential functions
export const VAULT_ABI = [
  "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256 assets)",
  "function totalAssets() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function convertToShares(uint256 assets) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function maxDeposit(address) view returns (uint256)",
  "function maxWithdraw(address owner) view returns (uint256)",
  "function previewDeposit(uint256 assets) view returns (uint256)",
  "function previewWithdraw(uint256 assets) view returns (uint256)",
  "function asset() view returns (address)",
  "function rebalance() external",
  "function lastRebalance() view returns (uint256)",
  "event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)",
  "event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)"
];
// StrategyEngine ABI
export const STRATEGY_ABI = [
  "function getCurrentStrategy() view returns (string memory protocolName, uint256 allocation, uint256 expectedAPY, uint256 riskScore, uint256 confidence, uint256 timestamp)",
  "function shouldRebalance() view returns (bool, string memory)",
  "function executeRebalance() returns (bool)",
  "function protocolData(uint8) view returns (uint256 apy, uint256 tvl, uint256 utilization, uint256 lastUpdate, bool active)",
  "function lastRebalance() view returns (uint256)",
  "function totalRebalances() view returns (uint256)"
];