// pages/api/demo/trigger-yield-spike.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const spikeData = {
    protocol: 'GMX',
    chain: 'Arbitrum',
    previousApy: 15.7,
    newApy: 21.2,
    tvl: 450000000,
    confidence: 94,
    detectedAt: Date.now(),
    estimatedDuration: 72 * 3600 * 1000,
    aiAnalysis: {
      trend: 'bullish',
      volatility: 'low',
      recommendation: 'strong_buy',
      riskScore: 0.15
    }
  };

  // In production, broadcast via WebSocket
  res.json({ 
    success: true, 
    message: 'Yield spike triggered!',
    spike: spikeData 
  });
}