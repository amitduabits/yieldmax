import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import { useAccount, useNetwork } from 'wagmi';
import { ArrowRight, AlertCircle } from 'lucide-react';

const BridgeContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
`;

const Card = styled.div`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(10px);
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const ChainSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
`;

const ChainBox = styled.div`
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const ChainLabel = styled.div`
  font-size: 0.875rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
`;

const ChainName = styled.div`
  font-weight: 600;
  color: #f1f5f9;
`;

const ArrowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
`;

const InputSection = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid #475569;
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }

  &::placeholder {
    color: #64748b;
  }
`;

const InfoBox = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: #94a3b8;
  font-size: 0.875rem;
`;

const InfoValue = styled.span`
  color: #f1f5f9;
  font-weight: 500;
`;

const ErrorBox = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #fca5a5;
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Contract addresses from your deployment
const CONTRACTS = {
  sepolia: {
    crossChainManager: '0xC033b4Eea791ba83C0FcDAC8cD67c563B5b98eC3',
    usdc: '0xe5f46A2dD1fCDdCDb86b3D9C1D23065B1572F818',
    linkToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
    chainSelector: 16015286601757825753n, // Sepolia chain selector
  },
  arbitrumSepolia: {
    crossChainManager: '0x58Ea4Dd03339A2EBEaa9C81Ee02Abaaa4F9956ce', // This needs to be updated to actual CrossChainManager
    usdc: '0x0D6aF2D2bcEaf53B29a12ac4331509E36D810CCf',
    linkToken: '0xb1D4538B4571d411F07960EF2838Ce337FE1E80E', // Arbitrum Sepolia LINK
    chainSelector: 3478487238524512106n, // Arbitrum Sepolia chain selector
  },
};

// CrossChainManager ABI - the actual contract interface
const CROSS_CHAIN_MANAGER_ABI = [
  {
    inputs: [
      { internalType: 'uint64', name: 'destinationChainSelector', type: 'uint64' },
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'string', name: 'action', type: 'string' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'sendMessage',
    outputs: [{ internalType: 'bytes32', name: 'messageId', type: 'bytes32' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint64', name: 'chainSelector', type: 'uint64' },
      { internalType: 'address', name: 'remoteVault', type: 'address' },
    ],
    name: 'configureChain',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const ERC20_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export default function BridgeInterface() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState('0');
  const [linkBalance, setLinkBalance] = useState('0');

  // Determine source and destination chains
  const isOnSepolia = chain?.id === 11155111;
  const sourceChain = isOnSepolia ? 'Sepolia' : 'Arbitrum Sepolia';
  const destChain = isOnSepolia ? 'Arbitrum Sepolia' : 'Sepolia';
  const sourceConfig = isOnSepolia ? CONTRACTS.sepolia : CONTRACTS.arbitrumSepolia;
  const destConfig = isOnSepolia ? CONTRACTS.arbitrumSepolia : CONTRACTS.sepolia;

  // Fetch balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address || !window.ethereum) return;

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Get USDC balance
        const usdcContract = new ethers.Contract(
          sourceConfig.usdc,
          ERC20_ABI,
          provider
        );
        const usdcBal = await usdcContract.balanceOf(address);
        setBalance(ethers.utils.formatUnits(usdcBal, 6));

        // Get LINK balance
        const linkContract = new ethers.Contract(
          sourceConfig.linkToken,
          ERC20_ABI,
          provider
        );
        const linkBal = await linkContract.balanceOf(address);
        setLinkBalance(ethers.utils.formatUnits(linkBal, 18));
      } catch (err) {
        console.error('Error fetching balances:', err);
      }
    };

    fetchBalances();
  }, [address, chain?.id]);

  const handleBridge = async () => {
    if (!address || !amount || !window.ethereum) return;

    setLoading(true);
    setError('');

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Create contract instances
      const crossChainManager = new ethers.Contract(
        sourceConfig.crossChainManager,
        CROSS_CHAIN_MANAGER_ABI,
        signer
      );

      const usdcContract = new ethers.Contract(
        sourceConfig.usdc,
        ERC20_ABI,
        signer
      );

      // Parse amount
      const amountWei = ethers.utils.parseUnits(amount, 6);

      // Step 1: Approve USDC to CrossChainManager
      console.log('Approving USDC...');
      const allowance = await usdcContract.allowance(address, sourceConfig.crossChainManager);
      
      if (allowance.lt(amountWei)) {
        const approveTx = await usdcContract.approve(
          sourceConfig.crossChainManager,
          amountWei
        );
        console.log('Approval tx:', approveTx.hash);
        await approveTx.wait();
        console.log('Approval confirmed');
      }

      // Step 2: Encode the bridge data
      // The data should include the token address and amount
      const abiCoder = new ethers.utils.AbiCoder();
      const bridgeData = abiCoder.encode(
        ['address', 'uint256', 'address'],
        [sourceConfig.usdc, amountWei, address]
      );

      // Step 3: Send cross-chain message
      console.log('Sending cross-chain message...');
      const tx = await crossChainManager.sendMessage(
        destConfig.chainSelector,
        destConfig.crossChainManager, // Receiver is the CrossChainManager on destination
        'bridge', // Action
        bridgeData,
        { value: 0 } // No ETH needed, uses LINK for fees
      );

      console.log('Bridge tx:', tx.hash);
      const receipt = await tx.wait();
      console.log('Bridge confirmed!', receipt);

      // Clear form
      setAmount('');
      alert(`Bridge successful! Transaction: ${tx.hash}`);
    } catch (err: any) {
      console.error('Bridge error:', err);
      setError(err.message || 'Bridge failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BridgeContainer>
      <Card>
        <Title>Bridge USDC</Title>

        <ChainSelector>
          <ChainBox>
            <ChainLabel>From</ChainLabel>
            <ChainName>{sourceChain}</ChainName>
          </ChainBox>
          <ArrowContainer>
            <ArrowRight size={24} />
          </ArrowContainer>
          <ChainBox>
            <ChainLabel>To</ChainLabel>
            <ChainName>{destChain}</ChainName>
          </ChainBox>
        </ChainSelector>

        <InputSection>
          <Label>Amount</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
        </InputSection>

        <InfoBox>
          <InfoRow>
            <InfoLabel>Your USDC Balance</InfoLabel>
            <InfoValue>{balance} USDC</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Your LINK Balance</InfoLabel>
            <InfoValue>{linkBalance} LINK</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Bridge Fee</InfoLabel>
            <InfoValue>Paid in LINK</InfoValue>
          </InfoRow>
        </InfoBox>

        {error && (
          <ErrorBox>
            <AlertCircle size={20} />
            {error}
          </ErrorBox>
        )}

        <Button
          onClick={handleBridge}
          disabled={!isConnected || loading || !amount || parseFloat(amount) <= 0}
        >
          {loading ? 'Processing...' : 
           !isConnected ? 'Connect Wallet' :
           parseFloat(amount) > parseFloat(balance) ? 'Insufficient Balance' :
           parseFloat(linkBalance) === 0 ? 'No LINK for fees' :
           'Bridge USDC'}
        </Button>
      </Card>
    </BridgeContainer>
  );
}