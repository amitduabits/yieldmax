// pages/api/portfolio.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    const mockPortfolio = {
      totalValue: 10000,
      positions: [
        {
          protocol: 'Compound',
          chain: 'ethereum',
          value: 10000,
          apy: 8.2,
          deposited: 10000,
          earned: 0,
          token: 'USDC'
        }
      ],
      history: [
        {
          date: new Date(Date.now() - 86400000).toISOString(),
          value: 9950
        },
        {
          date: new Date().toISOString(),
          value: 10000
        }
      ]
    };

    res.json(mockPortfolio);
  } catch (error) {
    console.error('Portfolio API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}