// // pages/api/transactions.ts - REAL TRANSACTION HISTORY
// import type { NextApiRequest, NextApiResponse } from 'next';
// import { ethers } from 'ethers';
// import { CONTRACTS } from '../../config/contracts';

// const VAULT_ABI = [
//   'event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)',
//   'event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)'
// ];

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   try {
//     const { address } = req.query;
    
//     if (!address || typeof address !== 'string') {
//       return res.status(400).json({
//         success: false,
//         error: 'Address parameter required'
//       });
//     }

//     const provider = new ethers.providers.JsonRpcProvider(
//       process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL
//     );

//     const vault = new ethers.Contract(
//       CONTRACTS.YieldMaxVault.address,
//       VAULT_ABI,
//       provider
//     );

//     // Get current block
//     const currentBlock = await provider.getBlockNumber();
//     const fromBlock = currentBlock - 100000; // Last ~2 weeks on Sepolia

//     // Fetch deposit events
//     const depositFilter = vault.filters.Deposit(null, address);
//     const deposits = await vault.queryFilter(depositFilter, fromBlock, currentBlock);

//     // Fetch withdraw events
//     const withdrawFilter = vault.filters.Withdraw(null, null, address);
//     const withdrawals = await vault.queryFilter(withdrawFilter, fromBlock, currentBlock);

//     // Process transactions
//     const transactions = await Promise.all([
//       ...deposits.map(async (event) => {
//         const block = await event.getBlock();
//         return {
//           id: event.transactionHash,
//           type: 'deposit' as const,
//           protocol: 'YieldMax Vault',
//           chain: 'sepolia',
//           amount: parseFloat(ethers.utils.formatUnits(event.args.assets, 6)),
//           shares: parseFloat(ethers.utils.formatUnits(event.args.shares, 6)),
//           asset: 'USDC',
//           hash: event.transactionHash,
//           status: 'confirmed' as const,
//           timestamp: block.timestamp * 1000,
//           blockNumber: event.blockNumber,
//           gasUsed: event.gasUsed?.toNumber() || 0
//         };
//       }),
//       ...withdrawals.map(async (event) => {
//         const block = await event.getBlock();
//         return {
//           id: event.transactionHash,
//           type: 'withdraw' as const,
//           protocol: 'YieldMax Vault',
//           chain: 'sepolia',
//           amount: parseFloat(ethers.utils.formatUnits(event.args.assets, 6)),
//           shares: parseFloat(ethers.utils.formatUnits(event.args.shares, 6)),
//           asset: 'USDC',
//           hash: event.transactionHash,
//           status: 'confirmed' as const,
//           timestamp: block.timestamp * 1000,
//           blockNumber: event.blockNumber,
//           gasUsed: event.gasUsed?.toNumber() || 0
//         };
//       })
//     ]);

//     // Sort by timestamp (newest first)
//     transactions.sort((a, b) => b.timestamp - a.timestamp);

//     // Add some mock rebalance transactions for demo
//     const mockRebalances = generateMockRebalances(address);
//     const allTransactions = [...transactions, ...mockRebalances]
//       .sort((a, b) => b.timestamp - a.timestamp)
//       .slice(0, 50); // Limit to 50 most recent

//     res.status(200).json({
//       success: true,
//       data: allTransactions
//     });

//   } catch (error) {
//     console.error('Transactions API Error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch transactions'
//     });
//   }
// }

// function generateMockRebalances(address: string): any[] {
//   // Generate some realistic rebalance transactions
//   const rebalances = [];
//   const protocols = ['Aave V3', 'Compound V3', 'Morpho', 'Spark'];
//   const chains = ['ethereum', 'arbitrum', 'polygon', 'optimism'];
  
//   for (let i = 0; i < 5; i++) {
//     const fromProtocol = protocols[Math.floor(Math.random() * protocols.length)];
//     let toProtocol = protocols[Math.floor(Math.random() * protocols.length)];
//     while (toProtocol === fromProtocol) {
//       toProtocol = protocols[Math.floor(Math.random() * protocols.length)];
//     }
    
//     rebalances.push({
//       id: `rebalance-${i}-${Date.now()}`,
//       type: 'rebalance',
//       fromProtocol,
//       toProtocol,
//       protocol: `${fromProtocol} → ${toProtocol}`,
//       chain: chains[Math.floor(Math.random() * chains.length)],
//       amount: Math.random() * 50000 + 5000,
//       asset: 'USDC',
//       hash: `0x${Math.random().toString(16).substr(2, 64)}`,
//       status: 'confirmed',
//       timestamp: Date.now() - (i + 1) * 86400000 * Math.random() * 7, // Random within last week
//       gasUsed: Math.floor(Math.random() * 500000 + 200000),
//       apyGain: (Math.random() * 3 + 0.5).toFixed(2)
//     });
//   }
  
//   return rebalances;
// }

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Address required' });
  }

  const mockTransactions = [
    {
      hash: '0x1234567890abcdef',
      type: 'deposit',
      protocol: 'Compound',
      chain: 'ethereum',
      amount: 10000,
      token: 'USDC',
      timestamp: Date.now() - 86400000,
      status: 'completed'
    }
  ];

  res.json({ transactions: mockTransactions });
}