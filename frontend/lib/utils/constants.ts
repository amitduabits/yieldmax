export const CHAINS = {
  ETHEREUM: {
    id: 1,
    name: 'Ethereum',
    icon: '🔷',
    color: '#627EEA',
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC,
  },
  ARBITRUM: {
    id: 42161,
    name: 'Arbitrum',
    icon: '🔵',
    color: '#28A0F0',
    rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC,
  },
  POLYGON: {
    id: 137,
    name: 'Polygon',
    icon: '🟣',
    color: '#8247E5',
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC,
  },
  OPTIMISM: {
    id: 10,
    name: 'Optimism',
    icon: '🔴',
    color: '#FF0420',
    rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC,
  },
};

export const PROTOCOLS = {
  AAVE: {
    name: 'Aave',
    icon: '👻',
    color: '#B6509E',
    risk: 'Low',
  },
  COMPOUND: {
    name: 'Compound',
    icon: '💚',
    color: '#00D395',
    risk: 'Low',
  },
  YEARN: {
    name: 'Yearn',
    icon: '🔵',
    color: '#006AE3',
    risk: 'Medium',
  },
  CURVE: {
    name: 'Curve',
    icon: '🌈',
    color: '#FA6E00',
    risk: 'Low',
  },
};

export const RISK_LEVELS = {
  LOW: { label: 'Low Risk', color: '#10b981', max: 30 },
  MEDIUM: { label: 'Medium Risk', color: '#f59e0b', max: 60 },
  HIGH: { label: 'High Risk', color: '#ef4444', max: 100 },
};

export const TRANSACTION_TYPES = {
  DEPOSIT: 'Deposit',
  WITHDRAW: 'Withdraw',
  REBALANCE: 'Rebalance',
  BRIDGE: 'Bridge',
};