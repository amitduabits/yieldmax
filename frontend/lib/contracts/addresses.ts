export const CONTRACTS = {
  sepolia: {
    YieldMaxVault: "0xECbA31cf51F88BA5193186abf35225ECE097df44",
    USDC: "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d",
  },
} as const;

export const VAULT_ABI = [
  "function totalAssets() view returns (uint256)",
  "function totalShares() view returns (uint256)", 
  "function getUserShares(address user) view returns (uint256)",
  "function deposit(uint256 amount, address receiver) returns (uint256 shares)",
  "function withdraw(uint256 shares) returns (uint256 amount)",
  "function triggerRebalance()",
  "function lastRebalance() view returns (uint256)",
] as const;

export const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
] as const;