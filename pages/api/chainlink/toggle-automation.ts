import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { enable } = req.body;

  await new Promise(resolve => setTimeout(resolve, 1000));

  res.json({ 
    isActive: enable,
    message: enable ? 'Automation enabled' : 'Automation disabled'
  });
}