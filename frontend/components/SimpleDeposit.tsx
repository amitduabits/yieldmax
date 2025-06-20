import { useState } from 'react';
import { useAccount, useContractWrite, useContractRead } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS, VAULT_ABI, ERC20_ABI } from '@/config/contracts';

export function SimpleDeposit() {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');

  // Read user's vault balance
  const { data: vaultBalance } = useContractRead({
    address: CONTRACTS.sepolia.vault,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  // Approve USDC
  const { write: approve } = useContractWrite({
    address: CONTRACTS.sepolia.usdc,
    abi: ERC20_ABI,
    functionName: 'approve',
  });

  // Deposit to vault
  const { write: deposit } = useContractWrite({
    address: CONTRACTS.sepolia.vault,
    abi: VAULT_ABI,
    functionName: 'deposit',
  });

  const handleApprove = () => {
    approve?.({ 
      args: [
        CONTRACTS.sepolia.vault, 
        parseUnits('1000000', 6) // Large approval
      ] 
    });
  };

  const handleDeposit = () => {
    if (!amount) return;
    deposit?.({ 
      args: [parseUnits(amount, 6)] // USDC has 6 decimals
    });
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">YieldMax Vault</h2>
      
      <div className="mb-4">
        <p>Your Vault Balance: {vaultBalance ? (Number(vaultBalance) / 1e18).toFixed(4) : '0'} shares</p>
      </div>

      <div className="space-y-4">
        <button 
          onClick={handleApprove}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Step 1: Approve USDC
        </button>

        <input
          type="number"
          placeholder="Amount of USDC"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
        />

        <button 
          onClick={handleDeposit}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
        >
          Step 2: Deposit USDC
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-400">
        <p>✅ Vault: {CONTRACTS.sepolia.vault.slice(0, 6)}...{CONTRACTS.sepolia.vault.slice(-4)}</p>
        <p>🤖 Automation: Active</p>
      </div>
    </div>
  );
}