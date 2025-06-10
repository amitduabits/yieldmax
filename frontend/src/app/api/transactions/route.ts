import { NextResponse } from 'next/server';

export async function GET() {
  const transactions = [
    {
      id: '1',
      type: 'deposit',
      protocol: 'Aave',
      chain: 'Ethereum',
      amount: 10000,
      asset: 'USDC',
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'confirmed',
      timestamp: Date.now() - 3600000,
      gasUsed: 0.012
    },
    {
      id: '2',
      type: 'rebalance',
      protocol: 'Compound',
      chain: 'Arbitrum',
      amount: 5000,
      asset: 'USDC',
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      status: 'confirmed',
      timestamp: Date.now() - 7200000,
      gasUsed: 0.008
    },
    {
      id: '3',
      type: 'withdraw',
      protocol: 'Curve',
      chain: 'Polygon',
      amount: 2500,
      asset: 'DAI',
      hash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
      status: 'pending',
      timestamp: Date.now() - 600000,
      gasUsed: 0.005
    }
  ];
  
  return NextResponse.json(transactions);
}
