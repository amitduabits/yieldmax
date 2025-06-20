export const CONTRACTS = {
  sepolia: {
    vault: '0x173a4Adc3e84BC182c614856db66d7Cb814cF019',
    automation: '0x76cB3d20431F43C3cbe42ade8d0c246F41c78641',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  }
};

export const VAULT_ABI = [
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 amount) external',
  'function balanceOf(address account) view returns (uint256)',
  'function currentProtocol() view returns (uint8)'
];

export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)'
];