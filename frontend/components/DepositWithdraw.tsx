// components/DepositWithdraw.tsx
export function DepositWithdraw() {
  const [amount, setAmount] = useState('');
  const { address } = useAccount();

  const { write: deposit } = useContractWrite({
    address: CONTRACTS.sepolia.vault,
    abi: VaultABI,
    functionName: 'deposit',
  });

  const { write: withdraw } = useContractWrite({
    address: CONTRACTS.sepolia.vault,
    abi: VaultABI,
    functionName: 'withdraw',
  });

  const handleDeposit = async () => {
    const assets = parseUnits(amount, 6); // USDC has 6 decimals
    deposit({ args: [assets, address] });
  };

  const handleWithdraw = async () => {
    const shares = parseUnits(amount, 6);
    withdraw({ args: [shares, address, address] });
  };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
      />
      <button onClick={handleDeposit}>Deposit</button>
      <button onClick={handleWithdraw}>Withdraw</button>
    </div>
  );
}