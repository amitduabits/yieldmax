// pages/api/ai/recommend.ts
import { NextApiRequest, NextApiResponse } from 'next';

const MOCK_RECOMMENDATIONS = [
  {
    action: 'rebalance',
    fromProtocol: 'Compound',
    toProtocol: 'GMX',
    fromChain: 'ethereum',
    toChain: 'arbitrum',
    amount: '10000',
    expectedGain: 12.5,
    confidence: 94,
    gasEstimate: '0.012',
    netProfit: '247.50'
  },
  {
    action: 'rebalance',
    fromProtocol: 'Aave',
    toProtocol: 'Yearn',
    fromChain: 'polygon',
    toChain: 'ethereum',
    amount: '5000',
    expectedGain: 8.3,
    confidence: 87,
    gasEstimate: '0.025',
    netProfit: '115.20'
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return mock recommendation with some randomness
    const recommendation = Math.random() > 0.3 ? MOCK_RECOMMENDATIONS[0] : null;

    res.json({ recommendation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
}