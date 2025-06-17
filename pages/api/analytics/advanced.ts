import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { metric, timeframe = '7d' } = req.query;
  
  switch (metric) {
    case 'user-growth':
      return getUserGrowth(timeframe as string, res);
    case 'yield-performance':
      return getYieldPerformance(timeframe as string, res);
    case 'gas-savings':
      return getGasSavings(timeframe as string, res);
    case 'protocol-distribution':
      return getProtocolDistribution(res);
    case 'cross-chain-flows':
      return getCrossChainFlows(timeframe as string, res);
    default:
      return res.status(400).json({ error: 'Invalid metric' });
  }
}

async function getUserGrowth(timeframe: string, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select('day, unique_users, total_deposits')
    .gte('day', getTimeframeStart(timeframe))
    .order('day', { ascending: true });
  
  if (error) return res.status(500).json({ error });
  
  // Calculate growth rate
  const growthRate = calculateGrowthRate(data);
  
  return res.json({
    metric: 'user-growth',
    data,
    summary: {
      totalUsers: data[data.length - 1]?.unique_users || 0,
      growthRate,
      projection: projectGrowth(data, 30) // 30-day projection
    }
  });
}

async function getYieldPerformance(timeframe: string, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('protocol_performance')
    .select('*')
    .gte('timestamp', getTimeframeStart(timeframe));
  
  if (error) return res.status(500).json({ error });
  
  // Calculate alpha (excess returns vs market)
  const marketAvg = 5.5; // Average DeFi yield
  const ourAvg = data.reduce((sum, d) => sum + d.avg_apy, 0) / data.length;
  const alpha = ourAvg - marketAvg;
  
  return res.json({
    metric: 'yield-performance',
    data,
    summary: {
      averageAPY: ourAvg,
      marketAPY: marketAvg,
      alpha,
      sharpeRatio: calculateSharpeRatio(data)
    }
  });
}

// Helper functions
function getTimeframeStart(timeframe: string): string {
  const now = new Date();
  const days = parseInt(timeframe) || 7;
  now.setDate(now.getDate() - days);
  return now.toISOString();
}

function calculateGrowthRate(data: any[]): number {
  if (data.length < 2) return 0;
  const first = data[0].unique_users;
  const last = data[data.length - 1].unique_users;
  return ((last - first) / first) * 100;
}

function projectGrowth(data: any[], days: number): number {
  // Simple linear projection (can be enhanced with ML)
  const recentGrowth = calculateGrowthRate(data.slice(-7));
  const dailyGrowth = recentGrowth / 7;
  const currentUsers = data[data.length - 1]?.unique_users || 0;
  return currentUsers * (1 + (dailyGrowth * days / 100));
}

function calculateSharpeRatio(data: any[]): number {
  // Simplified Sharpe ratio calculation
  const returns = data.map(d => d.avg_apy);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const riskFreeRate = 4.5; // US Treasury yield
  const stdDev = calculateStdDev(returns);
  return (avgReturn - riskFreeRate) / stdDev;
}

function calculateStdDev(values: number[]): number {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}