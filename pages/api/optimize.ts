// // pages/api/optimize.ts - AI-POWERED OPTIMIZATION ENGINE
// import type { NextApiRequest, NextApiResponse } from 'next';
// import { ethers } from 'ethers';

// interface OptimizationStrategy {
//   id: string;
//   type: 'yield' | 'safety' | 'balanced' | 'gas';
//   name: string;
//   description: string;
//   changes: PositionChange[];
//   projectedAPY: number;
//   currentAPY: number;
//   monthlyGain: number;
//   riskLevel: 'low' | 'medium' | 'high';
//   confidence: number;
//   gasEstimate: number;
// }

// interface PositionChange {
//   action: 'move' | 'split' | 'consolidate';
//   from: string;
//   to: string;
//   amount: number;
//   reason: string;
//   apyGain: number;
// }

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   try {
//     const { address, currentPositions, riskTolerance = 'medium' } = req.body;

//     if (!address) {
//       return res.status(400).json({
//         success: false,
//         error: 'Address required'
//       });
//     }

//     // Fetch current market conditions
//     const marketData = await fetchMarketData();
    
//     // Run AI optimization algorithms
//     const strategies = await generateOptimizationStrategies(
//       currentPositions || getDefaultPositions(),
//       marketData,
//       riskTolerance
//     );

//     // Calculate gas costs for each strategy
//     const strategiesWithGas = await Promise.all(
//       strategies.map(async (strategy) => ({
//         ...strategy,
//         gasEstimate: await estimateGasCost(strategy.changes)
//       }))
//     );

//     // Sort by potential gain
//     strategiesWithGas.sort((a, b) => b.monthlyGain - a.monthlyGain);

//     res.status(200).json({
//       success: true,
//       data: {
//         strategies: strategiesWithGas,
//         marketConditions: {
//           gasPrice: marketData.gasPrice,
//           volatility: marketData.volatility,
//           trend: marketData.trend
//         },
//         recommendations: generateRecommendations(strategiesWithGas, riskTolerance),
//         lastUpdate: Date.now()
//       }
//     });

//   } catch (error) {
//     console.error('Optimization API Error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to generate optimization strategies'
//     });
//   }
// }

// async function fetchMarketData(): Promise<any> {
//   // Fetch real market data from multiple sources
//   const [yields, gasPrices, volatility] = await Promise.all([
//     fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/yields`).then(r => r.json()),
//     fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/gas`).then(r => r.json()),
//     calculateMarketVolatility()
//   ]);

//   return {
//     yields: yields.data?.yields || [],
//     gasPrice: gasPrices.data?.prices || {},
//     volatility,
//     trend: determineTrend(yields.data?.yields || [])
//   };
// }

// async function generateOptimizationStrategies(
//   positions: any[],
//   marketData: any,
//   riskTolerance: string
// ): Promise<OptimizationStrategy[]> {
//   const strategies: OptimizationStrategy[] = [];
  
//   // Strategy 1: Maximum Yield
//   const yieldStrategy = optimizeForYield(positions, marketData);
//   strategies.push(yieldStrategy);
  
//   // Strategy 2: Safety First
//   const safetyStrategy = optimizeForSafety(positions, marketData);
//   strategies.push(safetyStrategy);
  
//   // Strategy 3: Balanced Approach
//   const balancedStrategy = optimizeBalanced(positions, marketData);
//   strategies.push(balancedStrategy);
  
//   // Strategy 4: Gas Optimization
//   const gasStrategy = optimizeForGas(positions, marketData);
//   strategies.push(gasStrategy);
  
//   // Strategy 5: AI-Recommended (based on ML model)
//   const aiStrategy = await generateAIStrategy(positions, marketData, riskTolerance);
//   strategies.push(aiStrategy);
  
//   return strategies;
// }

// function optimizeForYield(positions: any[], marketData: any): OptimizationStrategy {
//   const changes: PositionChange[] = [];
//   const topYields = marketData.yields
//     .sort((a: any, b: any) => b.effectiveApy - a.effectiveApy)
//     .slice(0, 4);
  
//   // Move positions to highest yield protocols
//   positions.forEach((pos, index) => {
//     const targetProtocol = topYields[index % topYields.length];
//     if (pos.apy < targetProtocol.effectiveApy - 1) {
//       changes.push({
//         action: 'move',
//         from: `${pos.protocol} (${pos.chain})`,
//         to: `${targetProtocol.protocol} (${targetProtocol.chain})`,
//         amount: pos.value,
//         reason: 'Higher yield opportunity',
//         apyGain: targetProtocol.effectiveApy - pos.apy
//       });
//     }
//   });
  
//   const currentAPY = calculateWeightedAPY(positions);
//   const projectedAPY = calculateProjectedAPY(positions, changes, marketData);
  
//   return {
//     id: 'max-yield',
//     type: 'yield',
//     name: 'Maximum Yield Strategy',
//     description: 'Optimize for highest possible returns',
//     changes,
//     currentAPY,
//     projectedAPY,
//     monthlyGain: calculateMonthlyGain(positions, currentAPY, projectedAPY),
//     riskLevel: 'high',
//     confidence: 0.85,
//     gasEstimate: 0
//   };
// }

// function optimizeForSafety(positions: any[], marketData: any): OptimizationStrategy {
//   const changes: PositionChange[] = [];
//   const safeProtocols = marketData.yields
//     .filter((y: any) => y.risk < 0.2)
//     .sort((a: any, b: any) => a.risk - b.risk);
  
//   positions.forEach((pos) => {
//     if (pos.risk > 0.2) {
//       const safeOption = safeProtocols[0];
//       changes.push({
//         action: 'move',
//         from: `${pos.protocol} (${pos.chain})`,
//         to: `${safeOption.protocol} (${safeOption.chain})`,
//         amount: pos.value,
//         reason: 'Risk reduction',
//         apyGain: safeOption.apy - pos.apy
//       });
//     }
//   });
  
//   const currentAPY = calculateWeightedAPY(positions);
//   const projectedAPY = calculateProjectedAPY(positions, changes, marketData);
  
//   return {
//     id: 'safety-first',
//     type: 'safety',
//     name: 'Safety First Strategy',
//     description: 'Minimize risk exposure',
//     changes,
//     currentAPY,
//     projectedAPY,
//     monthlyGain: calculateMonthlyGain(positions, currentAPY, projectedAPY),
//     riskLevel: 'low',
//     confidence: 0.92,
//     gasEstimate: 0
//   };
// }

// function optimizeBalanced(positions: any[], marketData: any): OptimizationStrategy {
//   const changes: PositionChange[] = [];
  
//   // Find protocols with good risk/reward ratio
//   const scoredProtocols = marketData.yields.map((y: any) => ({
//     ...y,
//     score: y.effectiveApy / (1 + y.risk)
//   })).sort((a: any, b: any) => b.score - a.score);
  
//   // Rebalance to top protocols
//   const targetAllocation = [0.4, 0.3, 0.2, 0.1]; // Portfolio allocation
//   const topProtocols = scoredProtocols.slice(0, 4);
  
//   positions.forEach((pos, index) => {
//     const target = topProtocols[index % topProtocols.length];
//     if (pos.protocol !== target.protocol || pos.chain !== target.chain) {
//       changes.push({
//         action: 'move',
//         from: `${pos.protocol} (${pos.chain})`,
//         to: `${target.protocol} (${target.chain})`,
//         amount: pos.value,
//         reason: 'Balanced optimization',
//         apyGain: target.apy - pos.apy
//       });
//     }
//   });
  
//   const currentAPY = calculateWeightedAPY(positions);
//   const projectedAPY = calculateProjectedAPY(positions, changes, marketData);
  
//   return {
//     id: 'balanced',
//     type: 'balanced',
//     name: 'Balanced Strategy',
//     description: 'Balance risk and reward',
//     changes,
//     currentAPY,
//     projectedAPY,
//     monthlyGain: calculateMonthlyGain(positions, currentAPY, projectedAPY),
//     riskLevel: 'medium',
//     confidence: 0.88,
//     gasEstimate: 0
//   };
// }

// function optimizeForGas(positions: any[], marketData: any): OptimizationStrategy {
//   const changes: PositionChange[] = [];
  
//   // Consolidate positions on L2s
//   const l2Chains = ['arbitrum', 'optimism', 'polygon'];
//   const bestL2 = marketData.yields
//     .filter((y: any) => l2Chains.includes(y.chain))
//     .sort((a: any, b: any) => b.effectiveApy - a.effectiveApy)[0];
  
//   // Consolidate small positions
//   const smallPositions = positions.filter(p => p.value < 10000);
//   const totalSmallValue = smallPositions.reduce((sum, p) => sum + p.value, 0);
  
//   if (smallPositions.length > 1) {
//     changes.push({
//       action: 'consolidate',
//       from: 'Multiple small positions',
//       to: `${bestL2.protocol} (${bestL2.chain})`,
//       amount: totalSmallValue,
//       reason: 'Gas optimization',
//       apyGain: 0.3
//     });
//   }
  
//   const currentAPY = calculateWeightedAPY(positions);
//   const projectedAPY = currentAPY + 0.3; // Small gain from consolidation
  
//   return {
//     id: 'gas-efficient',
//     type: 'gas',
//     name: 'Gas Efficient Strategy',
//     description: 'Minimize transaction costs',
//     changes,
//     currentAPY,
//     projectedAPY,
//     monthlyGain: calculateMonthlyGain(positions, currentAPY, projectedAPY) + 120, // Gas savings
//     riskLevel: 'low',
//     confidence: 0.95,
//     gasEstimate: 0
//   };
// }

// async function generateAIStrategy(
//   positions: any[], 
//   marketData: any,
//   riskTolerance: string
// ): Promise<OptimizationStrategy> {
//   // Simulate AI/ML optimization
//   // In production, this would call an ML model
  
//   const changes: PositionChange[] = [];
  
//   // AI identifies patterns and opportunities
//   const opportunities = identifyMLOpportunities(positions, marketData);
  
//   opportunities.forEach(opp => {
//     changes.push({
//       action: opp.action,
//       from: opp.from,
//       to: opp.to,
//       amount: opp.amount,
//       reason: opp.reason,
//       apyGain: opp.apyGain
//     });
//   });
  
//   const currentAPY = calculateWeightedAPY(positions);
//   const projectedAPY = currentAPY + 2.5; // AI finds hidden alpha
  
//   return {
//     id: 'ai-recommended',
//     type: 'balanced',
//     name: 'AI-Powered Strategy',
//     description: 'Machine learning optimized allocation',
//     changes,
//     currentAPY,
//     projectedAPY,
//     monthlyGain: calculateMonthlyGain(positions, currentAPY, projectedAPY),
//     riskLevel: riskTolerance as any,
//     confidence: 0.91,
//     gasEstimate: 0
//   };
// }

// // Helper functions
// function calculateWeightedAPY(positions: any[]): number {
//   const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
//   if (totalValue === 0) return 0;
  
//   return positions.reduce((apy, p) => {
//     return apy + (p.apy * p.value / totalValue);
//   }, 0);
// }

// function calculateProjectedAPY(positions: any[], changes: PositionChange[], marketData: any): number {
//   // Complex calculation based on changes
//   const currentAPY = calculateWeightedAPY(positions);
//   const avgGain = changes.reduce((sum, c) => sum + c.apyGain, 0) / Math.max(changes.length, 1);
//   return currentAPY + avgGain * 0.7; // Conservative estimate
// }

// function calculateMonthlyGain(positions: any[], currentAPY: number, projectedAPY: number): number {
//   const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
//   const currentMonthly = (totalValue * currentAPY / 100) / 12;
//   const projectedMonthly = (totalValue * projectedAPY / 100) / 12;
//   return projectedMonthly - currentMonthly;
// }

// function calculateMarketVolatility(): number {
//   // Simplified volatility calculation
//   return Math.random() * 0.3 + 0.1; // 10-40%
// }

// function determineTrend(yields: any[]): string {
//   if (!yields.length) return 'stable';
//   const avgAPY = yields.reduce((sum, y) => sum + y.apy, 0) / yields.length;
//   if (avgAPY > 5) return 'bullish';
//   if (avgAPY < 3) return 'bearish';
//   return 'stable';
// }

// function getDefaultPositions(): any[] {
//   return [
//     { protocol: 'Aave V3', chain: 'ethereum', value: 50000, apy: 3.2, risk: 0.1 },
//     { protocol: 'Compound V3', chain: 'arbitrum', value: 30000, apy: 5.8, risk: 0.15 },
//     { protocol: 'Morpho', chain: 'polygon', value: 20000, apy: 4.5, risk: 0.2 },
//     { protocol: 'Spark', chain: 'ethereum', value: 25000, apy: 5.1, risk: 0.25 }
//   ];
// }

// async function estimateGasCost(changes: PositionChange[]): Promise<number> {
//   // Estimate based on number and type of changes
//   let totalGas = 0;
  
//   changes.forEach(change => {
//     if (change.action === 'move') {
//       totalGas += 400000; // Withdraw + Deposit
//     } else if (change.action === 'consolidate') {
//       totalGas += 200000 * 3; // Multiple withdraws + 1 deposit
//     }
//   });
  
//   // Assume $2 per 100k gas
//   return (totalGas / 100000) * 2;
// }

// function identifyMLOpportunities(positions: any[], marketData: any): any[] {
//   // Simulate ML model output
//   const opportunities = [];
  
//   // Pattern 1: Yield curve arbitrage
//   const yieldCurve = analyzeYieldCurve(marketData.yields);
//   if (yieldCurve.opportunity) {
//     opportunities.push({
//       action: 'move',
//       from: yieldCurve.from,
//       to: yieldCurve.to,
//       amount: 25000,
//       reason: 'Yield curve arbitrage opportunity',
//       apyGain: yieldCurve.gain
//     });
//   }
  
//   // Pattern 2: Risk parity rebalancing
//   const riskParity = calculateRiskParity(positions);
//   if (riskParity.needed) {
//     opportunities.push({
//       action: 'move',
//       from: riskParity.overweight,
//       to: riskParity.underweight,
//       amount: riskParity.amount,
//       reason: 'Risk parity rebalancing',
//       apyGain: 0.5
//     });
//   }
  
//   return opportunities;
// }

// function analyzeYieldCurve(yields: any[]): any {
//   // Simplified yield curve analysis
//   const sorted = yields.sort((a, b) => b.apy - a.apy);
//   if (sorted.length >= 2 && sorted[0].apy - sorted[sorted.length - 1].apy > 3) {
//     return {
//       opportunity: true,
//       from: `${sorted[sorted.length - 1].protocol} (${sorted[sorted.length - 1].chain})`,
//       to: `${sorted[0].protocol} (${sorted[0].chain})`,
//       gain: sorted[0].apy - sorted[sorted.length - 1].apy
//     };
//   }
//   return { opportunity: false };
// }

// function calculateRiskParity(positions: any[]): any {
//   // Simplified risk parity calculation
//   const totalRisk = positions.reduce((sum, p) => sum + p.risk * p.value, 0);
//   const avgRisk = totalRisk / positions.reduce((sum, p) => sum + p.value, 0);
  
//   const overweight = positions.find(p => p.risk > avgRisk * 1.5);
//   const underweight = positions.find(p => p.risk < avgRisk * 0.5);
  
//   if (overweight && underweight) {
//     return {
//       needed: true,
//       overweight: `${overweight.protocol} (${overweight.chain})`,
//       underweight: `${underweight.protocol} (${underweight.chain})`,
//       amount: Math.min(overweight.value * 0.3, 20000)
//     };
//   }
  
//   return { needed: false };
// }

// function generateRecommendations(strategies: OptimizationStrategy[], riskTolerance: string): string[] {
//   const recommendations = [];
  
//   // Find best strategy for user's risk tolerance
//   const bestStrategy = strategies.find(s => {
//     if (riskTolerance === 'low' && s.riskLevel === 'low') return true;
//     if (riskTolerance === 'medium' && s.riskLevel === 'medium') return true;
//     if (riskTolerance === 'high' && s.riskLevel === 'high') return true;
//     return false;
//   }) || strategies[0];
  
//   recommendations.push(
//     `Based on your ${riskTolerance} risk tolerance, we recommend the ${bestStrategy.name}`
//   );
  
//   if (bestStrategy.monthlyGain > 100) {
//     recommendations.push(
//       `This strategy could earn you an additional $${bestStrategy.monthlyGain.toFixed(0)} per month`
//     );
//   }
  
//   if (strategies.some(s => s.gasEstimate < 20)) {
//     recommendations.push(
//       'Current gas prices are favorable for rebalancing'
//     );
//   }
  
//   return recommendations;
// }

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userAddress, currentPositions } = req.body;

  try {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const optimizationPlan = {
      currentAPY: 8.2,
      optimizedAPY: 15.7,
      actions: [
        {
          type: 'withdraw',
          protocol: 'Compound',
          chain: 'ethereum',
          amount: 5000
        },
        {
          type: 'bridge',
          fromChain: 'ethereum',
          toChain: 'arbitrum',
          amount: 5000,
          estimatedTime: 300
        },
        {
          type: 'deposit',
          protocol: 'GMX',
          chain: 'arbitrum',
          amount: 5000
        }
      ],
      estimatedGas: 0.023,
      estimatedProfit: 365,
      confidence: 92
    };

    res.json({ success: true, plan: optimizationPlan });
  } catch (error) {
    res.status(500).json({ error: 'Optimization failed' });
  }
}