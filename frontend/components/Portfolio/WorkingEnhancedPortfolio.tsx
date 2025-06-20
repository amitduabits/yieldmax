// frontend/components/Portfolio/WorkingEnhancedPortfolio.tsx
import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACTS, VAULT_ABI, Protocol, MOCK_YIELDS, getCurrentAPY } from '../../src/config/contracts';
import styled from 'styled-components';
import { motion } from 'framer-motion';

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
    background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    color: #888;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }
  
  .value {
    font-size: 2rem;
    font-weight: bold;
    color: #00ff88;
  }
  
  .subtext {
    color: #666;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }
`;

const ActionSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  background: ${props => props.active ? 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  
  input {
    flex: 1;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    color: white;
    font-size: 1rem;
    
    &::placeholder {
      color: #666;
    }
  }
`;

const Button = styled(motion.button)`
  padding: 1rem 2rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #00ff88 0%, #00cc6f 100%);
  color: black;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StrategyCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  
  h2 {
    margin-bottom: 1rem;
  }
`;

const ProtocolGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const ProtocolCard = styled.div<{ active: boolean }>`
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid ${props => props.active ? '#00ff88' : 'rgba(255, 255, 255, 0.1)'};
  background: ${props => props.active ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #00ff88;
  }
  
  .name {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .apy {
    color: #00ff88;
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .risk {
    color: #888;
    font-size: 0.875rem;
  }
`;

export function WorkingEnhancedPortfolio() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Read vault data
  const { data: userBalance } = useContractRead({
    address: CONTRACTS.sepolia.vault,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  const { data: totalSupply } = useContractRead({
    address: CONTRACTS.sepolia.vault,
    abi: VAULT_ABI,
    functionName: 'totalSupply',
    watch: true,
  });

  const { data: currentProtocol } = useContractRead({
    address: CONTRACTS.sepolia.vault,
    abi: VAULT_ABI,
    functionName: 'currentProtocol',
    watch: true,
  });

  // Write functions
  const { write: deposit, data: depositTx } = useContractWrite({
    address: CONTRACTS.sepolia.vault,
    abi: VAULT_ABI,
    functionName: 'deposit',
  });

  const { write: withdraw, data: withdrawTx } = useContractWrite({
    address: CONTRACTS.sepolia.vault,
    abi: VAULT_ABI,
    functionName: 'withdraw',
  });

  // Wait for transactions
  const { isLoading: isDepositLoading } = useWaitForTransaction({
    hash: depositTx?.hash,
    onSuccess: () => {
      setAmount('');
      setIsProcessing(false);
    },
  });

  const { isLoading: isWithdrawLoading } = useWaitForTransaction({
    hash: withdrawTx?.hash,
    onSuccess: () => {
      setAmount('');
      setIsProcessing(false);
    },
  });

  const handleDeposit = async () => {
    if (!amount || !deposit) return;
    setIsProcessing(true);
    
    try {
      const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
      deposit({ args: [amountWei] });
    } catch (error) {
      console.error('Deposit error:', error);
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !withdraw) return;
    setIsProcessing(true);
    
    try {
      const amountWei = parseUnits(amount, 18); // Shares have 18 decimals
      withdraw({ args: [amountWei] });
    } catch (error) {
      console.error('Withdraw error:', error);
      setIsProcessing(false);
    }
  };

  const currentAPY = getCurrentAPY(currentProtocol as Protocol || Protocol.NONE);
  const userBalanceFormatted = userBalance ? formatUnits(userBalance as bigint, 18) : '0';
  const totalValueLocked = totalSupply ? formatUnits(totalSupply as bigint, 18) : '0';

  return (
    <Container>
      <Header>
        <h1>YieldMax</h1>
        <p>AI-Powered Cross-Chain Yield Optimization</p>
      </Header>

      <StatsGrid>
        <StatCard whileHover={{ scale: 1.02 }}>
          <h3>Your Balance</h3>
          <div className="value">{parseFloat(userBalanceFormatted).toFixed(2)} ymUSDC</div>
          <div className="subtext">Vault Shares</div>
        </StatCard>
        
        <StatCard whileHover={{ scale: 1.02 }}>
          <h3>Current APY</h3>
          <div className="value">{currentAPY}%</div>
          <div className="subtext">Annual Percentage Yield</div>
        </StatCard>
        
        <StatCard whileHover={{ scale: 1.02 }}>
          <h3>Total Value Locked</h3>
          <div className="value">${parseFloat(totalValueLocked).toFixed(2)}</div>
          <div className="subtext">Across all users</div>
        </StatCard>
        
        <StatCard whileHover={{ scale: 1.02 }}>
          <h3>Active Strategy</h3>
          <div className="value">{MOCK_YIELDS[currentProtocol as Protocol]?.name || 'None'}</div>
          <div className="subtext">Auto-optimized</div>
        </StatCard>
      </StatsGrid>

      <ActionSection>
        <TabContainer>
          <Tab active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')}>
            Deposit
          </Tab>
          <Tab active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')}>
            Withdraw
          </Tab>
        </TabContainer>

        <InputGroup>
          <input
            type="number"
            placeholder={activeTab === 'deposit' ? 'Amount USDC' : 'Amount ymUSDC'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isProcessing}
          />
        </InputGroup>

        {activeTab === 'deposit' ? (
          <Button
            onClick={handleDeposit}
            disabled={!amount || isProcessing || isDepositLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isDepositLoading ? 'Depositing...' : 'Deposit USDC'}
          </Button>
        ) : (
          <Button
            onClick={handleWithdraw}
            disabled={!amount || isProcessing || isWithdrawLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isWithdrawLoading ? 'Withdrawing...' : 'Withdraw USDC'}
          </Button>
        )}
      </ActionSection>

      <StrategyCard>
        <h2>Available Strategies</h2>
        <ProtocolGrid>
          {Object.entries(MOCK_YIELDS).map(([protocolId, data]) => (
            <ProtocolCard
              key={protocolId}
              active={currentProtocol?.toString() === protocolId}
            >
              <div className="name">{data.name}</div>
              <div className="apy">{data.apy}%</div>
              <div className="risk">Risk: {data.risk}/100</div>
            </ProtocolCard>
          ))}
        </ProtocolGrid>
      </StrategyCard>

      <div style={{ textAlign: 'center', marginTop: '2rem', color: '#666' }}>
        <p>✅ Vault: {CONTRACTS.sepolia.vault}</p>
        <p>🤖 Automation Active: {CONTRACTS.sepolia.automationConnector}</p>
        <p>⛽ Network: Sepolia Testnet</p>
      </div>
    </Container>
  );
}