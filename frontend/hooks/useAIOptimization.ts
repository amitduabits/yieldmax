// // hooks/useAIOptimization.ts
// import { useState, useEffect, useCallback } from 'react';
// import { useAccount, useContractWrite, useContractRead } from 'wagmi';
// import { ethers } from 'ethers';
// import { toast } from 'react-toastify';

// interface AIRecommendation {
//   action: 'rebalance' | 'deposit' | 'withdraw';
//   fromProtocol: string;
//   toProtocol: string;
//   fromChain: string;
//   toChain: string;
//   amount: string;
//   expectedGain: number;
//   confidence: number;
//   gasEstimate: string;
//   netProfit: string;
// }

// interface OptimizationResult {
//   success: boolean;
//   txHash?: string;
//   profit?: number;
//   error?: string;
// }

// export const useAIOptimization = () => {
//   const { address, isConnected } = useAccount();
//   const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
//   const [isOptimizing, setIsOptimizing] = useState(false);
//   const [profitEstimate, setProfitEstimate] = useState(0);
//   const [isAnalyzing, setIsAnalyzing] = useState(false);

//   // Poll for AI recommendations
//   useEffect(() => {
//     if (!isConnected || !address) return;

//     const checkForOpportunities = async () => {
//       try {
//         setIsAnalyzing(true);
//         const response = await fetch('/api/ai/recommend', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ 
//             userAddress: address,
//             currentPositions: await getUserPositions(address)
//           })
//         });

//         if (!response.ok) throw new Error('Failed to get AI recommendation');

//         const data = await response.json();
        
//         if (data.recommendation && data.recommendation.expectedGain > 0.5) {
//           setAiRecommendation(data.recommendation);
//           setProfitEstimate(data.recommendation.expectedGain);
          
//           // Show notification
//           toast.info(`💡 AI found +${data.recommendation.expectedGain.toFixed(2)}% opportunity!`, {
//             position: "top-right",
//             autoClose: 5000,
//           });
//         }
//       } catch (error) {
//         console.error('AI analysis error:', error);
//       } finally {
//         setIsAnalyzing(false);
//       }
//     };

//     // Check immediately
//     checkForOpportunities();

//     // Then check every 30 seconds
//     const interval = setInterval(checkForOpportunities, 30000);

//     return () => clearInterval(interval);
//   }, [address, isConnected]);

//   const executeStrategy = useCallback(async (): Promise<OptimizationResult> => {
//     if (!aiRecommendation || !address) {
//       return { success: false, error: 'No recommendation available' };
//     }

//     setIsOptimizing(true);

//     try {
//       // Step 1: Approve tokens if needed
//       if (aiRecommendation.action === 'rebalance') {
//         const approvalTx = await approveTokens(
//           aiRecommendation.fromProtocol,
//           aiRecommendation.amount
//         );
        
//         if (!approvalTx.success) {
//           throw new Error('Token approval failed');
//         }
//       }

//       // Step 2: Execute the strategy
//       const response = await fetch('/api/ai/execute', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           recommendation: aiRecommendation,
//           userAddress: address,
//         })
//       });

//       if (!response.ok) throw new Error('Execution failed');

//       const result = await response.json();

//       // Step 3: Monitor transaction
//       const txReceipt = await waitForTransaction(result.txHash);

//       if (txReceipt.status === 1) {
//         // Success! Calculate actual profit
//         const actualProfit = await calculateActualProfit(txReceipt);
        
//         toast.success(`✅ Strategy executed! Profit: $${actualProfit.toFixed(2)}`, {
//           position: "top-center",
//           autoClose: 7000,
//         });

//         // Clear recommendation after success
//         setAiRecommendation(null);

//         return {
//           success: true,
//           txHash: result.txHash,
//           profit: actualProfit
//         };
//       } else {
//         throw new Error('Transaction failed');
//       }

//     } catch (error: any) {
//       console.error('Strategy execution error:', error);
//       toast.error(`❌ Execution failed: ${error.message}`, {
//         position: "top-center",
//         autoClose: 5000,
//       });

//       return {
//         success: false,
//         error: error.message
//       };
//     } finally {
//       setIsOptimizing(false);
//     }
//   }, [aiRecommendation, address]);

//   const dismissRecommendation = useCallback(() => {
//     setAiRecommendation(null);
//     setProfitEstimate(0);
//   }, []);

//   const requestImmediateAnalysis = useCallback(async () => {
//     if (!address) return;

//     setIsAnalyzing(true);
//     try {
//       const response = await fetch('/api/ai/analyze-now', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ userAddress: address })
//       });

//       const data = await response.json();
      
//       if (data.opportunities.length > 0) {
//         const bestOpp = data.opportunities[0];
//         setAiRecommendation(bestOpp);
//         setProfitEstimate(bestOpp.expectedGain);
//       } else {
//         toast.info('No immediate opportunities found. AI is monitoring...', {
//           position: "top-right",
//           autoClose: 3000,
//         });
//       }
//     } catch (error) {
//       console.error('Immediate analysis error:', error);
//     } finally {
//       setIsAnalyzing(false);
//     }
//   }, [address]);

//   return {
//     aiRecommendation,
//     isOptimizing,
//     isAnalyzing,
//     profitEstimate,
//     executeStrategy,
//     dismissRecommendation,
//     requestImmediateAnalysis,
//   };
// };

// // Helper functions
// async function getUserPositions(address: string) {
//   const response = await fetch(`/api/portfolio?address=${address}`);
//   const data = await response.json();
//   return data.positions || [];
// }

// async function approveTokens(tokenAddress: string, amount: string) {
//   // Implementation for token approval
//   // This would interact with the smart contract
//   return { success: true };
// }

// async function waitForTransaction(txHash: string) {
//   const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
//   return await provider.waitForTransaction(txHash);
// }

// async function calculateActualProfit(txReceipt: any) {
//   // Calculate actual profit from transaction events
//   // This is simplified - real implementation would parse events
//   return Math.random() * 100 + 50; // Mock profit between $50-150
// }

// // Hook for Chainlink Automation status
// export const useChainlinkAutomation = () => {
//   const [isActive, setIsActive] = useState(false);
//   const [lastExecution, setLastExecution] = useState<Date | null>(null);
//   const [upkeepId, setUpkeepId] = useState<string | null>(null);

//   useEffect(() => {
//     // Check automation status
//     const checkAutomation = async () => {
//       try {
//         const response = await fetch('/api/chainlink/automation-status');
//         const data = await response.json();
        
//         setIsActive(data.isActive);
//         setLastExecution(data.lastExecution ? new Date(data.lastExecution) : null);
//         setUpkeepId(data.upkeepId);
//       } catch (error) {
//         console.error('Failed to check automation status:', error);
//       }
//     };

//     checkAutomation();
//     const interval = setInterval(checkAutomation, 60000); // Check every minute

//     return () => clearInterval(interval);
//   }, []);

//   const toggleAutomation = async () => {
//     try {
//       const response = await fetch('/api/chainlink/toggle-automation', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ enable: !isActive })
//       });

//       const data = await response.json();
//       setIsActive(data.isActive);
      
//       toast.success(
//         `Automation ${data.isActive ? 'enabled' : 'disabled'}! ` +
//         `${data.isActive ? 'Your yields will be optimized 24/7' : 'Manual mode activated'}`,
//         { position: "top-center", autoClose: 3000 }
//       );
//     } catch (error) {
//       console.error('Failed to toggle automation:', error);
//       toast.error('Failed to toggle automation', { position: "top-center" });
//     }
//   };

//   return {
//     isActive,
//     lastExecution,
//     upkeepId,
//     toggleAutomation
//   };
// };

import { useContractRead, useContractWrite } from 'wagmi';
import { MAINNET_CONTRACTS } from '../config/contracts';
import AIOptimizerABI from '../config/abi/AIOptimizer.json';

export const useAIOptimization = () => {
  const { chain } = useNetwork();
  const network = getNetworkName(chain?.id);
  
  const { data: optimalYield } = useContractRead({
    address: MAINNET_CONTRACTS[network]?.aiOptimizer,
    abi: AIOptimizerABI,
    functionName: 'getOptimalYield',
    args: [MAINNET_CONTRACTS[network]?.yieldMaxVault],
    watch: true,
    cacheTime: 30_000, // 30 seconds
  });
  
  const { write: requestOptimization } = useContractWrite({
    address: MAINNET_CONTRACTS[network]?.aiOptimizer,
    abi: AIOptimizerABI,
    functionName: 'requestOptimization',
    onSuccess: (data) => {
      console.log('Optimization requested:', data.hash);
    }
  });
  
  return {
    optimalYield: optimalYield ? Number(optimalYield) / 100 : null,
    requestOptimization,
    isLoading: !optimalYield
  };
};