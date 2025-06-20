// hooks/useYieldMaxData.ts
import { useContractRead } from 'wagmi';
import { useEffect } from 'react';

export function useYieldMaxData() {
  // Poll for updates every 30 seconds
  const { data: totalAssets, refetch: refetchAssets } = useContractRead({
    address: CONTRACTS.sepolia.vault,
    abi: VaultABI,
    functionName: 'totalAssets',
  });

  const { data: currentAPY, refetch: refetchAPY } = useContractRead({
    address: CONTRACTS.sepolia.vault,
    abi: VaultABI,
    functionName: 'getCurrentAPY',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetchAssets();
      refetchAPY();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchAssets, refetchAPY]);

  return { totalAssets, currentAPY };
}