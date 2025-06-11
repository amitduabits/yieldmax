// hooks/useYieldMaxVault.ts
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { CONTRACTS, VAULT_ABI, ERC20_ABI } from '@/config'
import { useState } from 'react'

export function useYieldMaxVault() {
  const { address, chain } = useAccount()
  const [isApproving, setIsApproving] = useState(false)
  
  const chainId = chain?.id as keyof typeof CONTRACTS
  const contracts = CONTRACTS[chainId] || CONTRACTS[11155111] // Default to Sepolia

  // Read user's USDC balance
  const { data: usdcBalance } = useReadContract({
    address: contracts.usdc as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Read user's vault shares
  const { data: vaultShares } = useReadContract({
    address: contracts.vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Read total assets in vault
  const { data: totalAssets } = useReadContract({
    address: contracts.vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
  })

  // Read total supply of shares
  const { data: totalSupply } = useReadContract({
    address: contracts.vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'totalSupply',
  })

  // Read yield earned per share
  const { data: yieldPerShare } = useReadContract({
    address: contracts.vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'getYieldEarnedPerShare',
  })

  // Read last harvest time
  const { data: lastHarvest } = useReadContract({
    address: contracts.vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'lastHarvest',
  })

  // Contract write hooks
  const { writeContract: approve, data: approveHash } = useWriteContract()
  const { writeContract: deposit, data: depositHash } = useWriteContract()
  const { writeContract: redeem, data: redeemHash } = useWriteContract()
  const { writeContract: harvest, data: harvestHash } = useWriteContract()

  // Transaction receipts
  const { isLoading: isApproveTxLoading } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isLoading: isDepositTxLoading } = useWaitForTransactionReceipt({ hash: depositHash })
  const { isLoading: isRedeemTxLoading } = useWaitForTransactionReceipt({ hash: redeemHash })
  const { isLoading: isHarvestTxLoading } = useWaitForTransactionReceipt({ hash: harvestHash })

  const handleDeposit = async (amount: string) => {
    if (!amount || !address) return

    const amountWei = parseUnits(amount, 6) // USDC has 6 decimals
    setIsApproving(true)

    try {
      // First approve
      await approve({
        address: contracts.usdc as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contracts.vault as `0x${string}`, amountWei],
      })

      // Wait a bit for approval to be confirmed
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Then deposit
      await deposit({
        address: contracts.vault as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [amountWei],
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleRedeem = async (shares: string) => {
    if (!shares || !address) return

    const sharesWei = parseUnits(shares, 6)
    
    await redeem({
      address: contracts.vault as `0x${string}`,
      abi: VAULT_ABI,
      functionName: 'redeem',
      args: [sharesWei],
    })
  }

  const handleHarvest = async () => {
    if (!address) return

    await harvest({
      address: contracts.vault as `0x${string}`,
      abi: VAULT_ABI,
      functionName: 'harvest',
    })
  }

  // Calculate share price
  const sharePrice = totalAssets && totalSupply && Number(totalSupply) > 0
    ? Number(formatUnits(totalAssets, 6)) / Number(formatUnits(totalSupply, 6))
    : 1

  // Calculate user's position value
  const userPositionValue = vaultShares && sharePrice
    ? Number(formatUnits(vaultShares, 6)) * sharePrice
    : 0

  return {
    // Balances
    usdcBalance: usdcBalance ? formatUnits(usdcBalance, 6) : '0',
    vaultShares: vaultShares ? formatUnits(vaultShares, 6) : '0',
    userPositionValue: userPositionValue.toFixed(2),
    
    // Vault stats
    totalAssets: totalAssets ? formatUnits(totalAssets, 6) : '0',
    totalSupply: totalSupply ? formatUnits(totalSupply, 6) : '0',
    sharePrice: sharePrice.toFixed(4),
    yieldPerShare: yieldPerShare ? formatUnits(yieldPerShare, 6) : '0',
    lastHarvest: lastHarvest ? new Date(Number(lastHarvest) * 1000).toLocaleString() : 'Never',
    
    // Actions
    handleDeposit,
    handleRedeem,
    handleHarvest,
    
    // Loading states
    isApproving: isApproving || isApproveTxLoading,
    isDepositing: isDepositTxLoading,
    isRedeeming: isRedeemTxLoading,
    isHarvesting: isHarvestTxLoading,
    
    // Contract addresses
    vaultAddress: contracts.vault,
    usdcAddress: contracts.usdc,
  }
}