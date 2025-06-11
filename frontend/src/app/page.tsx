// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { formatUnits, parseUnits } from 'viem'
import { CONTRACTS } from '@/config/contracts'
import { VAULT_ABI, ERC20_ABI } from '@/config/abi'

export default function Home() {
  const { address, chain } = useAccount()
  const [depositAmount, setDepositAmount] = useState('')
  const [redeemAmount, setRedeemAmount] = useState('')

  // Get contracts for current chain, with fallback
  const chainId = chain?.id || 11155111 // Default to Sepolia
  const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS] || CONTRACTS[11155111]

  // Read user's USDC balance
  const { data: usdcBalance } = useReadContract({
    address: contracts?.usdc as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address && !!contracts,
  })

  // Read user's vault shares
  const { data: vaultShares } = useReadContract({
    address: contracts?.vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address && !!contracts,
  })

  // Read total assets in vault
  const { data: totalAssets } = useReadContract({
    address: contracts?.vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
    enabled: !!contracts,
  })

  // Read yield earned per share
  const { data: yieldPerShare } = useReadContract({
    address: contracts?.vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'getYieldEarnedPerShare',
    enabled: !!contracts,
  })

  // Read last harvest time
  const { data: lastHarvest } = useReadContract({
    address: contracts?.vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'lastHarvest',
    enabled: !!contracts,
  })

  // Contract write hooks
  const { writeContract: approve, data: approveHash } = useWriteContract()
  const { writeContract: deposit, data: depositHash } = useWriteContract()
  const { writeContract: redeem, data: redeemHash } = useWriteContract()
  const { writeContract: harvest, data: harvestHash } = useWriteContract()

  // Transaction receipts
  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isLoading: isDepositing } = useWaitForTransactionReceipt({ hash: depositHash })
  const { isLoading: isRedeeming } = useWaitForTransactionReceipt({ hash: redeemHash })
  const { isLoading: isHarvesting } = useWaitForTransactionReceipt({ hash: harvestHash })

  // const handleDeposit = async () => {
  //   if (!depositAmount || !contracts) return

  //   const amount = parseUnits(depositAmount, 6) // USDC has 6 decimals

  //   try {
  //     // First approve
  //     await approve({
  //       address: contracts.usdc as `0x${string}`,
  //       abi: ERC20_ABI,
  //       functionName: 'approve',
  //       args: [contracts.vault as `0x${string}`, amount],
  //     })

  //     // Wait for approval then deposit
  //     setTimeout(() => {
  //       deposit({
  //         address: contracts.vault as `0x${string}`,
  //         abi: VAULT_ABI,
  //         functionName: 'deposit',
  //         args: [amount],
  //       })
  //     }, 2000)
  //   } catch (error) {
  //     console.error('Deposit error:', error)
  //   }
  // }
  // Updated deposit function for app/page.tsx
  // const handleDeposit = async () => {
  //   if (!depositAmount || !contracts) return

  //   try {
  //     const amount = parseUnits(depositAmount, 6) // USDC has 6 decimals

  //     // Check current allowance first
  //     const currentAllowance = await readContract(config, {
  //       address: contracts.usdc as `0x${string}`,
  //       abi: ERC20_ABI,
  //       functionName: 'allowance',
  //       args: [address as `0x${string}`, contracts.vault as `0x${string}`],
  //     })

  //     console.log('Current allowance:', formatUnits(currentAllowance || 0n, 6))
  //     console.log('Deposit amount:', depositAmount)

  //     // Only approve if needed
  //     if (!currentAllowance || currentAllowance < amount) {
  //       console.log('Approving USDC...')
  //       const approveHash = await writeContract(config, {
  //         address: contracts.usdc as `0x${string}`,
  //         abi: ERC20_ABI,
  //         functionName: 'approve',
  //         args: [contracts.vault as `0x${string}`, amount],
  //       })

  //       console.log('Approval tx:', approveHash)

  //       // Wait for approval confirmation
  //       const approveReceipt = await waitForTransactionReceipt(config, {
  //         hash: approveHash,
  //       })

  //       if (approveReceipt.status !== 'success') {
  //         throw new Error('Approval failed')
  //       }

  //       console.log('Approval confirmed!')
  //     }

  //     // Now deposit
  //     console.log('Depositing to vault...')
  //     const depositHash = await writeContract(config, {
  //       address: contracts.vault as `0x${string}`,
  //       abi: VAULT_ABI,
  //       functionName: 'deposit',
  //       args: [amount, address as `0x${string}`], // Note: ERC4626 deposit takes (assets, receiver)
  //     })

  //     console.log('Deposit tx:', depositHash)

  //     // Clear input after successful transaction
  //     setDepositAmount('')

  //   } catch (error: any) {
  //     console.error('Deposit error:', error)
  //     alert(`Transaction failed: ${error.message || 'Unknown error'}`)
  //   }
  // }

  // Updated handleDeposit function for app/page.tsx
  const handleDeposit = async () => {
    if (!depositAmount || !contracts || !address) return

    const amount = parseUnits(depositAmount, 6) // USDC has 6 decimals

    try {
      // First approve
      console.log('Approving USDC...')
      await approve({
        address: contracts.usdc as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contracts.vault as `0x${string}`, amount],
      })

      // Wait for approval to be confirmed
      setTimeout(async () => {
        console.log('Depositing to vault...')
        console.log('Amount:', amount.toString())
        console.log('Receiver:', address)

        try {
          await deposit({
            address: contracts.vault as `0x${string}`,
            abi: VAULT_ABI,
            functionName: 'deposit',
            args: [amount, address as `0x${string}`], // assets, receiver
            // Add gas limit to avoid estimation issues
            gas: 200000n,
          })

          // Clear input on success
          setDepositAmount('')
        } catch (depositError) {
          console.error('Deposit transaction failed:', depositError)
        }
      }, 3000) // Wait 3 seconds for approval
    } catch (error) {
      console.error('Approval error:', error)
    }
  }
  // const handleRedeem = async () => {
  //   if (!redeemAmount || !contracts) return

  //   const shares = parseUnits(redeemAmount, 6)

  //   try {
  //     await redeem({
  //       address: contracts.vault as `0x${string}`,
  //       abi: VAULT_ABI,
  //       functionName: 'redeem',
  //       args: [shares],
  //     })
  //   } catch (error) {
  //     console.error('Redeem error:', error)
  //   }
  // }


  // Updated handleRedeem function for app/page.tsx
  const handleRedeem = async () => {
    if (!redeemAmount || !contracts || !address) return

    const shares = parseUnits(redeemAmount, 6)

    try {
      console.log('Redeeming shares...')
      console.log('Shares:', shares.toString())
      console.log('Receiver:', address)
      console.log('Owner:', address)

      await redeem({
        address: contracts.vault as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'redeem',
        args: [
          shares,                    // shares to redeem
          address as `0x${string}`,  // receiver (who gets the USDC)
          address as `0x${string}`   // owner (who owns the shares)
        ],
        // Add gas limit to avoid estimation issues
        gas: 200000n,
      })

      // Clear input on success
      setRedeemAmount('')
    } catch (error) {
      console.error('Redeem error:', error)
    }
  }
  const handleHarvest = async () => {
    if (!contracts) return

    try {
      await harvest({
        address: contracts.vault as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'harvest',
      })
    } catch (error) {
      console.error('Harvest error:', error)
    }
  }

  // Calculate share value
  const shareValue = vaultShares && totalAssets && Number(vaultShares) > 0
    ? (Number(formatUnits(totalAssets, 6)) / Number(formatUnits(vaultShares, 6))).toFixed(4)
    : '1.0000'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <nav className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            YieldMax
          </h1>
          <ConnectButton />
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {!address ? (
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold mb-4">Welcome to YieldMax</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to start earning yield on USDC</p>
          </div>
        ) : !contracts ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Network Not Supported</h2>
            <p className="text-gray-400">Please switch to Sepolia or Arbitrum Sepolia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Stats Card */}
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Your Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">USDC Balance:</span>
                  <span className="font-mono">
                    {usdcBalance ? formatUnits(usdcBalance, 6) : '0'} USDC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vault Shares:</span>
                  <span className="font-mono">
                    {vaultShares ? formatUnits(vaultShares, 6) : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Share Value:</span>
                  <span className="font-mono">{shareValue} USDC</span>
                </div>
              </div>
            </div>

            {/* Vault Stats Card */}
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Vault Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Assets:</span>
                  <span className="font-mono">
                    {totalAssets ? formatUnits(totalAssets, 6) : '0'} USDC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Yield Per Share:</span>
                  <span className="font-mono">
                    {yieldPerShare ? formatUnits(yieldPerShare, 6) : '0'} USDC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Harvest:</span>
                  <span className="font-mono">
                    {lastHarvest ? new Date(Number(lastHarvest) * 1000).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Deposit Card */}
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Deposit USDC</h3>
              <input
                type="number"
                placeholder="Amount to deposit"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleDeposit}
                disabled={isApproving || isDepositing || !depositAmount}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg py-2 font-semibold transition-colors"
              >
                {isApproving ? 'Approving...' : isDepositing ? 'Depositing...' : 'Deposit'}
              </button>
            </div>

            {/* Alternative Withdraw Card - With Max Button */}
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Withdraw</h3>

              {/* Show current shares */}
              <div className="text-sm text-gray-400 mb-2">
                Your shares: {vaultShares ? formatUnits(vaultShares, 6) : '0'}
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  placeholder="Shares to redeem"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  className="flex-1 bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setRedeemAmount(vaultShares ? formatUnits(vaultShares, 6) : '0')}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold transition-colors"
                >
                  Max
                </button>
              </div>

              <button
                onClick={handleRedeem}
                disabled={isRedeeming || !redeemAmount || Number(redeemAmount) <= 0}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg py-2 font-semibold transition-colors"
              >
                {isRedeeming ? 'Redeeming...' : 'Redeem'}
              </button>

              {/* Show expected USDC output */}
              {redeemAmount && Number(redeemAmount) > 0 && (
                <div className="text-sm text-gray-400 mt-2">
                  You will receive: ~{(Number(redeemAmount) * Number(shareValue)).toFixed(2)} USDC
                </div>
              )}
            </div>

            {/* Harvest Card (Admin Only) */}
            <div className="md:col-span-2 bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Harvest Yield (Keeper Only)</h3>
              <button
                onClick={handleHarvest}
                disabled={isHarvesting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg py-2 font-semibold transition-colors"
              >
                {isHarvesting ? 'Harvesting...' : 'Harvest Yield'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}