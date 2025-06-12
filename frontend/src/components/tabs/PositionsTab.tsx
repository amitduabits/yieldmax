// components/tabs/PositionsTab.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, ArrowDownRight, RefreshCw, Plus, 
  TrendingUp, Shield, Clock, DollarSign
} from 'lucide-react';
import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import styled from 'styled-components';
import { CONTRACTS } from '../../config/contracts';

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Button = styled.button<{ variant?: string }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${({ variant }) => variant === 'primary' ? `
    background: #3B82F6;
    color: white;
    &:hover {
      background: #2563EB;
    }
  ` : `
    background: rgba(255, 255, 255, 0.05);
    color: #9CA3AF;
    border: 1px solid rgba(255, 255, 255, 0.1);
    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: white;
    }
  `}
`;

const PositionsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const PositionCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.5rem;
`;

const Modal = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const ModalContent = styled(motion.div)`
  background: #1F2937;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
`;

export const PositionsTab = ({ portfolioData, vaultBalance, totalAssets }: any) => {
  const { address } = useAccount();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // Deposit transaction
  const { config: depositConfig } = usePrepareContractWrite({
    address: CONTRACTS.YieldMaxVault.address as `0x${string}`,
    abi: CONTRACTS.YieldMaxVault.abi,
    functionName: 'deposit',
    args: [parseUnits(depositAmount || '0', 6), address!],
    enabled: !!depositAmount && parseFloat(depositAmount) > 0
  });
  
  const { write: deposit, data: depositTx } = useContractWrite(depositConfig);
  const { isLoading: isDepositing } = useWaitForTransaction({
    hash: depositTx?.hash,
    onSuccess: () => {
      setShowDepositModal(false);
      setDepositAmount('');
    }
  });
  
  // Withdraw transaction  
  const { config: withdrawConfig } = usePrepareContractWrite({
    address: CONTRACTS.YieldMaxVault.address as `0x${string}`,
    abi: CONTRACTS.YieldMaxVault.abi,
    functionName: 'redeem',
    args: [parseUnits(withdrawAmount || '0', 6), address!, address!],
    enabled: !!withdrawAmount && parseFloat(withdrawAmount) > 0
  });
  
  const { write: withdraw, data: withdrawTx } = useContractWrite(withdrawConfig);
  const { isLoading: isWithdrawing } = useWaitForTransaction({
    hash: withdrawTx?.hash,
    onSuccess: () => {
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <Container
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Vault Summary */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
        <h2 className="text-xl font-semibold mb-4">YieldMax Vault</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Your Balance</p>
            <p className="text-2xl font-bold">
              {formatCurrency(portfolioData?.totalValue || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Your Shares</p>
            <p className="text-2xl font-bold">
              {vaultBalance ? formatUnits(vaultBalance, 6) : '0'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Vault Assets</p>
            <p className="text-2xl font-bold">
              {totalAssets ? `$${(Number(formatUnits(totalAssets, 6)) / 1e6).toFixed(2)}M` : '$0'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Share Price</p>
            <p className="text-2xl font-bold">
              ${portfolioData?.vault?.sharePrice?.toFixed(4) || '1.0000'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <ActionButtons>
        <Button variant="primary" onClick={() => setShowDepositModal(true)}>
          <Plus className="w-4 h-4" />
          Deposit
        </Button>
        <Button onClick={() => setShowWithdrawModal(true)}>
          <ArrowUpRight className="w-4 h-4" />
          Withdraw
        </Button>
        <Button>
          <RefreshCw className="w-4 h-4" />
          Rebalance
        </Button>
      </ActionButtons>

      {/* Positions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Active Positions</h3>
        <PositionsGrid>
          {portfolioData?.positions?.map((position: any) => (
            <PositionCard
              key={position.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold">{position.protocol}</h4>
                  <p className="text-sm text-gray-400">{position.chain}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    position.change24h >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {position.change24h >= 0 ? '+' : ''}{position.change24h?.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Value</p>
                  <p className="font-semibold">{formatCurrency(position.value)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Amount</p>
                  <p className="font-semibold">{position.amount.toFixed(2)} {position.asset}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">APY</p>
                  <p className="font-semibold text-green-400">{position.yield}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Daily Earnings</p>
                  <p className="font-semibold">{formatCurrency(position.earnings)}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">Risk: {(position.risk * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">Auto-compound</span>
                    </div>
                  </div>
                  <button className="text-sm text-blue-400 hover:text-blue-300">
                    Manage →
                  </button>
                </div>
              </div>
            </PositionCard>
          ))}
        </PositionsGrid>
      </div>

      {/* Yield History Chart */}
      <PositionCard>
        <h3 className="text-lg font-semibold mb-4">Yield History</h3>
        <YieldHistoryChart positions={portfolioData?.positions || []} />
      </PositionCard>

      {/* Deposit Modal */}
      {showDepositModal && (
        <Modal onClick={() => setShowDepositModal(false)}>
          <ModalContent onClick={(e: any) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Deposit USDC</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount</label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Available: {formatCurrency(portfolioData?.availableBalance || 0)}
                </p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Expected Shares</span>
                  <span>{depositAmount ? (parseFloat(depositAmount) / (portfolioData?.vault?.sharePrice || 1)).toFixed(6) : '0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Share Price</span>
                  <span>${portfolioData?.vault?.sharePrice?.toFixed(4) || '1.0000'}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="primary" 
                  onClick={() => deposit?.()}
                  disabled={!deposit || isDepositing}
                  style={{ flex: 1 }}
                >
                  {isDepositing ? 'Depositing...' : 'Deposit'}
                </Button>
                <Button onClick={() => setShowDepositModal(false)} style={{ flex: 1 }}>
                  Cancel
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <Modal onClick={() => setShowWithdrawModal(false)}>
          <ModalContent onClick={(e: any) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Withdraw USDC</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Shares to Redeem</label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Available: {vaultBalance ? formatUnits(vaultBalance, 6) : '0'} shares
                </p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Expected USDC</span>
                  <span>${withdrawAmount ? (parseFloat(withdrawAmount) * (portfolioData?.vault?.sharePrice || 1)).toFixed(2) : '0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Share Price</span>
                  <span>${portfolioData?.vault?.sharePrice?.toFixed(4) || '1.0000'}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="primary" 
                  onClick={() => withdraw?.()}
                  disabled={!withdraw || isWithdrawing}
                  style={{ flex: 1 }}
                >
                  {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
                </Button>
                <Button onClick={() => setShowWithdrawModal(false)} style={{ flex: 1 }}>
                  Cancel
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

// Yield History Chart Component
const YieldHistoryChart = ({ positions }: any) => {
  // Mock data for demonstration
  const data = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString(),
      yield: Math.random() * 2 + 3
    };
  });

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            style={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#9CA3AF"
            style={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(17, 24, 39, 0.9)',
              border: '1px solid rgba(55, 65, 81, 0.5)',
              borderRadius: '8px'
            }}
            formatter={(value: any) => `${value.toFixed(2)}%`}
          />
          <Line 
            type="monotone" 
            dataKey="yield" 
            stroke="#10B981" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Add missing imports
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';