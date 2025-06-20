// components/StrategyDisplay.tsx
export function StrategyDisplay() {
  const { data: currentStrategyId } = useContractRead({
    address: CONTRACTS.sepolia.vault,
    abi: VaultABI,
    functionName: 'currentStrategyId',
  });

  const { data: strategy } = useContractRead({
    address: CONTRACTS.sepolia.aiOptimizer,
    abi: OptimizerABI,
    functionName: 'getStrategy',
    args: [currentStrategyId || 0],
    enabled: currentStrategyId !== undefined,
  });

  if (!strategy) return <div>Loading strategy...</div>;

  return (
    <div className="strategy-card">
      <h3>Current Strategy</h3>
      <p>Protocol: {strategy.name}</p>
      <p>Chain: {getChainName(strategy.chainId)}</p>
      <p>Expected APY: {(Number(strategy.expectedAPY) / 100).toFixed(2)}%</p>
      <p>Risk Score: {strategy.riskScore}/100</p>
    </div>
  );
}