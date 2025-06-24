// lib/contracts/addresses.ts

export const CONTRACTS = {
  sepolia: {
    vault: '0x8B388c1E9f6b3Ef66f5D3E81d90CD1e5d65AC0BC',
    strategyEngine: '0xE113312320A6Fb5cf78ac7e0C8B72E9bc788aC4f',
    crossChainManager: '0x3E7Fe8Bd93cC2862A4642ACf493a9fCE4F975589',
    automationConnector: '0x...',
    usdc: '0x99f8B38514d22c54982b4be93495735bfcCE23b9',
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

// YieldMax Vault ABI
export const VAULT_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "assets", "type": "uint256" },
      { "internalType": "address", "name": "receiver", "type": "address" }
    ],
    "name": "deposit",
    "outputs": [{ "internalType": "uint256", "name": "shares", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "assets", "type": "uint256" },
      { "internalType": "address", "name": "receiver", "type": "address" },
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "withdraw",
    "outputs": [{ "internalType": "uint256", "name": "shares", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalAssets",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalShares",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getUserShares",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastRebalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// ERC20 ABI (for USDC)
export const ERC20_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Strategy Engine ABI
export const STRATEGY_ABI = [
  {
    "inputs": [],
    "name": "getCurrentStrategy",
    "outputs": [
      { "internalType": "string", "name": "protocolName", "type": "string" },
      { "internalType": "uint256", "name": "allocation", "type": "uint256" },
      { "internalType": "uint256", "name": "expectedAPY", "type": "uint256" },
      { "internalType": "uint256", "name": "riskScore", "type": "uint256" },
      { "internalType": "uint256", "name": "confidence", "type": "uint256" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];