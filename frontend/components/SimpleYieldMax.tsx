import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract addresses
const VAULT_ADDRESS = "0xECbA31cf51F88BA5193186abf35225ECE097df44";
const USDC_ADDRESS = "0x5289F073c6ff1A4175ac7FBb1f9908e1354b910d";

// Minimal ABIs
const VAULT_ABI = [
  "function deposit(uint256 amount, address receiver) returns (uint256 shares)",
  "function withdraw(uint256 shares) returns (uint256 amount)",
  "function totalAssets() view returns (uint256)",
  "function getUserShares(address user) view returns (uint256)"
];

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function faucet(uint256 amount)"
];

export default function SimpleYieldMax() {
  const [account, setAccount] = useState('');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [vaultShares, setVaultShares] = useState('0');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      setAccount(accounts[0]);
      setStatus('Wallet connected!');
      
      // Load balances
      await loadBalances(accounts[0]);
    } catch (error) {
      console.error('Connect error:', error);
      setStatus('Connection failed: ' + error.message);
    }
  };

  // Load balances
  const loadBalances = async (address) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // USDC balance
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
      const usdcBal = await usdc.balanceOf(address);
      setUsdcBalance(ethers.utils.formatUnits(usdcBal, 6));
      
      // Vault shares
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
      const shares = await vault.getUserShares(address);
      setVaultShares(ethers.utils.formatUnits(shares, 6));
      
    } catch (error) {
      console.error('Load balances error:', error);
      setStatus('Error loading balances');
    }
  };

  // Get test USDC
  const handleFaucet = async () => {
    try {
      setLoading(true);
      setStatus('Getting test USDC...');
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      
      const tx = await usdc.faucet(ethers.utils.parseUnits('1000', 6));
      setStatus('Transaction sent: ' + tx.hash);
      
      await tx.wait();
      setStatus('Success! Got 1000 USDC');
      
      await loadBalances(account);
    } catch (error) {
      console.error('Faucet error:', error);
      setStatus('Faucet failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Deposit USDC
  const handleDeposit = async () => {
    try {
      setLoading(true);
      const amount = prompt('Amount to deposit (USDC):');
      if (!amount) return;
      
      setStatus('Approving USDC...');
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      
      // Approve
      const amountWei = ethers.utils.parseUnits(amount, 6);
      const approveTx = await usdc.approve(VAULT_ADDRESS, amountWei);
      await approveTx.wait();
      
      setStatus('Depositing...');
      
      // Deposit
      const depositTx = await vault.deposit(amountWei, account);
      setStatus('Transaction sent: ' + depositTx.hash);
      
      await depositTx.wait();
      setStatus('Success! Deposited ' + amount + ' USDC');
      
      await loadBalances(account);
    } catch (error) {
      console.error('Deposit error:', error);
      setStatus('Deposit failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Withdraw shares
  const handleWithdraw = async () => {
    try {
      setLoading(true);
      const shares = prompt('Shares to withdraw:');
      if (!shares) return;
      
      setStatus('Withdrawing...');
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      
      const sharesWei = ethers.utils.parseUnits(shares, 6);
      const tx = await vault.withdraw(sharesWei);
      setStatus('Transaction sent: ' + tx.hash);
      
      await tx.wait();
      setStatus('Success! Withdrawn ' + shares + ' shares');
      
      await loadBalances(account);
    } catch (error) {
      console.error('Withdraw error:', error);
      setStatus('Withdraw failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>YieldMax - Simple Test Interface</h1>
      
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p><strong>Account:</strong> {account}</p>
          <p><strong>USDC Balance:</strong> {usdcBalance}</p>
          <p><strong>Vault Shares:</strong> {vaultShares}</p>
          
          <div style={{ margin: '20px 0' }}>
            <button onClick={handleFaucet} disabled={loading}>
              Get Test USDC (1000)
            </button>
            <button onClick={handleDeposit} disabled={loading} style={{ marginLeft: '10px' }}>
              Deposit USDC
            </button>
            <button onClick={handleWithdraw} disabled={loading} style={{ marginLeft: '10px' }}>
              Withdraw Shares
            </button>
            <button onClick={() => loadBalances(account)} disabled={loading} style={{ marginLeft: '10px' }}>
              Refresh
            </button>
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '5px' 
          }}>
            <strong>Status:</strong> {status || 'Ready'}
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <h3>Contract Addresses:</h3>
            <p>USDC: {USDC_ADDRESS}</p>
            <p>Vault: {VAULT_ADDRESS}</p>
          </div>
        </div>
      )}
    </div>
  );
}