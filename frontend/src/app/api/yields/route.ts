import { NextResponse } from 'next/server';

export async function GET() {
  const yields = [
    {
      protocol: 'Aave',
      chain: 'Ethereum',
      apy: 3.2,
      tvl: 5200000000,
      risk: 0.2
    },
    {
      protocol: 'Aave',
      chain: 'Arbitrum',
      apy: 5.8,
      tvl: 1200000000,
      risk: 0.3
    },
    {
      protocol: 'Compound',
      chain: 'Ethereum',
      apy: 2.9,
      tvl: 3100000000,
      risk: 0.2
    },
    {
      protocol: 'Curve',
      chain: 'Polygon',
      apy: 12.4,
      tvl: 890000000,
      risk: 0.5
    },
    {
      protocol: 'Morpho',
      chain: 'Ethereum',
      apy: 4.1,
      tvl: 450000000,
      risk: 0.3
    },
    {
      protocol: 'Spark',
      chain: 'Ethereum',
      apy: 3.8,
      tvl: 780000000,
      risk: 0.25
    }
  ];
  
  return NextResponse.json(yields);
}
