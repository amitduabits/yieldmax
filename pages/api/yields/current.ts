import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mockYields = [
    {
      protocol: 'Aave V3',
      chain: 'Arbitrum',
      apy: 8.2,
      tvl: 2500000000,
      risk: 'Low',
      change24h: 0.3
    },
    {
      protocol: 'GMX',
      chain: 'Arbitrum',
      apy: 15.7,
      tvl: 450000000,
      risk: 'Medium',
      change24h: -0.5
    },
    {
      protocol: 'Compound',
      chain: 'Ethereum',
      apy: 6.8,
      tvl: 5000000000,
      risk: 'Low',
      change24h: 0.1
    }
  ];

  res.json({ yields: mockYields, timestamp: Date.now() });
}