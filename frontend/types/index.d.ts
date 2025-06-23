export interface Protocol {
  name: string;
  apy: number;
  tvl: number;
  utilization: number;
  risk: number;
  isActive: boolean;
}

export interface Strategy {
  protocolName: string;
  allocation: number;
  expectedAPY: number;
  riskScore: number;
  confidence: number;
  timestamp: number;
}

export interface VaultData {
  totalAssets: string;
  totalShares: string;
  userShares: string;
  userBalance: string;
  allowance: string;
  lastRebalance: number;
}

export interface Transaction {
  hash: string;
  type: 'deposit' | 'withdraw' | 'rebalance' | 'bridge';
  amount: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
}

export interface ChainConfig {
  id: number;
  name: string;
  icon: string;
  color: string;
  rpcUrl: string;
  contracts: {
    vault: string;
    strategyEngine: string;
    crossChainManager: string;
    usdc: string;
  };
}