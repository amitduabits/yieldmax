// hooks/useEnhancedStrategy.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useNetwork } from 'wagmi';
import { ENHANCED_CONTRACTS, ENHANCED_STRATEGY_ABI, VAULT_ABI } from '../contracts/enhanced-contracts';

export const useEnhancedStrategy = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  
  const [strategyData, setStrategyData] = useState({
    currentAPY: 0,
    bestProtocol: '',
    riskScore: 0,
    confidence: 0,
    shouldRebalance: false,
    rebalanceReason: '',
    totalAssets: '0',
    userBalance: '0',
    protocolYields: {
      aave: 0,
      compound: 0,
      yearn: 0,
      curve: 0
    },
    bestYieldProtocol: '',
    bestYieldAPY: 0,
    isLoading: true,
    isDataFresh: false,
    lastUpdate: null
  });

  const [error, setError] = useState(null);

  const getNetworkName = () => {
    if (chain?.id === 11155111) return 'sepolia';
    if (chain?.id === 421614) return 'arbitrumSepolia';
    return 'sepolia'; // Default
  };

  const fetchEnhancedData = async () => {
    try {
      setError(null);
      const networkName = getNetworkName();
      const contracts = ENHANCED_CONTRACTS[networkName];
      
      if (!contracts) {
        throw new Error(`Network ${networkName} not supported`);
      }

      // Get provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Create contract instances
      const strategyEngine = new ethers.Contract(
        contracts.strategyEngine,
        ENHANCED_STRATEGY_ABI,
        provider
      );
      
      const vault = new ethers.Contract(
        contracts.vault,
        VAULT_ABI,
        provider
      );

      // Fetch all data in parallel
      const [
        currentStrategy,
        allYields,
        upkeepCheck,
        contractInfo,
        totalAssets,
        userShares,
        dataFreshness
      ] = await Promise.all([
        strategyEngine.getCurrentStrategy(),
        strategyEngine.getCurrentYields(),
        strategyEngine.checkUpkeep("0x"),
        strategyEngine.getContractInfo(),
        vault.totalAssets(),
        address ? vault.balanceOf(address) : ethers.BigNumber.from(0),
        strategyEngine.isDataFresh()
      ]);

      // Get best yield recommendation
      const bestYield = await strategyEngine.getBestYield(totalAssets);

      // Convert BigNumbers and format data
      const formattedData = {
        currentAPY: Number(currentStrategy.expectedAPY) / 100,
        bestProtocol: currentStrategy.protocolName,
        riskScore: Number(currentStrategy.riskScore),
        confidence: Number(currentStrategy.confidence),
        shouldRebalance: upkeepCheck.shouldRebalance,
        rebalanceReason: upkeepCheck.shouldRebalance ? 'Better opportunity available' : 'Currently optimal',
        totalAssets: ethers.utils.formatUnits(totalAssets, 6),
        userBalance: ethers.utils.formatUnits(userShares, 6),
        protocolYields: {
          aave: Number(allYields.aaveAPY) / 100,
          compound: Number(allYields.compoundAPY) / 100,
          yearn: Number(allYields.yearnAPY) / 100,
          curve: Number(allYields.curveAPY) / 100
        },
        bestYieldProtocol: bestYield.protocol,
        bestYieldAPY: Number(bestYield.expectedAPY) / 100,
        isLoading: false,
        isDataFresh: dataFreshness,
        lastUpdate: new Date().toLocaleTimeString(),
        protocolCount: Number(contractInfo.protocolCount),
        lastRebalanceTime: Number(contractInfo.lastRebalanceTime)
      };

      setStrategyData(formattedData);
      
    } catch (err) {
      console.error('Error fetching enhanced strategy data:', err);
      setError(err.message);
      setStrategyData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Auto-refresh data
  useEffect(() => {
    if (chain) {
      fetchEnhancedData();
      const interval = setInterval(fetchEnhancedData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [chain, address]);

  // Manual refresh function
  const refreshData = () => {
    setStrategyData(prev => ({ ...prev, isLoading: true }));
    fetchEnhancedData();
  };

  // Execute strategy update
  const executeStrategyUpdate = async () => {
    try {
      if (!address) throw new Error('Please connect wallet');
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const networkName = getNetworkName();
      const contracts = ENHANCED_CONTRACTS[networkName];
      
      const strategyEngine = new ethers.Contract(
        contracts.strategyEngine,
        ENHANCED_STRATEGY_ABI,
        signer
      );

      const tx = await strategyEngine.updateStrategy();
      await tx.wait();
      
      // Refresh data after update
      await fetchEnhancedData();
      
      return { success: true, txHash: tx.hash };
    } catch (err) {
      console.error('Error updating strategy:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    ...strategyData,
    error,
    refreshData,
    executeStrategyUpdate,
    networkName: getNetworkName()
  };
};