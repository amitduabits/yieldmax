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
    // Fix: Use consistent naming
    const vaultAddress = CONTRACTS.sepolia.vault; // Changed from YieldMaxVault
    const usdcAddress = CONTRACTS.sepolia.usdc;
    
    if (!provider) {
      console.error('Provider not available');
      return null;
    }

    try {
      const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, provider);
      const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, provider);
      
      return { vaultContract, usdcContract, vaultAddress, usdcAddress };
    } catch (error) {
      console.error('Error creating contracts:', error);
      return null;
    }
  };

  // Fetch vault data
  const fetchVaultData = async () => {
    if (!isConnected || !address) {
      console.log('Wallet not connected');
      setVaultData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const contracts = getContracts();
    if (!contracts) {
      console.error('Contracts not initialized');
      setVaultData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { vaultContract, usdcContract, vaultAddress } = contracts;

      // Add error handling for each contract call
      const [
        totalAssets,
        totalShares,
        userShares,
        userBalance,
        allowance,
        lastRebalance,
      ] = await Promise.all([
        vaultContract.totalAssets().catch(() => ethers.BigNumber.from(0)),
        vaultContract.totalSupply().catch(() => ethers.BigNumber.from(0)), // Changed from totalShares
        vaultContract.balanceOf(address).catch(() => ethers.BigNumber.from(0)), // Changed from getUserShares
        usdcContract.balanceOf(address).catch(() => ethers.BigNumber.from(0)),
        usdcContract.allowance(address, vaultAddress).catch(() => ethers.BigNumber.from(0)),
        vaultContract.lastRebalance().catch(() => ethers.BigNumber.from(0)),
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

      // Check current allowance
      const currentAllowance = await usdcContract.allowance(address, vaultAddress);
      
      // Only approve if needed
      if (currentAllowance.lt(amountWei)) {
        console.log('Approving USDC...');
        const approveTx = await usdcWithSigner.approve(vaultAddress, amountWei);
        await approveTx.wait();
      }

      // Deposit
      console.log('Depositing...');
      const depositTx = await vaultWithSigner.deposit(amountWei, address);
      await depositTx.wait();

      setTxStatus({ isLoading: false, error: null, success: true });
      await fetchVaultData();
      return depositTx;
    } catch (error: any) {
      console.error('Deposit error:', error);
      setTxStatus({ 
        isLoading: false, 
        error: error.reason || error.message || 'Deposit failed', 
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

      // Use redeem instead of withdraw for ERC-4626
      const withdrawTx = await vaultWithSigner.redeem(sharesWei, address, address);
      await withdrawTx.wait();

      setTxStatus({ isLoading: false, error: null, success: true });
      await fetchVaultData();
      return withdrawTx;
    } catch (error: any) {
      console.error('Withdraw error:', error);
      setTxStatus({ 
        isLoading: false, 
        error: error.reason || error.message || 'Withdrawal failed', 
        success: false 
      });
      throw error;
    }
  };

  useEffect(() => {
    if (isConnected && provider) {
      fetchVaultData();
    }
  }, [isConnected, address, provider]);

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