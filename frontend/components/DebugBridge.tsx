import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import { useAccount, useNetwork } from 'wagmi';

const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: #1a1a1a;
  border-radius: 12px;
`;

const Section = styled.div`
  margin-bottom: 2rem;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
`;

const Title = styled.h3`
  color: #3b82f6;
  margin-bottom: 1rem;
`;

const Info = styled.div`
  font-family: monospace;
  font-size: 0.875rem;
  margin: 0.5rem 0;
  color: #e0e0e0;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 1rem;
  
  &:hover {
    background: #2563eb;
  }
`;

const Success = styled.div`
  color: #10b981;
  margin: 0.5rem 0;
`;

const Error = styled.div`
  color: #ef4444;
  margin: 0.5rem 0;
`;

export default function DebugBridge() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const contracts = {
    sepolia: {
      bridge: '0x537A6FFA3c76eD8B440cF960EF1611a5Fa114ecD',
      usdc: '0xe5f46A2dD1fCDdCDb86b3D9C1D23065B1572F818',
      crossChainManager: '0xC033b4Eea791ba83C0FcDAC8cD67c563B5b98eC3',
    },
    arbitrum: {
      bridge: '0x58Ea4Dd03339A2EBEaa9C81Ee02Abaaa4F9956ce',
      usdc: '0x0D6aF2D2bcEaf53B29a12ac4331509E36D810CCf',
    }
  };

  const checkContract = async (name: string, address: string) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const code = await provider.getCode(address);
      const hasCode = code !== '0x';
      
      setResults((prev: any) => ({
        ...prev,
        [name]: {
          address,
          exists: hasCode,
          codeLength: code.length,
        }
      }));

      if (hasCode) {
        // Check for specific function signatures
        const signatures = [
          'bridgeTokens(uint64,uint256)',
          'bridgeTokens(address,uint256,uint64)',
          'sendMessage(uint64,address,string,bytes)',
          'bridge(address,uint256,uint64)',
          'transferTokens(uint64,address,uint256)',
          'balanceOf(address)',
          'approve(address,uint256)',
        ];

        const functionChecks: any = {};
        for (const sig of signatures) {
          try {
            const functionId = ethers.utils.id(sig).slice(0, 10);
            functionChecks[sig] = code.includes(functionId.slice(2));
          } catch (e) {
            functionChecks[sig] = false;
          }
        }

        setResults((prev: any) => ({
          ...prev,
          [name]: {
            ...prev[name],
            functions: functionChecks,
          }
        }));
      }
    } catch (error: any) {
      setResults((prev: any) => ({
        ...prev,
        [name]: {
          address,
          error: error.message,
        }
      }));
    }
  };

  const checkAllContracts = async () => {
    setLoading(true);
    setResults({});

    // Check Sepolia contracts
    await checkContract('Sepolia Bridge', contracts.sepolia.bridge);
    await checkContract('Sepolia USDC', contracts.sepolia.usdc);
    await checkContract('Sepolia CrossChainManager', contracts.sepolia.crossChainManager);
    
    // Check Arbitrum contracts
    await checkContract('Arbitrum Bridge', contracts.arbitrum.bridge);
    await checkContract('Arbitrum USDC', contracts.arbitrum.usdc);

    setLoading(false);
  };

  const testBridgeCall = async () => {
    if (!address || !window.ethereum) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Test calling the bridge contract with minimal ABI
      const bridgeAddress = contracts.sepolia.bridge;
      const testAbi = ['function bridgeTokens(uint64, uint256)'];
      
      const bridgeContract = new ethers.Contract(bridgeAddress, testAbi, provider);
      
      // Try to estimate gas for a call (this won't actually execute)
      const destChainSelector = '3478487238524512106'; // Arbitrum Sepolia
      const amount = ethers.utils.parseUnits('1', 6); // 1 USDC
      
      try {
        const gasEstimate = await bridgeContract.estimateGas.bridgeTokens(
          destChainSelector,
          amount,
          { from: address }
        );
        
        setResults((prev: any) => ({
          ...prev,
          bridgeTest: {
            success: true,
            gasEstimate: gasEstimate.toString(),
            message: 'bridgeTokens function exists and is callable!'
          }
        }));
      } catch (error: any) {
        setResults((prev: any) => ({
          ...prev,
          bridgeTest: {
            success: false,
            error: error.message,
            reason: error.reason || 'Unknown',
          }
        }));
      }
    } catch (error: any) {
      setResults((prev: any) => ({
        ...prev,
        bridgeTest: {
          success: false,
          error: error.message,
        }
      }));
    }
  };

  return (
    <Container>
      <h2>Bridge Contract Debugger</h2>
      
      <Section>
        <Title>Connection Status</Title>
        <Info>Wallet Connected: {isConnected ? 'Yes' : 'No'}</Info>
        <Info>Address: {address || 'Not connected'}</Info>
        <Info>Chain: {chain?.name || 'Not connected'} ({chain?.id})</Info>
      </Section>

      <Section>
        <Button onClick={checkAllContracts} disabled={loading}>
          {loading ? 'Checking...' : 'Check All Contracts'}
        </Button>
        <Button onClick={testBridgeCall} disabled={!isConnected || loading}>
          Test Bridge Function
        </Button>
      </Section>

      {Object.entries(results).map(([name, result]: [string, any]) => (
        <Section key={name}>
          <Title>{name}</Title>
          {result.error ? (
            <Error>Error: {result.error}</Error>
          ) : (
            <>
              <Info>Address: {result.address}</Info>
              <Info>
                Contract Exists: {' '}
                {result.exists ? (
                  <Success>✓ Yes (code length: {result.codeLength})</Success>
                ) : (
                  <Error>✗ No</Error>
                )}
              </Info>
              
              {result.functions && (
                <>
                  <Info style={{ marginTop: '1rem' }}>Functions found:</Info>
                  {Object.entries(result.functions).map(([func, found]: [string, any]) => (
                    <Info key={func} style={{ marginLeft: '1rem' }}>
                      {func}: {found ? <Success>✓</Success> : <Error>✗</Error>}
                    </Info>
                  ))}
                </>
              )}
              
              {result.success !== undefined && (
                <>
                  <Info style={{ marginTop: '1rem' }}>Bridge Test Result:</Info>
                  {result.success ? (
                    <Success>{result.message} Gas estimate: {result.gasEstimate}</Success>
                  ) : (
                    <Error>Failed: {result.error}</Error>
                  )}
                </>
              )}
            </>
          )}
        </Section>
      ))}
    </Container>
  );
}