// lib/contracts/addresses.ts

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
    vault: '0xfb1B4c413E9Ccf30BACB4D1670fB1fFd8072dfC6',
    strategyEngine: '0xECbA31cf51F88BA5193186abf35225ECE097df44',
    crossChainManager: '0x94e2FB66Df4faF72b421DF3925872adf8C59Af4c',
    usdc: '0x3340517A0F037F12bA3EC479a4d136C5371ACc1f',
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
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
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
  },
  {
    "inputs": [],
    "name": "executeRebalance",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// CrossChainManager ABI
export const CROSS_CHAIN_MANAGER_ABI = [
  {
    "inputs": [
      { "internalType": "uint64", "name": "destinationChainSelector", "type": "uint64" },
      { "internalType": "address", "name": "receiver", "type": "address" },
      { "internalType": "string", "name": "action", "type": "string" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "sendMessage",
    "outputs": [{ "internalType": "bytes32", "name": "messageId", "type": "bytes32" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint64", "name": "chainSelector", "type": "uint64" },
      { "internalType": "address", "name": "remoteVault", "type": "address" }
    ],
    "name": "configureChain",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];