import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Globe, ArrowRight, Zap, Shield, TrendingUp, CheckCircle, ExternalLink } from 'lucide-react';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseUnits } from 'viem';

// Mock CCIP contracts - replace with your actual deployed addresses
const CCIP_CONTRACTS = {
  sepolia: {
    sender: '0x1234...', // Your CCIP sender contract
    router: '0xD0daae2231E9CB96b94C8512223533293C3693Bf', // Sepolia CCIP router
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

interface CrossChainDashboardProps {
  account?: string;
}

export default function CrossChainDashboard({ account }: CrossChainDashboardProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [bridgeSuccess, setBridgeSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock balance - in production, fetch from contract
  const balance = '1030.00';
  
  // Calculate fees
  const bridgeFee = amount ? (parseFloat(amount) * 0.001).toFixed(2) : '0.00';
  const ccipFee = '0.01';
  const totalFee = amount ? (parseFloat(bridgeFee) + parseFloat(ccipFee)).toFixed(2) : '0.00';
  const receiveAmount = amount ? (parseFloat(amount) - parseFloat(totalFee)).toFixed(2) : '0.00';
  
  const handleBridge = async () => {
    if (!amount || !address) return;
    
    try {
      setIsLoading(true);
      setBridgeSuccess(false);
      
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
      
    } catch (error) {
      console.error('Bridge failed:', error);
      alert('Bridge transaction failed. Please try again.');
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
          <Globe size={32} style={{ verticalAlign: 'middle' }} /> YieldMax Bridge
        </h1>
        <p>Bridge USDC across chains for optimal yields</p>
      </Header>
      
      <BridgeSection>
        <RouteDisplay>
          <div className="chain">
            <h4>From</h4>
            <p>Sepolia</p>
            <BalanceInfo>
              <span>Balance: {balance} USDC</span>
            </BalanceInfo>
          </div>
          <ArrowRight size={32} className="arrow" />
          <div className="chain">
            <h4>To</h4>
            <p>Arbitrum Sepolia</p>
            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Ready to receive</span>
          </div>
        </RouteDisplay>
        
        <InputSection>
          <label>Amount to Bridge</label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            max={balance}
          />
        </InputSection>
        
        {amount && (
          <FeeInfo>
            <div className="fee-row">
              <span>Bridge Amount:</span>
              <span className="value">{amount} USDC</span>
            </div>
            <div className="fee-row">
              <span>CCIP Fee:</span>
              <span className="value">{ccipFee} ETH</span>
            </div>
            <div className="fee-row total">
              <span>You will receive:</span>
              <span className="value">{amount} USDC</span>
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
              Bridge to Arbitrum Sepolia
            </>
          )}
        </BridgeButton>
        
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