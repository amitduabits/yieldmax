// components/tabs/OverviewTab.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Activity, DollarSign, 
  ArrowUpRight, ArrowDownRight, Zap, Shield
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import styled from 'styled-components';

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const StatCard = styled(motion.div)<{ accent?: string }>`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: radial-gradient(
      circle at top right,
      ${({ accent }) => accent || 'rgba(59, 130, 246, 0.2)'},
      transparent
    );
    pointer-events: none;
  }
`;

const ChartSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.5rem;
`;

export const OverviewTab = ({ 
  metrics, 
  portfolioData, 
  yieldsData, 
  transactions,
  optimizationData,
  onOptimize 
}: any) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Prepare chart data
  const performanceData = generatePerformanceData(portfolioData);
  const allocationData = portfolioData?.positions.map((pos: any) => ({
    name: pos.protocol,
    value: pos.value,
    chain: pos.chain
  })) || [];

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <Container
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Stats Cards */}
      <StatsGrid>
        <StatCard 
          accent="rgba(59, 130, 246, 0.2)"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Portfolio Value</p>
              <h3 className="text-2xl font-bold">
                {formatCurrency(metrics?.totalValue || 0)}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                {metrics?.change24h >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm ${metrics?.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {metrics?.change24h >= 0 ? '+' : ''}{metrics?.change24h?.toFixed(2)}%
                </span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400" />
          </div>
        </StatCard>

        <StatCard 
          accent="rgba(16, 185, 129, 0.2)"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Average APY</p>
              <h3 className="text-2xl font-bold text-green-400">
                {metrics?.avgAPY?.toFixed(2)}%
              </h3>
              <p className="text-xs text-gray-500 mt-2">Across all positions</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </StatCard>

        <StatCard 
          accent="rgba(139, 92, 246, 0.2)"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Daily Earnings</p>
              <h3 className="text-2xl font-bold">
                {formatCurrency(metrics?.dailyEarnings || 0)}
              </h3>
              <p className="text-xs text-gray-500 mt-2">Estimated</p>
            </div>
            <Activity className="w-8 h-8 text-purple-400" />
          </div>
        </StatCard>

        <StatCard 
          accent="rgba(245, 158, 11, 0.2)"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Yield Earned</p>
              <h3 className="text-2xl font-bold">
                {formatCurrency(metrics?.totalYieldEarned || 0)}
              </h3>
              <p className="text-xs text-gray-500 mt-2">All time</p>
            </div>
            <Shield className="w-8 h-8 text-yellow-400" />
          </div>
        </StatCard>
      </StatsGrid>

      {/* AI Optimization Alert */}
      {optimizationData?.strategies?.length > 0 && (
        <motion.div
          className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  AI Found {optimizationData.strategies.length} Optimization Opportunities
                </h3>
                <p className="text-sm text-gray-400">
                  Potential additional earnings: {formatCurrency(optimizationData.strategies[0]?.monthlyGain || 0)}/month
                </p>
              </div>
            </div>
            <button
              onClick={onOptimize}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              View Strategies
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <ChartSection>
        {/* Portfolio Performance */}
        <ChartCard>
          <h3 className="text-lg font-semibold mb-4">Portfolio Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                style={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#9CA3AF"
                style={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: '1px solid rgba(55, 65, 81, 0.5)',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#valueGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Protocol Allocation */}
        <ChartCard>
          <h3 className="text-lg font-semibold mb-4">Protocol Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {allocationData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: '1px solid rgba(55, 65, 81, 0.5)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartSection>

      {/* Recent Transactions */}
      <ChartCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <button className="text-sm text-blue-400 hover:text-blue-300">
            View All →
          </button>
        </div>
        <TransactionList transactions={transactions?.slice(0, 5) || []} />
      </ChartCard>

      {/* Top Yields */}
      {yieldsData?.yields && (
        <ChartCard>
          <h3 className="text-lg font-semibold mb-4">Top Yield Opportunities</h3>
          <YieldOpportunities yields={yieldsData.yields.slice(0, 5)} />
        </ChartCard>
      )}
    </Container>
  );
};

// Transaction List Component
const TransactionList = ({ transactions }: any) => {
  return (
    <div className="space-y-3">
      {transactions.map((tx: any) => (
        <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              tx.type === 'deposit' ? 'bg-green-500/20' : 
              tx.type === 'withdraw' ? 'bg-red-500/20' : 'bg-blue-500/20'
            }`}>
              {tx.type === 'deposit' ? <ArrowDownRight className="w-4 h-4 text-green-400" /> :
               tx.type === 'withdraw' ? <ArrowUpRight className="w-4 h-4 text-red-400" /> :
               <RefreshCw className="w-4 h-4 text-blue-400" />}
            </div>
            <div>
              <p className="text-sm font-medium capitalize">{tx.type}</p>
              <p className="text-xs text-gray-400">{tx.protocol}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{tx.amount.toFixed(2)} {tx.asset}</p>
            <p className="text-xs text-gray-400">
              {new Date(tx.timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Yield Opportunities Component
const YieldOpportunities = ({ yields }: any) => {
  return (
    <div className="space-y-3">
      {yields.map((yield: any, index: number) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
          <div>
            <p className="text-sm font-medium">{yield.protocol}</p>
            <p className="text-xs text-gray-400">{yield.chain}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-green-400">{yield.apy.toFixed(2)}% APY</p>
              <p className="text-xs text-gray-400">${(yield.tvl / 1e6).toFixed(1)}M TVL</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper function
function generatePerformanceData(portfolioData: any) {
  if (!portfolioData) return [];
  
  const data = [];
  const currentValue = portfolioData.totalValue;
  const days = 30;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate historical values with some volatility
    const volatility = 0.02;
    const trend = 1.0002; // Slight upward trend
    const randomFactor = 1 + (Math.random() - 0.5) * volatility;
    const value = currentValue * Math.pow(trend, -i) * randomFactor;
    
    data.push({
      date: date.toLocaleDateString(),
      value: Math.round(value)
    });
  }
  
  return data;
}

// Add missing imports
import { RefreshCw } from 'lucide-react';