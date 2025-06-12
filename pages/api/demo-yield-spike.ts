// pages/api/demo-yield-spike.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simulate yield spike for demo
  const mockSpike = {
    protocol: 'GMX',
    chain: 'Arbitrum',
    previousApy: 8.5,
    newApy: 21.2,
    tvl: 450000000,
    timestamp: Date.now(),
    aiConfidence: 94,
    estimatedDuration: 72 * 3600 * 1000 // 72 hours
  };
  
  // Broadcast via WebSocket for real-time update
  broadcastYieldUpdate(mockSpike);
  
  res.json({ success: true, spike: mockSpike });
}