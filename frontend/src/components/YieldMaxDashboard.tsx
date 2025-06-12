// components/YieldMaxDashboard.tsx - PRODUCTION DASHBOARD WITH REAL DATA
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, DollarSign, 
  Layers, Globe, Wallet, Bell, Settings, ChevronRight,
  ArrowUpRight, ArrowDownRight, Clock, AlertCircle,
  CheckCircle, XCircle, RefreshCw, ExternalLink, Zap,
  Shield, Users, BarChart3, Link, Cpu, GitBranch
} from 'lucide-react';
import { useAccount, useNetwork, useBalance, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { formatUnits, parseUnits } from 'viem';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import styled from 'styled-components';
import { CONTRACTS } from '../config/contracts';

// Import components
import { OverviewTab } from './tabs/OverviewTab';
import { PositionsTab } from './tabs/PositionsTab';
import { MarketsTab } from './tabs/MarketsTab';
import { ChainlinkTab } from './tabs/ChainlinkTab';
import { OptimizationModal } from './OptimizationModal';
import {
  Header,
  Logo,
  NavTabs,
  NavTab,
  HeaderActions,
  MainContent,
  Badge,
  ConnectButton,
  GasIndicator,
  NotificationButton,
  WalletInfo,
  EmptyState
} from './common/StyledComponents';

// Real-time WebSocket hook
const useRealTimeData = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [realTimeData, setRealTimeData] = useState<any>({});
  
  useEffect(() => {
    const websocket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'wss://api.yieldmax.fi/v1/ws');
    
    websocket.onopen = () => {
      console.log('Connected to YieldMax real-time data');
      websocket.send(JSON.stringify({
        action: 'subscribe',
        channels: ['yields', 'gas', 'signals', 'chainlink']
      }));
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setRealTimeData(prev => ({ ...prev, [data.type]: data.data }));
    };
    
    setWs(websocket);
    return () => websocket.close();
  }, []);
  
  return realTimeData;
};

// Main Dashboard Component
export const YieldMaxDashboard = () => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { openConnectModal } = useConnectModal();
  const queryClient = useQueryClient();
  const realTimeData = useRealTimeData();
  
  const [selectedView, setSelectedView] = useState('overview');
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  
  // Fetch real yield data
  const { data: yieldsData, isLoading: yieldsLoading } = useQuery({
    queryKey: ['yields'],
    queryFn: async () => {
      const response = await axios.get('/api/yields');
      return response.data.data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  // Fetch portfolio data
  const { data: portfolioData, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio', address],
    queryFn: async () => {
      if (!address) return null;
      const response = await axios.get(`/api/portfolio?address=${address}`);
      return response.data.data;
    },
    enabled: !!address,
    refetchInterval: 60000 // Refresh every minute
  });
  
  // Fetch transaction history
  const { data: transactions } = useQuery({
    queryKey: ['transactions', address],
    queryFn: async () => {
      if (!address) return [];
      const response = await axios.get(`/api/transactions?address=${address}`);
      return response.data.data;
    },
    enabled: !!address
  });
  
  // Fetch gas prices
  const { data: gasData } = useQuery({
    queryKey: ['gas'],
    queryFn: async () => {
      const response = await axios.get('/api/gas');
      return response.data.data;
    },
    refetchInterval: 15000 // Refresh every 15 seconds
  });
  
  // Fetch Chainlink data
  const { data: chainlinkData } = useQuery({
    queryKey: ['chainlink'],
    queryFn: async () => {
      const response = await axios.get('/api/chainlink');
      return response.data.data;
    },
    refetchInterval: 60000
  });
  
  // Fetch optimization strategies
  const { data: optimizationData, refetch: refetchOptimizations } = useQuery({
    queryKey: ['optimize', address, portfolioData],
    queryFn: async () => {
      if (!address || !portfolioData) return null;
      const response = await axios.post('/api/optimize', {
        address,
        currentPositions: portfolioData.positions,
        riskTolerance: 'medium'
      });
      return response.data.data;
    },
    enabled: !!address && !!portfolioData
  });
  
  // Smart contract interactions
  const { data: vaultBalance } = useContractRead({
    address: CONTRACTS.YieldMaxVault.address as `0x${string}`,
    abi: CONTRACTS.YieldMaxVault.abi,
    functionName: 'balanceOf',
    args: [address!],
    enabled: !!address,
    watch: true
  });
  
  const { data: totalAssets } = useContractRead({
    address: CONTRACTS.YieldMaxVault.address as `0x${string}`,
    abi: CONTRACTS.YieldMaxVault.abi,
    functionName: 'totalAssets',
    watch: true
  });
  
  // Calculate metrics
  const metrics = useMemo(() => {
    if (!portfolioData) return null;
    
    const totalValue = portfolioData.totalValue;
    const dailyEarnings = portfolioData.positions.reduce((sum: number, pos: any) => 
      sum + pos.earnings, 0
    );
    const avgAPY = portfolioData.positions.reduce((sum: number, pos: any, _, arr: any[]) => 
      sum + pos.yield / arr.length, 0
    );
    
    return {
      totalValue,
      dailyEarnings,
      avgAPY,
      totalYieldEarned: portfolioData.totalYieldEarned,
      change24h: portfolioData.change24h
    };
  }, [portfolioData]);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <Header>
        <Logo>
          <Layers className="w-8 h-8 text-blue-500" />
          <span className="text-2xl font-bold">YieldMax</span>
          <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
            AI-Powered
          </Badge>
        </Logo>
        
        <NavTabs>
          <NavTab 
            active={selectedView === 'overview'} 
            onClick={() => setSelectedView('overview')}
          >
            Overview
          </NavTab>
          <NavTab 
            active={selectedView === 'positions'} 
            onClick={() => setSelectedView('positions')}
          >
            Positions
          </NavTab>
          <NavTab 
            active={selectedView === 'markets'} 
            onClick={() => setSelectedView('markets')}
          >
            Markets
          </NavTab>
          <NavTab 
            active={selectedView === 'chainlink'} 
            onClick={() => setSelectedView('chainlink')}
          >
            <Link className="w-4 h-4 mr-1" />
            Chainlink
          </NavTab>
        </NavTabs>
        
        <HeaderActions>
          <GasIndicator data={gasData} />
          <NotificationButton />
          {isConnected ? (
            <WalletInfo address={address} />
          ) : (
            <ConnectButton onClick={openConnectModal}>
              Connect Wallet
            </ConnectButton>
          )}
        </HeaderActions>
      </Header>
      
      {/* Main Content */}
      <MainContent>
        {!isConnected ? (
          <EmptyState onConnect={openConnectModal} />
        ) : (
          <AnimatePresence mode="wait">
            {selectedView === 'overview' && (
              <OverviewTab 
                metrics={metrics}
                portfolioData={portfolioData}
                yieldsData={yieldsData}
                transactions={transactions}
                optimizationData={optimizationData}
                onOptimize={() => setShowOptimizationModal(true)}
              />
            )}
            {selectedView === 'positions' && (
              <PositionsTab 
                portfolioData={portfolioData}
                vaultBalance={vaultBalance}
                totalAssets={totalAssets}
              />
            )}
            {selectedView === 'markets' && (
              <MarketsTab 
                yieldsData={yieldsData}
                gasData={gasData}
                realTimeData={realTimeData}
              />
            )}
            {selectedView === 'chainlink' && (
              <ChainlinkTab 
                chainlinkData={chainlinkData}
                portfolioData={portfolioData}
              />
            )}
          </AnimatePresence>
        )}
      </MainContent>
      
      {/* Optimization Modal */}
      <OptimizationModal
        isOpen={showOptimizationModal}
        onClose={() => setShowOptimizationModal(false)}
        strategies={optimizationData?.strategies || []}
        onExecute={executeStrategy}
      />
    </div>
  );
  
  async function executeStrategy(strategy: any) {
    console.log('Executing strategy:', strategy);
    // Implementation for executing cross-chain strategy
    setShowOptimizationModal(false);
  }
};