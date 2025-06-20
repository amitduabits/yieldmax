// components/VaultInterface.tsx
export function VaultInterface() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTransaction = async (txFunction: () => Promise<any>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tx = await txFunction();
      toast.info('Transaction submitted!', { autoClose: 3000 });
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast.success('Transaction successful!', { autoClose: 5000 });
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.message || 'Transaction failed');
      toast.error(error, { autoClose: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vault-interface">
      {error && (
        <div className="error-banner">
          <p>❌ {error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Processing transaction...</p>
        </div>
      )}
      
      {/* Rest of your UI */}
    </div>
  );
}