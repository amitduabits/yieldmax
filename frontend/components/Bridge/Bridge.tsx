// components/Bridge/Bridge.tsx
import React, { useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useCrossChain } from '../../hooks/useCrossChain';

// Import icons individually to avoid undefined errors
import { 
  ArrowUpDown, 
  Zap, 
  AlertCircle 
} from 'lucide-react';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
`;

const BridgeCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  p {
    color: #94a3b8;
    font-size: 1.1rem;
  }
`;

const NetworkSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const NetworkCard = styled.div<{ $active?: boolean }>`
  background: ${props => props.$active ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid ${props => props.$active ? 'transparent' : 'rgba(255, 255, 255, 0.1)'};
  min-width: 200px;
  text-align: center;
  
  h3 {
    color: ${props => props.$active ? 'white' : '#f1f5f9'};
    margin-bottom: 0.5rem;
  }
  
  .balance {
    color: ${props => props.$active ? 'rgba(255,255,255,0.8)' : '#94a3b8'};
    font-size: 0.9rem;
  }
`;

const SwapIcon = styled(motion.div)`
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  svg {
    color: white;
  }
`;

const InputSection = styled.div`
  margin-bottom: 2rem;
`;

const InputWrapper = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  label {
    display: block;
    color: #94a3b8;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }
  
  input {
    width: 100%;
    background: transparent;
    border: none;
    font-size: 1.5rem;
    color: #f1f5f9;
    outline: none;
    
    &::placeholder {
      color: #64748b;
    }
  }
`;

const FeeInfo = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 2rem;
  
  .fee-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    
    &:last-child {
      margin-bottom: 0;
      font-weight: bold;
      border-top: 1px solid rgba(59, 130, 246, 0.2);
      padding-top: 0.5rem;
    }
  }
  
  .fee-label {
    color: #94a3b8;
  }
  
  .fee-value {
    color: #3b82f6;
  }
`;

const BridgeButton = styled(motion.button)<{ $disabled?: boolean }>`
  width: 100%;
  background: ${props => props.$disabled ? 'rgba(100, 116, 139, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    transform: ${props => props.$disabled ? 'none' : 'translateY(-2px)'};
  }
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NetworkWarning = styled.div`
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 2rem;
  color: #fbbf24;
  text-align: center;
`;

// Bridge icon component (fixed version)
const BridgeIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 19V5"/>
    <path d="M18 19V5"/>
    <path d="M6 12h12"/>
  </svg>
);

export default function Bridge() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [amount, setAmount] = useState('');

  const {
    bridgeTokens,
    bridgeStatus,
    bridgeFees,
    getDestinationNetworks,
    getCurrentContracts,
    switchToNetwork,
    usdcBalance, // Use balance from hook
  } = useCrossChain();

  const destinationNetworks = getDestinationNetworks();
  const currentContracts = getCurrentContracts();

  // Auto-select destination when networks change
  const selectedDestination = destinationNetworks[0]?.key || '';

  const handleBridge = async () => {
    if (!amount || !selectedDestination) return;
    
    try {
      await bridgeTokens(selectedDestination as keyof typeof import('../../lib/contracts/addresses').CHAIN_SELECTORS, amount);
    } catch (error) {
      console.error('Bridge failed:', error);
    }
  };

  const handleNetworkSwitch = async () => {
    const targetNetwork = destinationNetworks[0];
    if (targetNetwork) {
      try {
        await switchToNetwork(targetNetwork.chainId);
      } catch (error) {
        console.error('Failed to switch network:', error);
      }
    }
  };

  const getCurrentNetworkName = () => {
    return chain?.id === 11155111 ? 'Sepolia' : 
           chain?.id === 421614 ? 'Arbitrum Sepolia' : 
           'Unknown Network';
  };

  const getDestinationName = () => {
    return destinationNetworks[0]?.name || 'No destination available';
  };

  const isUnsupportedNetwork = () => {
    return chain?.id !== 11155111 && chain?.id !== 421614;
  };

  if (!isConnected) {
    return (
      <Container>
        <BridgeCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Header>
            <h1><BridgeIcon size={40} /> YieldMax Bridge</h1>
            <p>Please connect your wallet to use the bridge</p>
          </Header>
        </BridgeCard>
      </Container>
    );
  }

  if (isUnsupportedNetwork()) {
    return (
      <Container>
        <BridgeCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Header>
            <h1><BridgeIcon size={40} /> YieldMax Bridge</h1>
            <p>Bridge USDC across chains for optimal yields</p>
          </Header>
          
          <NetworkWarning>
            <p><strong>Unsupported Network</strong></p>
            <p>Please switch to Sepolia or Arbitrum Sepolia to use the bridge.</p>
            <BridgeButton
              onClick={() => switchToNetwork(11155111)}
              style={{ marginTop: '1rem', maxWidth: '200px', margin: '1rem auto 0' }}
            >
              Switch to Sepolia
            </BridgeButton>
          </NetworkWarning>
        </BridgeCard>
      </Container>
    );
  }

  return (
    <Container>
      <BridgeCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Header>
          <h1><BridgeIcon size={40} /> YieldMax Bridge</h1>
          <p>Bridge USDC across chains for optimal yields</p>
        </Header>

        <NetworkSection>
          <NetworkCard $active={true}>
            <h3>{getCurrentNetworkName()}</h3>
            <div className="balance">
              Balance: {usdcBalance} USDC
            </div>
          </NetworkCard>

          <SwapIcon
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            onClick={handleNetworkSwitch}
          >
            <ArrowUpDown size={24} />
          </SwapIcon>

          <NetworkCard>
            <h3>{getDestinationName()}</h3>
            <div className="balance">
              {destinationNetworks.length > 0 ? 'Ready to receive' : 'No destinations available'}
            </div>
          </NetworkCard>
        </NetworkSection>

        <InputSection>
          <InputWrapper>
            <label>Amount to Bridge</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={usdcBalance}
            />
          </InputWrapper>
        </InputSection>

        {amount && Number(amount) > 0 && (
          <FeeInfo>
            <div className="fee-row">
              <span className="fee-label">Bridge Amount:</span>
              <span className="fee-value">{amount} USDC</span>
            </div>
            <div className="fee-row">
              <span className="fee-label">CCIP Fee:</span>
              <span className="fee-value">{bridgeFees} ETH</span>
            </div>
            <div className="fee-row">
              <span className="fee-label">You will receive:</span>
              <span className="fee-value">{amount} USDC</span>
            </div>
          </FeeInfo>
        )}

        <BridgeButton
          onClick={handleBridge}
          $disabled={!amount || Number(amount) <= 0 || bridgeStatus.isLoading || destinationNetworks.length === 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {bridgeStatus.isLoading ? (
            <>
              <Zap size={20} style={{ animation: 'spin 1s linear infinite' }} />
              Bridging...
            </>
          ) : (
            <>
              <BridgeIcon size={20} />
              Bridge to {getDestinationName()}
            </>
          )}
        </BridgeButton>

        {bridgeStatus.error && (
          <ErrorMessage>
            <AlertCircle size={20} />
            {bridgeStatus.error}
          </ErrorMessage>
        )}

        {bridgeStatus.success && bridgeStatus.txHash && (
          <div style={{ 
            background: 'rgba(34, 197, 94, 0.1)', 
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            marginTop: '1rem',
            color: '#22c55e',
            textAlign: 'center'
          }}>
            ✅ Bridge transaction successful! 
            <br />
            <a 
              href={`https://ccip.chain.link/tx/${bridgeStatus.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#22c55e', textDecoration: 'underline' }}
            >
              Track on CCIP Explorer
            </a>
          </div>
        )}
      </BridgeCard>
    </Container>
  );
}