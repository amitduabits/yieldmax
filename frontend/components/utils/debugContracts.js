// utils/debugContracts.js
import { ethers } from 'ethers';
import { ENHANCED_CONTRACTS, ENHANCED_STRATEGY_ABI, ORACLE_MANAGER_ABI } from '../lib/contracts/enhanced-contracts';

export async function debugContracts() {
  console.log('🔍 Debugging YieldMax Contracts...\n');
  
  try {
    // Check if MetaMask is available
    if (!window.ethereum) {
      console.error('❌ MetaMask not found!');
      return;
    }

    // Get provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    console.log('📡 Network:', network.name, 'Chain ID:', network.chainId);
    
    // Check if on Sepolia
    if (network.chainId !== 11155111) {
      console.error('❌ Not on Sepolia! Please switch to Sepolia testnet');
      return;
    }

    console.log('\n📄 Contract Addresses:');
    console.log('Strategy Engine:', ENHANCED_CONTRACTS.sepolia.strategyEngine);
    console.log('Oracle Manager:', ENHANCED_CONTRACTS.sepolia.oracleManager);
    console.log('Vault:', ENHANCED_CONTRACTS.sepolia.vault);
    
    // Test Strategy Engine
    console.log('\n🤖 Testing Strategy Engine...');
    try {
      const strategyEngine = new ethers.Contract(
        ENHANCED_CONTRACTS.sepolia.strategyEngine,
        ENHANCED_STRATEGY_ABI,
        provider
      );
      
      // Check if contract exists
      const code = await provider.getCode(ENHANCED_CONTRACTS.sepolia.strategyEngine);
      if (code === '0x') {
        console.error('❌ Strategy Engine contract not deployed at this address!');
        return;
      }
      console.log('✅ Strategy Engine contract found');
      
      // Try to call getCurrentStrategy
      console.log('📊 Calling getCurrentStrategy...');
      const strategy = await strategyEngine.getCurrentStrategy();
      console.log('Current Strategy:', {
        protocol: strategy.protocolName,
        apy: Number(strategy.expectedAPY) / 100 + '%',
        riskScore: Number(strategy.riskScore),
        confidence: Number(strategy.confidence)
      });
    } catch (error) {
      console.error('❌ Strategy Engine Error:', error.message);
    }

    // Test Oracle Manager
    console.log('\n🔮 Testing Oracle Manager...');
    try {
      const oracleManager = new ethers.Contract(
        ENHANCED_CONTRACTS.sepolia.oracleManager,
        ORACLE_MANAGER_ABI,
        provider
      );
      
      const code = await provider.getCode(ENHANCED_CONTRACTS.sepolia.oracleManager);
      if (code === '0x') {
        console.error('❌ Oracle Manager contract not deployed at this address!');
        return;
      }
      console.log('✅ Oracle Manager contract found');
      
      // Try to get yield data
      console.log('📊 Getting yield data...');
      const yields = await oracleManager.getLatestYieldData();
      console.log('Protocol Yields:', {
        aave: Number(yields.aaveAPY) / 100 + '%',
        compound: Number(yields.compoundAPY) / 100 + '%',
        yearn: Number(yields.yearnAPY) / 100 + '%',
        curve: Number(yields.curveAPY) / 100 + '%'
      });
    } catch (error) {
      console.error('❌ Oracle Manager Error:', error.message);
    }

    // Test Vault
    console.log('\n🏦 Testing Vault...');
    try {
      const vault = new ethers.Contract(
        ENHANCED_CONTRACTS.sepolia.vault,
        ['function totalAssets() view returns (uint256)'],
        provider
      );
      
      const totalAssets = await vault.totalAssets();
      console.log('Total Assets:', ethers.utils.formatUnits(totalAssets, 6), 'USDC');
    } catch (error) {
      console.error('❌ Vault Error:', error.message);
    }

  } catch (error) {
    console.error('❌ General Error:', error);
  }
}

// Run in console: debugContracts()