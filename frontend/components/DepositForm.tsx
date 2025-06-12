// frontend/src/components/DepositForm.tsx
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { useYieldMaxVault } from '../frontend/hooks/useYieldMaxVault';

export const DepositForm = () => {
  const [amount, setAmount] = useState('');
  const { address } = useAccount();
  const { deposit, approve, isDepositing } = useYieldMaxVault();
  
  const handleDeposit = async () => {
    if (!amount || !address) return;
    
    try {
      // First approve USDC
      const parsedAmount = parseUnits(amount, 6); // USDC has 6 decimals
      await approve({
        args: [CONTRACTS.sepolia.YieldMaxVault, parsedAmount],
      });
      
      // Then deposit
      await deposit({
        args: [parsedAmount, address],
      });
      
      setAmount('');
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };
  
  return (
    <div>
      <input
        type="number"
        placeholder="Amount USDC"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleDeposit} disabled={isDepositing}>
        {isDepositing ? 'Depositing...' : 'Deposit'}
      </button>
    </div>
  );
};