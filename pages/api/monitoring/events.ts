import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (free tier)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Contract ABIs
import YieldMaxVaultABI from '../../../contracts/abi/YieldMaxVault.json';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Fetch recent events from Supabase
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    
    return res.status(200).json({ events: data || [] });
  }
  
  if (req.method === 'POST' && req.body.action === 'start-monitoring') {
    // Start monitoring in the background
    startEventMonitoring();
    return res.status(200).json({ status: 'Monitoring started' });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

async function startEventMonitoring() {
  const networks = ['ethereum', 'arbitrum', 'polygon', 'optimism'];
  
  for (const network of networks) {
    const provider = new ethers.providers.JsonRpcProvider(
      process.env[`${network.toUpperCase()}_RPC_URL`]
    );
    
    const vaultAddress = process.env[`${network.toUpperCase()}_VAULT_ADDRESS`];
    if (!vaultAddress) continue;
    
    const vault = new ethers.Contract(vaultAddress, YieldMaxVaultABI, provider);
    
    // Monitor Deposits
    vault.on('Deposit', async (user, amount, shares, event) => {
      await supabase.from('events').insert({
        network,
        type: 'deposit',
        user,
        amount: amount.toString(),
        shares: shares.toString(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: new Date().toISOString()
      });
    });
    
    // Monitor Cross-Chain Rebalances
    vault.on('CrossChainRebalance', async (destChain, amount, event) => {
      await supabase.from('events').insert({
        network,
        type: 'rebalance',
        destChain: destChain.toString(),
        amount: amount.toString(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: new Date().toISOString()
      });
    });
  }
}