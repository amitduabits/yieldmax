// frontend/src/hooks/useYieldMaxVault.ts
import { useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACTS, VAULT_ABI, ERC20_ABI } from '../config/contracts';
import { useNetwork } from 'wagmi';

export const useYieldMaxVault = () => {
  const { chain } = useNetwork();
  const chainName = chain?.network === 'sepolia' ? 'sepolia' : 'arbitrumSepolia';
  const vaultAddress = CONTRACTS[chainName]?.YieldMaxVault;
  const usdcAddress = CONTRACTS[chainName]?.USDC;

  // Read vault data
  const { data: totalAssets } = useContractRead({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
    watch: true,
  });

  const { data: totalShares } = useContractRead({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'totalShares',
    watch: true,
  });

  // Prepare deposit
  const { config: depositConfig } = usePrepareContractWrite({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'deposit',
    enabled: false, // Enable when needed
  });

  const { write: deposit, data: depositTx } = useContractWrite(depositConfig);
  
  const { isLoading: isDepositing, isSuccess: depositSuccess } = useWaitForTransaction({
    hash: depositTx?.hash,
  });

  // Prepare USDC approval
  const { config: approveConfig } = usePrepareContractWrite({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    enabled: false,
  });

  const { write: approve, data: approveTx } = useContractWrite(approveConfig);

  // Calculate current APY (mock for now, will add real yield data later)
  const currentAPY = totalAssets && totalShares && totalAssets > 0n
    ? Number((totalAssets * 10000n) / totalShares - 10000n) / 100
    : 0;

  return {
    totalAssets: totalAssets ? formatUnits(totalAssets, 6) : '0',
    totalShares: totalShares ? totalShares.toString() : '0',
    currentAPY,
    deposit,
    approve,
    isDepositing,
    depositSuccess,
  };
};