// config/contracts.ts
export const CONTRACTS = {
  sepolia: {
    USDC: '0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d',
    YieldMaxVault: '0xECbA31cf51F88BA5193186abf35225ECE097df44',
    StrategyEngine: '0x6186d8180E85213fDEE20eb9f96ae94288Ff543d',
    AIOptimizer: '0xAF1b506b0dCD839785997DDE6A3fbaC7B3d6f41A', // ✅ DEPLOYED!
    CrossChainManager: '0x75184db477E030aD316CabaD72e18292F350560C', // ✅ DEPLOYED!
    AutomationHandler: '', // Deploy this
  },
  mainnet: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    YieldMaxVault: '', // To be deployed
    StrategyEngine: '', // To be deployed
    AIOptimizer: '', // To be deployed
    CrossChainManager: '', // To be deployed
    AutomationHandler: '', // To be deployed
  },
  arbitrum: {
    USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    YieldMaxVault: '', // To be deployed
    StrategyEngine: '', // To be deployed
    CrossChainManager: '', // To be deployed
  },
  polygon: {
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    YieldMaxVault: '', // To be deployed
    StrategyEngine: '', // To be deployed
    CrossChainManager: '', // To be deployed
  }
};

export const CHAINLINK_CONTRACTS = {
  sepolia: {
    CCIP_ROUTER: '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59',
    FUNCTIONS_ROUTER: '0xb83E47C2bC239B3bf370bc41e1459A34b41238D0',
    AUTOMATION_REGISTRY: '0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad',
    LINK_TOKEN: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
    ETH_USD_FEED: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
  },
  mainnet: {
    CCIP_ROUTER: '0xE561d5E02207fb5eB32cca20a699E0d8919a1476',
    FUNCTIONS_ROUTER: '0x65Dcc24F8ff9e51F10DCc7Ed1e4e2A61e6E14bd6',
    AUTOMATION_REGISTRY: '0x02777053d6764996e594c3E88AF1D58D5363a2e6',
    LINK_TOKEN: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    ETH_USD_FEED: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  },
  arbitrum: {
    CCIP_ROUTER: '0x141fa059441E0ca23ce184B6A78bafD2A517DdE8',
    LINK_TOKEN: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
    ETH_USD_FEED: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
  },
  polygon: {
    CCIP_ROUTER: '0x70499c328e1E2a3c41108bd3730F6670a44595D1',
    LINK_TOKEN: '0xb0897686c545045aFc77CF20eC7A532E3120E0F1',
    ETH_USD_FEED: '0xF9680D99D6C9589e2a93a78A04A279e509205945',
  }
};

// Helper functions
export const getContractAddress = (contractName: string, chainId: number) => {
  const network = getNetworkName(chainId);
  return CONTRACTS[network]?.[contractName] || '';
};

export const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 1: return 'mainnet';
    case 11155111: return 'sepolia';
    case 42161: return 'arbitrum';
    case 137: return 'polygon';
    default: return 'unknown';
  }
};

// Export all deployed contracts for easy access
export const DEPLOYED_CONTRACTS = {
  sepolia: {
    USDC: CONTRACTS.sepolia.USDC,
    YieldMaxVault: CONTRACTS.sepolia.YieldMaxVault,
    StrategyEngine: CONTRACTS.sepolia.StrategyEngine,
    CrossChainManager: CONTRACTS.sepolia.CrossChainManager,
  }
};