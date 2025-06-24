import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ArrowRight, Globe, Zap, Shield } from 'lucide-react';
import { ethers } from 'ethers';

// Styled components (keep existing styles)
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const BridgeCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ChainSelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const ChainBox = styled.div`
  flex: 1;
  text-align: center;
  
  label {
    display: block;
    color: #94a3b8;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }
  
  select {
    width: 100%;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 1rem;
    cursor: pointer;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
  }
`;

const ArrowIcon = styled.div`
  color: #3b82f6;
  margin-top: 1.5rem;
`;

const InputSection = styled.div`
  margin-bottom: 2rem;
  
  label {
    display: block;
    color: #94a3b8;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }
  
  input {
    width: 100%;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
  }
`;

const FeeInfo = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  
  h4 {
    color: #60a5fa;
    margin-bottom: 0.5rem;
  }
  
  .fee-row {
    display: flex;
    justify-content: space-between;
    margin: 0.5rem 0;
    color: #e2e8f0;
    font-size: 0.875rem;
  }
`;

const BridgeButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: ${props => 
    props.type === 'success' ? 'rgba(34, 197, 94, 0.1)' :
    props.type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
    'rgba(59, 130, 246, 0.1)'
  };
  border: 1px solid ${props =>
    props.type === 'success' ? 'rgba(34, 197, 94, 0.3)' :
    props.type === 'error' ? 'rgba(239, 68, 68, 0.3)' :
    'rgba(59, 130, 246, 0.3)'
  };
  color: ${props =>
    props.type === 'success' ? '#4ade80' :
    props.type === 'error' ? '#f87171' :
    '#60a5fa'
  };
`;

// Chain configurations
const CHAINS = {
  sepolia: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    selector: '16015286601757825753',
    router: '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59',
    usdc: '0x99f8B38514d22c54982b4be93495735bfcCE23b9',
    bridge: '0x...', // Will be updated after deployment
  },
  arbitrumSepolia: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    selector: '3478487238524512106',
    router: '0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165',
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    bridge: '0x...', // Will be updated after deployment
  }
};

// CCIP Bridge ABI
const BRIDGE_ABI = [
  'function bridge(uint64 destinationChainSelector, address receiver, uint256 amount) external payable returns (bytes32)',
  'function getFee(uint64 destinationChainSelector, address receiver, uint256 amount) external view returns (uint256)',
  'function claimTokens() external',
  'function pendingWithdrawals(address) external view returns (uint256)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

export default function CrossChainDashboard({ account }: { account?: string }) {
  const [fromChain, setFromChain] = useState('sepolia');
  const [toChain, setToChain] = useState('arbitrumSepolia');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bridgeFee, setBridgeFee] = useState('0');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [txHash, setTxHash] = useState('');

  // Calculate bridge fee when amount changes
  useEffect(() => {
    const calculateFee = async () => {
      if (!amount || parseFloat(amount) <= 0 || !window.ethereum) return;
      
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const bridgeAddress = CHAINS[fromChain as keyof typeof CHAINS].bridge;
        
        // Skip if bridge not deployed yet
        if (bridgeAddress === '0x...') {
          setBridgeFee('0.001'); // Estimate
          return;
        }
        
        const bridgeContract = new ethers.Contract(bridgeAddress, BRIDGE_ABI, provider);
        const toChainSelector = CHAINS[toChain as keyof typeof CHAINS].selector;
        const amountWei = ethers.utils.parseUnits(amount, 6);
        
        const fee = await bridgeContract.getFee(toChainSelector, account || ethers.constants.AddressZero, amountWei);
        setBridgeFee(ethers.utils.formatEther(fee));
      } catch (error) {
        console.error('Error calculating fee:', error);
        setBridgeFee('0.001'); // Fallback estimate
      }
    };
    
    calculateFee();
  }, [amount, fromChain, toChain, account]);

  const handleBridge = async () => {
    if (!window.ethereum || !account || !amount) return;
    
    setIsLoading(true);
    setStatus(null);
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Get chain configurations
      const fromChainConfig = CHAINS[fromChain as keyof typeof CHAINS];
      const toChainConfig = CHAINS[toChain as keyof typeof CHAINS];
      
      // Check if on correct network
      const network = await provider.getNetwork();
      if (network.chainId !== fromChainConfig.chainId) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${fromChainConfig.chainId.toString(16)}` }],
        });
      }
      
      // For demo: If bridge not deployed, show simulation
      if (fromChainConfig.bridge === '0x...') {
        setStatus({
          type: 'info',
          message: `Bridge contract not deployed yet. In production, this would bridge ${amount} USDC from ${fromChainConfig.name} to ${toChainConfig.name}.`
        });
        setIsLoading(false);
        return;
      }
      
      // Contract instances
      const usdcContract = new ethers.Contract(fromChainConfig.usdc, ERC20_ABI, signer);
      const bridgeContract = new ethers.Contract(fromChainConfig.bridge, BRIDGE_ABI, signer);
      
      const amountWei = ethers.utils.parseUnits(amount, 6);
      
      // Step 1: Approve USDC
      setStatus({ type: 'info', message: 'Approving USDC...' });
      const approveTx = await usdcContract.approve(fromChainConfig.bridge, amountWei);
      await approveTx.wait();
      
      // Step 2: Get fee and bridge
      setStatus({ type: 'info', message: 'Initiating bridge transfer...' });
      const fee = await bridgeContract.getFee(toChainConfig.selector, account, amountWei);
      
      const bridgeTx = await bridgeContract.bridge(
        toChainConfig.selector,
        account,
        amountWei,
        { value: fee }
      );
      
      setTxHash(bridgeTx.hash);
      setStatus({ 
        type: 'info', 
        message: `Bridge transaction submitted! Hash: ${bridgeTx.hash.substring(0, 10)}...` 
      });
      
      await bridgeTx.wait();
      
      setStatus({
        type: 'success',
        message: `Successfully bridged ${amount} USDC! Tokens will arrive on ${toChainConfig.name} in 5-10 minutes.`
      });
      
      // Clear form
      setAmount('');
      
    } catch (error: any) {
      console.error('Bridge error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Bridge failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <h1>Cross-Chain Operations</h1>
        <p>Seamlessly move funds across chains with Chainlink CCIP</p>
      </Header>
      
      <BridgeCard>
        <h2 style={{ marginBottom: '2rem', color: '#f1f5f9' }}>Bridge Funds</h2>
        
        <ChainSelector>
          <ChainBox>
            <label>From</label>
            <select 
              value={fromChain} 
              onChange={(e) => setFromChain(e.target.value)}
              disabled={isLoading}
            >
              <option value="sepolia">Ethereum Sepolia</option>
              <option value="arbitrumSepolia">Arbitrum Sepolia</option>
            </select>
          </ChainBox>
          
          <ArrowIcon>
            <ArrowRight size={24} />
          </ArrowIcon>
          
          <ChainBox>
            <label>To</label>
            <select 
              value={toChain} 
              onChange={(e) => setToChain(e.target.value)}
              disabled={isLoading}
            >
              <option value="arbitrumSepolia">Arbitrum Sepolia</option>
              <option value="sepolia">Ethereum Sepolia</option>
            </select>
          </ChainBox>
        </ChainSelector>
        
        <InputSection>
          <label>Amount to Bridge</label>
          <input
            type="number"
            placeholder="0.00 USDC"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
          />
        </InputSection>
        
        <FeeInfo>
          <h4>Fee Estimate</h4>
          <div className="fee-row">
            <span>Bridge Fee (0.1%)</span>
            <span>{amount ? (parseFloat(amount) * 0.001).toFixed(2) : '0'} USDC</span>
          </div>
          <div className="fee-row">
            <span>Gas Estimate</span>
            <span>{bridgeFee} ETH</span>
          </div>
          <div className="fee-row" style={{ fontWeight: 'bold', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <span>Total Cost</span>
            <span>${((parseFloat(amount) || 0) * 0.001 + parseFloat(bridgeFee) * 2000).toFixed(2)}</span>
          </div>
        </FeeInfo>
        
        <BridgeButton 
          onClick={handleBridge} 
          disabled={!amount || parseFloat(amount) <= 0 || isLoading}
        >
          {isLoading ? 'Processing...' : 'Bridge Funds'}
        </BridgeButton>
        
        {status && (
          <StatusMessage type={status.type}>
            {status.message}
            {txHash && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  View on Explorer →
                </a>
              </div>
            )}
          </StatusMessage>
        )}
      </BridgeCard>
      
      {/* Chain status cards - keep existing */}
    </Container>
  );
}