// components/OptimizationModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, TrendingUp, Shield, BarChart3, Zap, Cpu,
    ArrowRight, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import styled from 'styled-components';

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
`;

const ModalContainer = styled(motion.div)`
  background: #1F2937;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  items-center: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

const StrategyGrid = styled.div`
  display: grid;
  gap: 1rem;
`;

const StrategyCard = styled(motion.div) <{ selected?: boolean }>`
  background: ${({ selected }) => selected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)'};
  border: 2px solid ${({ selected }) => selected ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-1px);
  }
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.5rem;
  padding: 0.75rem;
  text-align: center;
`;

const ChangesList = styled.div`
  space-y: 0.5rem;
  margin-top: 1rem;
  max-height: 200px;
  overflow-y: auto;
`;

const ChangeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  font-size: 0.875rem;
`;

const ExecuteButton = styled(motion.button)`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1.5rem;
  position: relative;
  overflow: hidden;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

interface Strategy {
    id: string;
    type: string;
    name: string;
    description: string;
    changes: any[];
    projectedAPY: number;
    currentAPY: number;
    monthlyGain: number;
    riskLevel: string;
    confidence: number;
    gasEstimate: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    strategies: Strategy[];
    onExecute: (strategy: Strategy) => void;
}

export const OptimizationModal = ({ isOpen, onClose, strategies, onExecute }: Props) => {
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);

    const getStrategyIcon = (type: string) => {
        switch (type) {
            case 'yield': return <TrendingUp className="w-6 h-6 text-green-400" />;
            case 'safety': return <Shield className="w-6 h-6 text-blue-400" />;
            case 'balanced': return <BarChart3 className="w-6 h-6 text-purple-400" />;
            case 'gas': return <Zap className="w-6 h-6 text-yellow-400" />;
            default: return <Cpu className="w-6 h-6 text-gray-400" />;
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'low': return '#10B981';
            case 'medium': return '#F59E0B';
            case 'high': return '#EF4444';
            default: return '#9CA3AF';
        }
    };

    const handleExecute = async () => {
        if (!selectedStrategy) return;

        setIsExecuting(true);
        await onExecute(selectedStrategy);
        setIsExecuting(false);
        onClose();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <Overlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <ModalContainer
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <ModalHeader>
                        <div>
                            <h2 className="text-2xl font-bold">AI Optimization Strategies</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                Select a strategy to optimize your portfolio
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </ModalHeader>

                    <ModalBody>
                        <StrategyGrid>
                            {strategies.map((strategy) => (
                                <StrategyCard
                                    key={strategy.id}
                                    selected={selectedStrategy?.id === strategy.id}
                                    onClick={() => setSelectedStrategy(strategy)}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {getStrategyIcon(strategy.type)}
                                            <div>
                                                <h3 className="font-semibold text-lg">{strategy.name}</h3>
                                                <p className="text-sm text-gray-400">{strategy.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="px-2 py-1 rounded text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${getRiskColor(strategy.riskLevel)}20`,
                                                    color: getRiskColor(strategy.riskLevel),
                                                    border: `1px solid ${getRiskColor(strategy.riskLevel)}40`
                                                }}
                                            >
                                                {strategy.riskLevel} risk
                                            </span>
                                        </div>
                                    </div>

                                    <MetricGrid>
                                        <MetricCard>
                                            <p className="text-xs text-gray-400">Current APY</p>
                                            <p className="text-lg font-bold">{strategy.currentAPY.toFixed(2)}%</p>
                                        </MetricCard>
                                        <MetricCard>
                                            <p className="text-xs text-gray-400">Projected APY</p>
                                            <p className="text-lg font-bold text-green-400">{strategy.projectedAPY.toFixed(2)}%</p>
                                        </MetricCard>
                                        <MetricCard>
                                            <p className="text-xs text-gray-400">Monthly Gain</p>
                                            <p className="text-lg font-bold text-blue-400">{formatCurrency(strategy.monthlyGain)}</p>
                                        </MetricCard>
                                        <MetricCard>
                                            <p className="text-xs text-gray-400">Confidence</p>
                                            <p className="text-lg font-bold">{(strategy.confidence * 100).toFixed(0)}%</p>
                                        </MetricCard>
                                    </MetricGrid>

                                    {strategy.changes.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm font-medium mb-2">Proposed Changes:</p>
                                            <ChangesList>
                                                {strategy.changes.slice(0, 3).map((change, index) => (
                                                    <ChangeItem key={index}>
                                                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="text-sm">
                                                                {change.action === 'move' ? (
                                                                    <>Move {formatCurrency(change.amount)} from {change.from} to {change.to}</>
                                                                ) : change.action === 'consolidate' ? (
                                                                    <>Consolidate positions to {change.to}</>
                                                                ) : (
                                                                    change.reason
                                                                )}
                                                            </p>
                                                            {change.apyGain > 0 && (
                                                                <p className="text-xs text-green-400">+{change.apyGain.toFixed(2)}% APY</p>
                                                            )}
                                                        </div>
                                                    </ChangeItem>
                                                ))}
                                            </ChangesList>
                                            {strategy.changes.length > 3 && (
                                                <p className="text-xs text-gray-400 mt-2 text-center">
                                                    +{strategy.changes.length - 3} more changes
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </StrategyCard>
                            ))}         
                        
                        </StrategyGrid>
                    </ModalBody>
                </ModalContainer>
            </Overlay>
        </AnimatePresence>
    )
}