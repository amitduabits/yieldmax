export const VAULT_ABI = [
  'function deposit(uint256 assets, address receiver) returns (uint256 shares)',
  'function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)',
  'function totalAssets() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function convertToAssets(uint256 shares) view returns (uint256)',
  'function convertToShares(uint256 assets) view returns (uint256)',
  'function maxWithdraw(address owner) view returns (uint256)',
  'function previewDeposit(uint256 assets) view returns (uint256)',
  'function previewWithdraw(uint256 assets) view returns (uint256)',
  'function rebalance() external',
  'event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)',
  'event Withdraw(address indexed sender, address indexed receiver, uint256 assets, uint256 shares)',
];

export const STRATEGY_ENGINE_ABI = [
  'function getCurrentStrategy() view returns (tuple(string protocolName, uint256 allocation, uint256 expectedAPY, uint256 riskScore, uint256 confidence, uint256 timestamp))',
  'function shouldRebalance() view returns (bool, string memory)',
  'function protocolData(uint256) view returns (uint256 apy, uint256 tvl, uint256 utilization, uint256 lastUpdate, bool active)',
  'function rebalanceThreshold() view returns (uint256)',
  'function executeRebalance() external returns (bool)',
];

export const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

export const CROSS_CHAIN_MANAGER_ABI = [
  'function sendMessage(uint64 destinationChainSelector, address receiver, string memory action, bytes memory data) payable returns (bytes32)',
  'function configureChain(uint64 chainSelector, address remoteVault) external',
  'function supportedChains(uint64) view returns (bool)',
  'function remoteVaults(uint64) view returns (address)',
];