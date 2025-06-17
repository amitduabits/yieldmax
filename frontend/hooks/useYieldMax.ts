// hooks/useYieldMax.ts
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useProvider, useSigner } from 'wagmi';
import { CONTRACTS, VAULT_ABI, ERC20_ABI } from '../lib/contracts/addresses';

export function useYieldMax() {
  const { address, isConnected } = useAccount();
  const provider = useProvider();
  const { data: signer } = useSigner();
  
  const [vaultData, setVaultData] = useState({
    totalAssets: '0',
    totalShares: '0',
    userShares: '0',
    userBalance: '0',
    allowance: '0',
    lastRebalance: 0,
    isLoading: true,
  });
  
  const [txStatus, setTxStatus] = useState({
    isLoading: false,
    error: null as string | null,
    success: false,
  });

  // Get contract instances
  const getContracts = () => {
    const vaultAddress = CONTRACTS.sepolia.YieldMaxVault;
    const usdcAddress = CONTRACTS.sepolia.USDC;
    
    if (!provider) return null;

    const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, provider);
    const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, provider);
    
    return { vaultContract, usdcContract, vaultAddress, usdcAddress };
  };

  // Fetch vault data
  const fetchVaultData = async () => {
    if (!isConnected || !address) {
      setVaultData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const contracts = getContracts();
    if (!contracts) {
      setVaultData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { vaultContract, usdcContract, vaultAddress } = contracts;

      const [
        totalAssets,
        totalShares,
        userShares,
        userBalance,
        allowance,
        lastRebalance,
      ] = await Promise.all([
        vaultContract.totalAssets(),
        vaultContract.totalShares(),
        vaultContract.getUserShares(address),
        usdcContract.balanceOf(address),
        usdcContract.allowance(address, vaultAddress),
        vaultContract.lastRebalance(),
      ]);

      setVaultData({
        totalAssets: ethers.utils.formatUnits(totalAssets, 6),
        totalShares: ethers.utils.formatUnits(totalShares, 6),
        userShares: ethers.utils.formatUnits(userShares, 6),
        userBalance: ethers.utils.formatUnits(userBalance, 6),
        allowance: ethers.utils.formatUnits(allowance, 6),
        lastRebalance: lastRebalance.toNumber(),
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching vault data:', error);
      setVaultData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Deposit function
  const deposit = async (amount: string) => {
    if (!signer || !address) throw new Error('Wallet not connected');

    const contracts = getContracts();
    if (!contracts) throw new Error('Contracts not available');

    setTxStatus({ isLoading: true, error: null, success: false });

    try {
      const { vaultContract, usdcContract, vaultAddress } = contracts;
      const vaultWithSigner = vaultContract.connect(signer);
      const usdcWithSigner = usdcContract.connect(signer);

      const amountWei = ethers.utils.parseUnits(amount, 6);

      // Approve USDC
      const approveTx = await usdcWithSigner.approve(vaultAddress, amountWei);
      await approveTx.wait();

      // Deposit
      const depositTx = await vaultWithSigner.deposit(amountWei, address);
      await depositTx.wait();

      setTxStatus({ isLoading: false, error: null, success: true });
      await fetchVaultData();
      return depositTx;
    } catch (error: any) {
      setTxStatus({ 
        isLoading: false, 
        error: error.message || 'Deposit failed', 
        success: false 
      });
      throw error;
    }
  };

  // Withdraw function
  const withdraw = async (shares: string) => {
    if (!signer || !address) throw new Error('Wallet not connected');

    const contracts = getContracts();
    if (!contracts) throw new Error('Contracts not available');

    setTxStatus({ isLoading: true, error: null, success: false });

    try {
      const { vaultContract } = contracts;
      const vaultWithSigner = vaultContract.connect(signer);

      const sharesWei = ethers.utils.parseUnits(shares, 6);

      const withdrawTx = await vaultWithSigner.withdraw(sharesWei);
      await withdrawTx.wait();

      setTxStatus({ isLoading: false, error: null, success: true });
      await fetchVaultData();
      return withdrawTx;
    } catch (error: any) {
      setTxStatus({ 
        isLoading: false, 
        error: error.message || 'Withdrawal failed', 
        success: false 
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchVaultData();
  }, [isConnected, address]);

  return {
    vaultData,
    txStatus,
    deposit,
    withdraw,
    refreshData: fetchVaultData,
    isConnected,
    address,
  };
}