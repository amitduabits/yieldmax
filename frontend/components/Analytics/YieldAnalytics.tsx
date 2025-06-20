// components/Analytics/YieldAnalytics.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useState, useEffect } from 'react';

export function YieldAnalytics() {
  const [historicalData, setHistoricalData] = useState([]);
  const [strategies, setStrategies] = useState([]);

  // Fetch all available strategies
  const { data: strategyCount } = useContractRead({
    address: CONTRACTS.sepolia.aiOptimizer,
    abi: OptimizerABI,
    functionName: 'strategyCount',
  });

  useEffect(() => {
    if (strategyCount) {
      fetchAllStrategies(Number(strategyCount));
    }
  }, [strategyCount]);

  const fetchAllStrategies = async (count: number) => {
    const strategies = [];
    for (let i = 0; i < count; i++) {
      const strategy = await readContract({
        address: CONTRACTS.sepolia.aiOptimizer,
        abi: OptimizerABI,
        functionName: 'getStrategy',
        args: [i],
      });
      strategies.push({ id: i, ...strategy });
    }
    setStrategies(strategies);
  };

  return (
    <div className="analytics-container">
      <h2>Yield Optimization Analytics</h2>
      
      {/* Strategy Comparison */}
      <div className="strategy-comparison">
        <h3>Available Strategies</h3>
        <div className="strategy-grid">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="strategy-card">
              <h4>{strategy.name}</h4>
              <div className="apy-display">
                {(Number(strategy.expectedAPY) / 100).toFixed(2)}%
              </div>
              <div className="risk-meter">
                <div 
                  className="risk-fill" 
                  style={{ width: `${strategy.riskScore}%` }}
                />
              </div>
              <p>Risk: {strategy.riskScore}/100</p>
              <p>Chain: {getChainName(strategy.chainId)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="performance-chart">
        <h3>Historical Performance</h3>
        <LineChart width={800} height={400} data={historicalData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="apy" stroke="#8884d8" />
          <Line type="monotone" dataKey="totalValue" stroke="#82ca9d" />
        </LineChart>
      </div>
    </div>
  );
}