// frontend/src/config/contracts.ts
export const CONTRACTS = {
  sepolia: {
    YieldMaxVault: "0x09c4e48151C29774aD2F83853dA71E66b8aA8719",
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
  },
  arbitrumSepolia: {
    YieldMaxVault: "0x7043148386eD44Df90905a3f1379C1E36eF9c49E",
    USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
  }
};

export const SUPPORTED_CHAINS = {
  sepolia: {
    id: 11155111,
    name: "Sepolia",
    explorer: "https://sepolia.etherscan.io"
  },
  arbitrumSepolia: {
    id: 421614,
    name: "Arbitrum Sepolia",
    explorer: "https://sepolia.arbiscan.io"
  }
};

export const VAULT_ABI = [
  "function deposit(uint256 assets, address receiver) returns (uint256)",
  "function withdraw(uint256 shares, address receiver) returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalAssets() view returns (uint256)",
  "function totalShares() view returns (uint256)",
  "function asset() view returns (address)",
  "function owner() view returns (address)",
  "function keeper() view returns (address)",
  "event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)",
  "event Withdraw(address indexed sender, address indexed receiver, uint256 assets, uint256 shares)"
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)"
];