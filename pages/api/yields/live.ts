import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const liveData = {
    type: 'YIELD_UPDATE',
    payload: {
      protocol: 'GMX',
      chain: 'Arbitrum',
      apy: 15.7 + (Math.random() - 0.5) * 2,
      tvl: 450000000 + Math.random() * 10000000,
      change: Math.random() - 0.5
    },
    timestamp: Date.now()
  };

  res.json(liveData);
}