// hooks/useYieldMax.ts
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useNetwork, usePublicClient, useWalletClient } from 'wagmi';
import { CONTRACTS, VAULT_ABI, ERC20_ABI } from '../lib/contracts/addresses';

export function useYieldMax() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
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

  // Convert viem public client to ethers provider
  const getEthersProvider = () => {
    if (!publicClient) return null;
    
    // Use the Alchemy RPC URL with a working API key
    const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 
      'https://eth-sepolia.g.alchemy.com/v2/_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC';
    
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    return provider;
  };

  // Get ethers signer from wallet client
  const getEthersSigner = () => {
    if (!walletClient || !address) return null;
    
    const provider = getEthersProvider();
    if (!provider) return null;
    
    // For wagmi v1, we need to create an ethers signer differently
    const signer = provider.getSigner(address);
    return signer;
  };

  // Get contract instances with debugging
  const getContracts = () => {
    const vaultAddress = CONTRACTS.sepolia.vault;
    const usdcAddress = CONTRACTS.sepolia.usdc;
    
    console.log('Contract addresses:', {
      vaultAddress,
      usdcAddress,
      hasPublicClient: !!publicClient,
      chainId: chain?.id,
    });
    
    const provider = getEthersProvider();
    if (!provider) {
      console.error('No provider available');
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

  // Fetch vault data with detailed error handling
  const fetchVaultData = async () => {
    console.log('fetchVaultData called', { isConnected, address, chainId: chain?.id });
    
    if (!isConnected || !address) {
      console.log('Not connected or no address');
      setVaultData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Check if we're on the right network
    if (chain?.id !== 11155111) { // Sepolia chain ID
      console.error('Wrong network. Please switch to Sepolia');
      setVaultData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const contracts = getContracts();
    if (!contracts) {
      console.error('Could not get contracts');
      setVaultData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { vaultContract, usdcContract, vaultAddress } = contracts;
      
      console.log('Fetching vault data...');

      // Try to fetch each value individually to identify which one fails
      let totalAssets = ethers.BigNumber.from(0);
      let totalShares = ethers.BigNumber.from(0);
      let userShares = ethers.BigNumber.from(0);
      let userBalance = ethers.BigNumber.from(0);
      let allowance = ethers.BigNumber.from(0);
      let lastRebalance = ethers.BigNumber.from(0);

      try {
        totalAssets = await vaultContract.totalAssets();
        console.log('totalAssets:', totalAssets.toString());
      } catch (e) {
        console.error('Error fetching totalAssets:', e);
      }

      try {
        // Try totalSupply if totalShares doesn't exist
        totalShares = await vaultContract.totalSupply();
        console.log('totalSupply:', totalShares.toString());
      } catch (e) {
        console.error('Error fetching totalSupply:', e);
      }

      try {
        // Try balanceOf instead of getUserShares
        userShares = await vaultContract.balanceOf(address);
        console.log('userShares (balanceOf):', userShares.toString());
      } catch (e) {
        console.error('Error fetching userShares:', e);
      }

      try {
        userBalance = await usdcContract.balanceOf(address);
        console.log('USDC balance:', userBalance.toString());
      } catch (e) {
        console.error('Error fetching USDC balance:', e);
      }

      try {
        allowance = await usdcContract.allowance(address, vaultAddress);
        console.log('allowance:', allowance.toString());
      } catch (e) {
        console.error('Error fetching allowance:', e);
      }

      try {
        lastRebalance = await vaultContract.lastRebalance();
        console.log('lastRebalance:', lastRebalance.toString());
      } catch (e) {
        console.error('Error fetching lastRebalance:', e);
      }

      setVaultData({
        totalAssets: ethers.utils.formatUnits(totalAssets, 6),
        totalShares: ethers.utils.formatUnits(totalShares, 18), // ymUSDC likely has 18 decimals
        userShares: ethers.utils.formatUnits(userShares, 18),
        userBalance: ethers.utils.formatUnits(userBalance, 6),
        allowance: ethers.utils.formatUnits(allowance, 6),
        lastRebalance: lastRebalance.toNumber(),
        isLoading: false,
      });

      console.log('Vault data updated successfully');
    } catch (error) {
      console.error('Error in fetchVaultData:', error);
      setVaultData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Deposit function
  const deposit = async (amount: string) => {
    if (!walletClient || !address) throw new Error('Wallet not connected');

    const contracts = getContracts();
    if (!contracts) throw new Error('Contracts not available');

    const signer = getEthersSigner();
    if (!signer) throw new Error('Could not get signer');

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
        console.log('Approval successful');
      }

      // Deposit
      console.log('Depositing...');
      const depositTx = await vaultWithSigner.deposit(amountWei, address);
      await depositTx.wait();
      console.log('Deposit successful');

      setTxStatus({ isLoading: false, error: null, success: true });
      await fetchVaultData();
      return depositTx;
    } catch (error: any) {
      console.error('Deposit error:', error);
      setTxStatus({ 
        isLoading: false, 
        error: error.message || 'Deposit failed', 
        success: false 
      });
      throw error;
    }
  };

  // Withdraw function
  const withdraw = async (amount: string) => {
    if (!walletClient || !address) throw new Error('Wallet not connected');

    const contracts = getContracts();
    if (!contracts) throw new Error('Contracts not available');

    const signer = getEthersSigner();
    if (!signer) throw new Error('Could not get signer');

    setTxStatus({ isLoading: true, error: null, success: false });

    try {
      const { vaultContract } = contracts;
      const vaultWithSigner = vaultContract.connect(signer);

      const amountWei = ethers.utils.parseUnits(amount, 6);

      console.log('Withdrawing...');
      const withdrawTx = await vaultWithSigner.withdraw(amountWei, address, address);
      await withdrawTx.wait();
      console.log('Withdrawal successful');

      setTxStatus({ isLoading: false, error: null, success: true });
      await fetchVaultData();
      return withdrawTx;
    } catch (error: any) {
      console.error('Withdraw error:', error);
      setTxStatus({ 
        isLoading: false, 
        error: error.message || 'Withdrawal failed', 
        success: false 
      });
      throw error;
    }
  };

  useEffect(() => {
    if (isConnected && address && chain?.id === 11155111) {
      fetchVaultData();
      // Refresh data every 30 seconds
      const interval = setInterval(fetchVaultData, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, chain?.id]);

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