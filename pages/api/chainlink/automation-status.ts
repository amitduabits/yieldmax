import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mockStatus = {
    isActive: true,
    upkeepId: '0x' + Array(64).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join(''),
    lastExecution: new Date(Date.now() - 3600000).toISOString(),
    nextExecution: new Date(Date.now() + 1800000).toISOString(),
    executionCount: 247,
    totalProfitGenerated: 15420.50,
    averageGasCost: 0.0045
  };

  res.json(mockStatus);
}