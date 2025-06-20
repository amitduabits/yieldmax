// components/Notifications/YieldNotifications.tsx
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export function YieldNotifications() {
  const [lastOpportunity, setLastOpportunity] = useState(null);

  const { data: opportunity } = useContractRead({
    address: CONTRACTS.sepolia.aiOptimizer,
    abi: OptimizerABI,
    functionName: 'getVaultOpportunity',
    args: [CONTRACTS.sepolia.vault],
    watch: true, // Enable real-time updates
  });

  useEffect(() => {
    if (opportunity && opportunity.confidence > 75) {
      // Check if this is a new opportunity
      if (!lastOpportunity || 
          opportunity.strategyId !== lastOpportunity.strategyId ||
          opportunity.timestamp !== lastOpportunity.timestamp) {
        
        const improvement = Number(opportunity.projectedAPY - opportunity.currentAPY) / 100;
        
        toast.success(
          `New yield opportunity detected! +${improvement.toFixed(2)}% APY improvement possible`,
          {
            position: "top-right",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
        
        setLastOpportunity(opportunity);
      }
    }
  }, [opportunity, lastOpportunity]);

  return null; // This component only handles notifications
}