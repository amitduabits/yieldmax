// config/index.ts
export * from './contracts';
export * from './abi';

export const SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  POLYGON: 137,
  OPTIMISM: 10,
  // Testnets
  SEPOLIA: 11155111,
};

export const RPC_URLS = {
  [SUPPORTED_CHAINS.ETHEREUM]: process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
  [SUPPORTED_CHAINS.ARBITRUM]: process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY',
  [SUPPORTED_CHAINS.POLYGON]: process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY',
  [SUPPORTED_CHAINS.OPTIMISM]: process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY',
  [SUPPORTED_CHAINS.SEPOLIA]: process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY',
};

export const CHAIN_NAMES = {
  [SUPPORTED_CHAINS.ETHEREUM]: 'Ethereum',
  [SUPPORTED_CHAINS.ARBITRUM]: 'Arbitrum',
  [SUPPORTED_CHAINS.POLYGON]: 'Polygon',
  [SUPPORTED_CHAINS.OPTIMISM]: 'Optimism',
  [SUPPORTED_CHAINS.SEPOLIA]: 'Sepolia',
};