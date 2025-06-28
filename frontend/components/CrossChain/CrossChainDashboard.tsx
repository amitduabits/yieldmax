import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Globe, ArrowRight, Zap, Shield, TrendingUp, CheckCircle, ExternalLink } from 'lucide-react';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ethers } from 'ethers';
import { CONTRACTS, ERC20_ABI } from '../../lib/contracts/addresses';

// CCIP contracts - replace with your actual deployed addresses
const CCIP_CONTRACTS = {
  sepolia: {
    sender: '0xC033b4Eea791ba83C0FcDAC8cD67c563B5b98eC3', // Your CrossChainManager
    router: '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59', // Sepolia CCIP router
  },
  arbitrumSepolia: {
    receiver: '0x5678...', // Your CCIP receiver contract
  }
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    color: #94a3b8;
    font-size: 1.125rem;
  }
`;

const ChainGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

// Fixed: Using transient prop $active instead of active
const ChainCard = styled(motion.div)<{ $active?: boolean }>`
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)'
    : 'rgba(255, 255, 255, 0.05)'
  };
  border: 1px solid ${props => props.$active 
    ? 'rgba(6, 182, 212, 0.5)' 
    : 'rgba(255, 255, 255, 0.1)'
  };
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  
  h3 {
    color: #f1f5f9;
    font-size: 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .stats {
    display: grid;
    gap: 0.75rem;
    
    .stat {
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 0.875rem;
      
      .value {
        color: #f1f5f9;
        font-weight: 600;
      }
    }
  }
`;

const BridgeSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  max-width: 600px;
  margin: 0 auto;
`;

const RouteDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
  
  .chain {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem 2rem;
    text-align: center;
    min-width: 150px;
    
    h4 {
      color: #94a3b8;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    
    p {
      color: #f1f5f9;
      font-size: 1.25rem;
      font-weight: 600;
    }
  }
  
  .arrow {
    color: #06b6d4;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.6; transform: translateX(0); }
    50% { opacity: 1; transform: translateX(5px); }
  }
`;

const InputSection = styled.div`
  margin: 2rem 0;
  
  label {
    display: block;
    color: #94a3b8;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }
  
  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: white;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #06b6d4;
    }
  }
`;

const FeeInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  
  .fee-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    color: #94a3b8;
    
    .value {
      color: #f1f5f9;
      font-weight: 500;
    }
  }
  
  .total {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    font-weight: 600;
  }
`;

const BridgeButton = styled(motion.button)`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TransactionStatus = styled(motion.div)`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  color: #22c55e;
  
  a {
    color: #60a5fa;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.5rem;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const BalanceInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  color: #ef4444;
  text-align: center;
`;

interface CrossChainDashboardProps {
  account?: string;
}

export default function CrossChainDashboard({ account }: CrossChainDashboardProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [bridgeSuccess, setBridgeSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState('Sepolia');
  const [selectedDestination, setSelectedDestination] = useState('Arbitrum Sepolia');
  
  // Fetch USDC balance based on selected network
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !isConnected) return;
      
      try {
        // Get the contract addresses for the selected source network
        const networkKey = selectedSource.toLowerCase().replace(' ', '');
        let contractAddresses;
        let rpcUrl;
        
        if (networkKey === 'sepolia') {
          contractAddresses = CONTRACTS.sepolia;
          rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 
            'https://eth-sepolia.g.alchemy.com/v2/_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC';
        } else if (networkKey === 'arbitrumsepolia') {
          contractAddresses = CONTRACTS.arbitrumSepolia;
          rpcUrl = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || 
            'https://arb-sepolia.g.alchemy.com/v2/demo';
        } else {
          console.error('Unsupported network:', selectedSource);
          setBalance('0');
          return;
        }
        
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const usdcContract = new ethers.Contract(
          contractAddresses.usdc,
          ERC20_ABI,
          provider
        );
        
        const bal = await usdcContract.balanceOf(address);
        setBalance(ethers.utils.formatUnits(bal, 6));
      } catch (err) {
        console.error('Error fetching balance:', err);
        setBalance('0');
      }
    };
    
    fetchBalance();
  }, [address, isConnected, selectedSource]);
  
  // Calculate fees
  const bridgeFee = amount ? (parseFloat(amount) * 0.001).toFixed(2) : '0.00';
  const ccipFee = '0.01';
  const totalFee = amount ? (parseFloat(bridgeFee) + parseFloat(ccipFee)).toFixed(2) : '0.00';
  const receiveAmount = amount ? (parseFloat(amount) - parseFloat(totalFee)).toFixed(2) : '0.00';
  
  // Chain configurations
  const chains = [
    {
      name: 'Sepolia',
      icon: '🔷',
      active: true,
      tvl: '$1.5M',
      apy: '12.5%',
      gasPrice: '5 gwei'
    },
    {
      name: 'Arbitrum Sepolia',
      icon: '🔵',
      active: true,
      tvl: '$800K',
      apy: '15.2%',
      gasPrice: '0.1 gwei'
    },
    {
      name: 'Polygon Mumbai',
      icon: '🟣',
      active: false,
      tvl: 'Coming Soon',
      apy: '-',
      gasPrice: '-'
    },
    {
      name: 'Optimism Goerli',
      icon: '🔴',
      active: false,
      tvl: 'Coming Soon',
      apy: '-',
      gasPrice: '-'
    }
  ];
  
  const handleBridge = async () => {
    if (!amount || !address) return;
    
    try {
      setIsLoading(true);
      setBridgeSuccess(false);
      setError(null);
      
      // Validate amount
      if (parseFloat(amount) > parseFloat(balance)) {
        throw new Error('Insufficient balance');
      }
      
      // Simulate bridge transaction
      // In production, this would call your CCIP sender contract
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock transaction hash
      const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);
      setTxHash(mockTxHash);
      setBridgeSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setAmount('');
        setBridgeSuccess(false);
        setTxHash('');
      }, 10000);
      
    } catch (error: any) {
      console.error('Bridge failed:', error);
      setError(error.message || 'Bridge transaction failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isConnected) {
    return (
      <Container>
        <Header>
          <h1>YieldMax Bridge</h1>
          <p>Connect your wallet to bridge funds across chains</p>
        </Header>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <h1>
          <Globe size={32} style={{ verticalAlign: 'middle' }} /> Cross-Chain Bridge
        </h1>
        <p>Seamlessly move funds across chains with Chainlink CCIP</p>
      </Header>
      
      <ChainGrid>
        {chains.map((chain, index) => (
          <ChainCard
            key={chain.name}
            $active={chain.active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => chain.active && setSelectedSource(chain.name)}
          >
            <h3>
              <span style={{ fontSize: '2rem' }}>{chain.icon}</span>
              {chain.name}
            </h3>
            <div className="stats">
              <div className="stat">
                <span>TVL</span>
                <span className="value">{chain.tvl}</span>
              </div>
              <div className="stat">
                <span>APY</span>
                <span className="value">{chain.apy}</span>
              </div>
              <div className="stat">
                <span>Gas Price</span>
                <span className="value">{chain.gasPrice}</span>
              </div>
              <div className="stat">
                <span>Status</span>
                <span className="value" style={{ 
                  color: chain.active ? '#10b981' : '#ef4444' 
                }}>
                  {chain.active ? 'Active' : 'Coming Soon'}
                </span>
              </div>
            </div>
          </ChainCard>
        ))}
      </ChainGrid>
      
      <BridgeSection>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          Bridge Funds
        </h2>
        
        <RouteDisplay>
          <div className="chain">
            <h4>From</h4>
            <p>{selectedSource}</p>
            <BalanceInfo>
              <span>Balance: {balance} USDC</span>
            </BalanceInfo>
          </div>
          <ArrowRight size={32} className="arrow" />
          <div className="chain">
            <h4>To</h4>
            <p>{selectedDestination}</p>
            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Ready to receive</span>
          </div>
        </RouteDisplay>
        
        <InputSection>
          <label>Amount to Bridge</label>
          <input
            type="number"
            placeholder="0.00 USDC"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            max={balance}
          />
          <BalanceInfo>
            <span>Max: {balance} USDC</span>
            <span 
              style={{ cursor: 'pointer', color: '#06b6d4' }}
              onClick={() => setAmount(balance)}
            >
              Use Max
            </span>
          </BalanceInfo>
        </InputSection>
        
        {amount && parseFloat(amount) > 0 && (
          <FeeInfo>
            <div className="fee-row">
              <span>Bridge Amount:</span>
              <span className="value">{amount} USDC</span>
            </div>
            <div className="fee-row">
              <span>Bridge Fee (0.1%):</span>
              <span className="value">{bridgeFee} USDC</span>
            </div>
            <div className="fee-row">
              <span>CCIP Fee:</span>
              <span className="value">{ccipFee} ETH</span>
            </div>
            <div className="fee-row total">
              <span>You will receive:</span>
              <span className="value">{receiveAmount} USDC</span>
            </div>
          </FeeInfo>
        )}
        
        <BridgeButton
          onClick={handleBridge}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance) || isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <>Processing...</>
          ) : (
            <>
              <Zap size={20} />
              Bridge to {selectedDestination}
            </>
          )}
        </BridgeButton>
        
        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}
        
        {bridgeSuccess && txHash && (
          <TransactionStatus
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} />
              Bridge transaction successful!
            </div>
            <a 
              href={`https://ccip.chain.link/side-drawer/msg/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Track on CCIP Explorer
              <ExternalLink size={16} />
            </a>
          </TransactionStatus>
        )}
      </BridgeSection>
    </Container>
  );
}