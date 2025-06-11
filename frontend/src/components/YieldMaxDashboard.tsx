// frontend/src/components/YieldMaxDashboard.tsx
import React, { useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useAccount, useNetwork, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { CONTRACTS, VAULT_ABI, ERC20_ABI } from '../config/contracts';

export const YieldMaxDashboard = () => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [depositAmount, setDepositAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Determine current network
  const networkKey = chain?.id === 11155111 ? 'sepolia' : 
                    chain?.id === 421614 ? 'arbitrumSepolia' : 
                    'sepolia'; // default

  const vaultAddress = CONTRACTS[networkKey].YieldMaxVault;
  const usdcAddress = CONTRACTS[networkKey].USDC;

  // Read vault data
  const { data: totalAssets } = useContractRead({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
    watch: true,
  });

  const { data: totalShares } = useContractRead({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'totalShares',
    watch: true,
  });

  const { data: userShares } = useContractRead({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: [address!],
    enabled: !!address,
    watch: true,
  });

  const { data: usdcBalance } = useContractRead({
    address: usdcAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    enabled: !!address,
    watch: true,
  });

  const { data: allowance } = useContractRead({
    address: usdcAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, vaultAddress as `0x${string}`],
    enabled: !!address,
    watch: true,
  });

  // Prepare transactions
  const depositAmountParsed = depositAmount ? parseUnits(depositAmount, 6) : 0n;
  const needsApproval = allowance !== undefined && depositAmountParsed > allowance;

  const { config: approveConfig } = usePrepareContractWrite({
    address: usdcAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [vaultAddress as `0x${string}`, depositAmountParsed],
    enabled: needsApproval && depositAmountParsed > 0n,
  });

  const { write: approve, data: approveTx } = useContractWrite(approveConfig);
  const { isLoading: isApprovePending } = useWaitForTransaction({
    hash: approveTx?.hash,
    onSuccess: () => {
      setIsApproving(false);
    },
  });

  const { config: depositConfig } = usePrepareContractWrite({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'deposit',
    args: [depositAmountParsed, address!],
    enabled: !needsApproval && depositAmountParsed > 0n && !!address,
  });

  const { write: deposit, data: depositTx } = useContractWrite(depositConfig);
  const { isLoading: isDepositPending } = useWaitForTransaction({
    hash: depositTx?.hash,
    onSuccess: () => {
      setDepositAmount('');
    },
  });

  // Calculate user's value
  const userValue = userShares && totalAssets && totalShares && totalShares > 0n
    ? (userShares * totalAssets) / totalShares
    : 0n;

  // Format values
  const totalValueLocked = totalAssets ? formatUnits(totalAssets, 6) : '0';
  const userValueFormatted = formatUnits(userValue, 6);
  const userSharesFormatted = userShares ? userShares.toString() : '0';
  const usdcBalanceFormatted = usdcBalance ? formatUnits(usdcBalance, 6) : '0';

  const handleDeposit = async () => {
    if (needsApproval && approve) {
      setIsApproving(true);
      approve();
    } else if (deposit) {
      deposit();
    }
  };

  const isLoading = isApprovePending || isDepositPending || isApproving;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold">YieldMax</h1>
            <ConnectKitButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isConnected ? (
          <>
            {/* Network Info */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-sm">
                Connected to: <strong>{chain?.name || 'Unknown'}</strong>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Vault: {vaultAddress}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Value Locked</h3>
                <p className="text-2xl font-bold mt-2">${totalValueLocked}</p>
                <p className="text-xs text-gray-500 mt-1">USDC</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Your Position</h3>
                <p className="text-2xl font-bold mt-2">${userValueFormatted}</p>
                <p className="text-xs text-gray-500 mt-1">{userSharesFormatted} shares</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Your USDC Balance</h3>
                <p className="text-2xl font-bold mt-2">{usdcBalanceFormatted}</p>
                <p className="text-xs text-gray-500 mt-1">Available to deposit</p>
              </div>
            </div>

            {/* Deposit Form */}
            <div className="bg-white rounded-lg shadow p-6 max-w-md">
              <h2 className="text-lg font-semibold mb-4">Deposit USDC</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Balance: {usdcBalanceFormatted} USDC
                  </p>
                </div>
                
                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || Number(depositAmount) <= 0 || isLoading || Number(depositAmount) > Number(usdcBalanceFormatted)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Processing...' : needsApproval ? 'Approve USDC' : 'Deposit'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Welcome to YieldMax</h2>
            <p className="text-gray-600 mb-8">Connect your wallet to get started</p>
            <ConnectKitButton />
          </div>
        )}
      </main>
    </div>
  );
};