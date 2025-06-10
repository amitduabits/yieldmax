import { NextResponse } from 'next/server';

export async function GET() {
  const portfolio = {
    positions: [
      {
        id: '1',
        protocol: 'Aave',
        chain: 'Ethereum',
        asset: 'USDC',
        amount: 10000,
        value: 10050,
        yield: 3.2,
        earnings: 8.76
      },
      {
        id: '2',
        protocol: 'Compound',
        chain: 'Arbitrum',
        asset: 'USDC',
        amount: 5000,
        value: 5125,
        yield: 5.8,
        earnings: 12.45
      },
      {
        id: '3',
        protocol: 'Curve',
        chain: 'Polygon',
        asset: 'DAI',
        amount: 7500,
        value: 7680,
        yield: 12.4,
        earnings: 25.67
      }
    ],
    totalValue: 22855,
    change24h: 2.3
  };
  
  return NextResponse.json(portfolio);
}
