import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, DollarSign, 
  Layers, Globe, Wallet, Menu, X, ChevronLeft,
  ArrowUpRight, ArrowDownRight, Clock, AlertCircle,
  CheckCircle, RefreshCw, ExternalLink, Zap,
  Shield, Users, BarChart3
} from 'lucide-react';

// ==================== MOBILE-FIRST RESPONSIVE LAYOUT ====================

const YieldMaxMobileApp = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  
  // Mock data for demonstration
  const portfolioData = {
    totalValue: 125430.50,
    change24h: 3.42,
    positions: [
      { protocol: 'Aave', chain: 'Ethereum', value: 45000, apy: 3.2 },
      { protocol: 'Compound', chain: 'Arbitrum', value: 38500, apy: 5.8 },
      { protocol: 'Morpho', chain: 'Polygon', value: 22000, apy: 4.5 },
      { protocol: 'Spark', chain: 'Optimism', value: 19930.50, apy: 6.2 }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Mobile Header */}
      <MobileHeader />
      
      {/* Main Content Area */}
      <motion.main 
        className="pb-20 px-4 pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' && <DashboardView data={portfolioData} />}
          {activeView === 'portfolio' && <PortfolioView data={portfolioData} />}
          {activeView === 'markets' && <MarketsView />}
          {activeView === 'optimize' && <OptimizeView />}
        </AnimatePresence>
      </motion.main>

      {/* Bottom Navigation */}
      <BottomNavigation activeView={activeView} setActiveView={setActiveView} />

      {/* Protocol Details Bottom Sheet */}
      <AnimatePresence>
        {showBottomSheet && (
          <BottomSheet onClose={() => setShowBottomSheet(false)}>
            <ProtocolDetails protocol={selectedProtocol} />
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== PORTFOLIO VIEW ====================

const PortfolioView = ({ data }) => {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold">Your Portfolio</h2>
      
      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/30">
          <p className="text-xs text-gray-400 mb-1">Total Value</p>
          <p className="text-xl font-bold">${(data.totalValue / 1000).toFixed(1)}k</p>
          <p className={`text-xs mt-1 ${data.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.change24h >= 0 ? '+' : ''}{data.change24h}% today
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl p-4 border border-green-500/30">
          <p className="text-xs text-gray-400 mb-1">Total Earnings</p>
          <p className="text-xl font-bold">$2,847</p>
          <p className="text-xs text-green-400 mt-1">All time</p>
        </div>
      </div>
      
      {/* Positions List */}
      <div className="space-y-3">
        <h3 className="font-semibold">Active Positions</h3>
        {data.positions.map((position, index) => (
          <motion.div
            key={index}
            className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold">{position.protocol}</h4>
                <p className="text-xs text-gray-400">{position.chain}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${(position.value / 1000).toFixed(1)}k</p>
                <p className="text-xs text-green-400">{position.apy}% APY</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  style={{ width: `${(position.value / data.totalValue) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">
                {((position.value / data.totalValue) * 100).toFixed(0)}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Add Position Button */}
      <button className="w-full py-3 border border-dashed border-gray-700 rounded-xl text-gray-400 text-sm font-medium hover:border-gray-600 hover:text-gray-300 transition-all">
        + Add New Position
      </button>
    </motion.div>
  );
};

// ==================== PROTOCOL DETAILS ====================

const ProtocolDetails = ({ protocol }) => {
  if (!protocol) return null;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <Layers size={24} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold">{protocol.name}</h3>
          <p className="text-sm text-gray-400">{protocol.chain}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Current APY</p>
          <p className="text-lg font-semibold text-green-400">{protocol.apy}%</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Your Position</p>
          <p className="text-lg font-semibold">${protocol.position || '0'}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">TVL</p>
          <p className="text-lg font-semibold">${protocol.tvl}M</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Risk Score</p>
          <p className="text-lg font-semibold">{protocol.risk}/10</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <button className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl">
          Deposit
        </button>
        <button className="w-full bg-gray-800 text-white font-semibold py-3 rounded-xl">
          Withdraw
        </button>
      </div>
    </div>
  );
};

// ==================== MOBILE HEADER COMPONENT ====================

const MobileHeader = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  
  return (
    <header className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Layers size={20} />
          </div>
          <span className="font-bold text-lg">YieldMax</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="relative p-2">
            <Activity size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </button>
          
          <WalletButton />
        </div>
      </div>
    </header>
  );
};

// ==================== DASHBOARD VIEW ====================

const DashboardView = ({ data }) => {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="space-y-6"
    >
      {/* Portfolio Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <p className="text-white/80 text-sm mb-1">Total Portfolio Value</p>
          <h1 className="text-3xl font-bold mb-2">
            ${data.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h1>
          <div className="flex items-center gap-2">
            {data.change24h >= 0 ? (
              <TrendingUp size={16} className="text-green-300" />
            ) : (
              <TrendingDown size={16} className="text-red-300" />
            )}
            <span className={data.change24h >= 0 ? 'text-green-300' : 'text-red-300'}>
              {data.change24h >= 0 ? '+' : ''}{data.change24h}% (24h)
            </span>
          </div>
        </div>
        
        {/* Animated background pattern */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Avg APY"
          value="4.9%"
          icon={<TrendingUp size={16} />}
          color="text-green-400"
        />
        <StatCard
          title="Daily Earnings"
          value="$16.84"
          icon={<DollarSign size={16} />}
          color="text-blue-400"
        />
      </div>

      {/* Portfolio Distribution */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
        <h3 className="font-semibold mb-4 flex items-center justify-between">
          Portfolio Distribution
          <PieChart size={16} className="text-gray-400" />
        </h3>
        <PortfolioDonutChart data={data.positions} />
      </div>

      {/* Recent Activity */}
      <RecentActivityList />
    </motion.div>
  );
};

// ==================== RECENT ACTIVITY LIST ====================

const RecentActivityList = () => {
  const activities = [
    {
      id: 1,
      type: 'deposit',
      protocol: 'Aave',
      chain: 'Arbitrum',
      amount: '1,000 USDC',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      id: 2,
      type: 'rebalance',
      from: 'Compound',
      to: 'Morpho',
      amount: '5,000 USDC',
      time: '5 hours ago',
      status: 'completed'
    },
    {
      id: 3,
      type: 'withdraw',
      protocol: 'Spark',
      chain: 'Optimism',
      amount: '2,500 USDC',
      time: '1 day ago',
      status: 'completed'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight size={16} className="text-green-400" />;
      case 'withdraw':
        return <ArrowUpRight size={16} className="text-red-400" />;
      case 'rebalance':
        return <RefreshCw size={16} className="text-blue-400" />;
      default:
        return <Activity size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
      <h3 className="font-semibold mb-4 flex items-center justify-between">
        Recent Activity
        <span className="text-xs text-gray-400">View all</span>
      </h3>
      
      <div className="space-y-3">
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: activity.id * 0.1 }}
          >
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-medium capitalize">{activity.type}</p>
              <p className="text-xs text-gray-400">
                {activity.protocol || `${activity.from} → ${activity.to}`} • {activity.chain}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium">{activity.amount}</p>
              <p className="text-xs text-gray-400">{activity.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ==================== PORTFOLIO DONUT CHART ====================

const PortfolioDonutChart = ({ data }) => {
  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];
  
  const chartData = data.map((item, index) => ({
    name: item.protocol,
    value: item.value,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="relative h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `$${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: 'rgba(17, 24, 39, 0.9)',
              border: '1px solid rgba(55, 65, 81, 0.5)',
              borderRadius: '8px',
              backdropFilter: 'blur(8px)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold">{data.length}</p>
          <p className="text-xs text-gray-400">Positions</p>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-400">{item.name}</span>
            <span className="text-xs font-medium ml-auto">
              ${(item.value / 1000).toFixed(1)}k
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== MARKETS VIEW WITH ADVANCED CHARTS ====================

const MarketsView = () => {
  const [selectedMetric, setSelectedMetric] = useState('apy');
  
  // Mock market data
  const marketData = [
    { protocol: 'Aave', ethereum: 3.2, arbitrum: 4.1, polygon: 3.8, optimism: 3.5 },
    { protocol: 'Compound', ethereum: 2.8, arbitrum: 5.8, polygon: 4.2, optimism: 4.5 },
    { protocol: 'Morpho', ethereum: 4.5, arbitrum: 5.2, polygon: 4.8, optimism: 5.0 },
    { protocol: 'Spark', ethereum: 5.1, arbitrum: 6.2, polygon: 5.8, optimism: 6.0 }
  ];

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold">Market Overview</h2>
      
      {/* Metric Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['apy', 'tvl', 'volume', 'risk'].map((metric) => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              selectedMetric === metric
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {metric.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Heatmap Chart */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
        <h3 className="font-semibold mb-4">Cross-Chain APY Comparison</h3>
        <HeatmapChart data={marketData} />
      </div>

      {/* Radar Chart */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
        <h3 className="font-semibold mb-4">Protocol Performance</h3>
        <ProtocolRadarChart />
      </div>

      {/* Top Opportunities */}
      <TopOpportunitiesList />
    </motion.div>
  );
};

// ==================== TOP OPPORTUNITIES LIST ====================

const TopOpportunitiesList = () => {
  const opportunities = [
    {
      id: 1,
      type: 'yield',
      title: 'Higher APY Available',
      description: 'Move to Spark on Arbitrum for +2.1% APY',
      profit: '+$125/month',
      confidence: 92,
      urgent: true
    },
    {
      id: 2,
      type: 'gas',
      title: 'Low Gas Window',
      description: 'Ethereum gas at 15 gwei (70% below avg)',
      profit: 'Save $45',
      confidence: 100,
      urgent: true
    },
    {
      id: 3,
      type: 'rebalance',
      title: 'Optimize Allocation',
      description: 'Rebalance for better risk/reward ratio',
      profit: '+$80/month',
      confidence: 85,
      urgent: false
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Top Opportunities</h3>
      {opportunities.map((opp) => (
        <motion.div
          key={opp.id}
          className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-medium text-sm flex items-center gap-2">
                {opp.title}
                {opp.urgent && (
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                    Urgent
                  </span>
                )}
              </h4>
              <p className="text-xs text-gray-400 mt-1">{opp.description}</p>
            </div>
            <span className="text-green-400 font-medium text-sm">{opp.profit}</span>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Confidence</span>
              <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${opp.confidence}%` }}
                />
              </div>
              <span className="text-xs font-medium">{opp.confidence}%</span>
            </div>
            
            <button className="text-xs text-blue-400 font-medium">
              Execute →
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ==================== HEATMAP VISUALIZATION ====================

const HeatmapChart = ({ data }) => {
  const getColor = (value) => {
    const max = 6.5;
    const intensity = value / max;
    return `rgba(59, 130, 246, ${intensity})`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left text-xs text-gray-400 pb-2">Protocol</th>
            <th className="text-center text-xs text-gray-400 pb-2">ETH</th>
            <th className="text-center text-xs text-gray-400 pb-2">ARB</th>
            <th className="text-center text-xs text-gray-400 pb-2">POLY</th>
            <th className="text-center text-xs text-gray-400 pb-2">OP</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.protocol}>
              <td className="py-2 text-sm font-medium">{row.protocol}</td>
              {['ethereum', 'arbitrum', 'polygon', 'optimism'].map((chain) => (
                <td key={chain} className="text-center p-1">
                  <div
                    className="rounded-lg p-2 text-xs font-medium transition-all hover:scale-110"
                    style={{
                      backgroundColor: getColor(row[chain]),
                      color: row[chain] > 4 ? 'white' : 'rgba(255,255,255,0.7)'
                    }}
                  >
                    {row[chain]}%
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ==================== PROTOCOL RADAR CHART ====================

const ProtocolRadarChart = () => {
  const data = [
    { metric: 'APY', aave: 75, compound: 85, morpho: 80, spark: 90 },
    { metric: 'TVL', aave: 95, compound: 85, morpho: 70, spark: 60 },
    { metric: 'Security', aave: 90, compound: 88, morpho: 82, spark: 80 },
    { metric: 'Liquidity', aave: 88, compound: 82, morpho: 75, spark: 70 },
    { metric: 'Stability', aave: 92, compound: 90, morpho: 85, spark: 82 },
    { metric: 'Innovation', aave: 70, compound: 75, morpho: 85, spark: 88 }
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid 
            stroke="rgba(255,255,255,0.1)" 
            radialLines={false}
          />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            domain={[0, 100]} 
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Aave"
            dataKey="aave"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Radar
            name="Compound"
            dataKey="compound"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Radar
            name="Morpho"
            dataKey="morpho"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Radar
            name="Spark"
            dataKey="spark"
            stroke="#F59E0B"
            fill="#F59E0B"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==================== OPTIMIZE VIEW WITH INTERACTIVE ELEMENTS ====================

const OptimizeView = () => {
  const [selectedStrategy, setSelectedStrategy] = useState('yield');
  
  const strategies = [
    {
      id: 'yield',
      name: 'Max Yield',
      icon: <TrendingUp size={20} />,
      description: 'Optimize for highest APY',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'safety',
      name: 'Safety First',
      icon: <Shield size={20} />,
      description: 'Minimize risk exposure',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'balanced',
      name: 'Balanced',
      icon: <BarChart3 size={20} />,
      description: 'Balance risk and reward',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'gas',
      name: 'Gas Efficient',
      icon: <Zap size={20} />,
      description: 'Minimize transaction costs',
      color: 'from-orange-500 to-yellow-500'
    }
  ];

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold">Optimization Strategies</h2>
      
      {/* Strategy Selector */}
      <div className="grid grid-cols-2 gap-3">
        {strategies.map((strategy) => (
          <motion.button
            key={strategy.id}
            onClick={() => setSelectedStrategy(strategy.id)}
            className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${
              selectedStrategy === strategy.id
                ? 'ring-2 ring-white ring-opacity-60'
                : ''
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${strategy.color} opacity-20`} />
            <div className="relative z-10">
              <div className="mb-2">{strategy.icon}</div>
              <h3 className="font-semibold text-sm">{strategy.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{strategy.description}</p>
            </div>
            {selectedStrategy === strategy.id && (
              <motion.div
                layoutId="selectedStrategy"
                className="absolute inset-0 border-2 border-white rounded-xl"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Optimization Preview */}
      <OptimizationPreview strategy={selectedStrategy} />

      {/* Execute Button */}
      <motion.button
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-4 rounded-xl relative overflow-hidden"
        whileTap={{ scale: 0.98 }}
      >
        <span className="relative z-10">Optimize Portfolio</span>
        <motion.div
          className="absolute inset-0 bg-white"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.5 }}
          style={{ opacity: 0.2 }}
        />
      </motion.button>
    </motion.div>
  );
};

// ==================== OPTIMIZATION PREVIEW ====================

const OptimizationPreview = ({ strategy }) => {
  const previewData = {
    yield: {
      title: 'Maximum Yield Strategy',
      changes: [
        { from: 'Aave (ETH)', to: 'Spark (ARB)', amount: '$15,000', gain: '+2.4%' },
        { from: 'Compound (POLY)', to: 'Morpho (OP)', amount: '$8,500', gain: '+1.8%' }
      ],
      summary: {
        currentAPY: '4.2%',
        projectedAPY: '6.8%',
        monthlyGain: '+$215',
        risk: 'Medium'
      }
    },
    safety: {
      title: 'Safety First Strategy',
      changes: [
        { from: 'Morpho (OP)', to: 'Aave (ETH)', amount: '$12,000', gain: '-0.8%' },
        { from: 'Spark (ARB)', to: 'Compound (ETH)', amount: '$5,000', gain: '-1.2%' }
      ],
      summary: {
        currentAPY: '4.2%',
        projectedAPY: '3.5%',
        monthlyGain: '-$45',
        risk: 'Low'
      }
    },
    balanced: {
      title: 'Balanced Strategy',
      changes: [
        { from: 'Aave (ETH)', to: 'Compound (ARB)', amount: '$8,000', gain: '+1.2%' },
        { from: 'Spark (POLY)', to: 'Aave (OP)', amount: '$6,000', gain: '+0.5%' }
      ],
      summary: {
        currentAPY: '4.2%',
        projectedAPY: '5.1%',
        monthlyGain: '+$85',
        risk: 'Medium-Low'
      }
    },
    gas: {
      title: 'Gas Efficient Strategy',
      changes: [
        { from: 'Multiple positions', to: 'Consolidated (ARB)', amount: '$25,000', gain: '+0.3%' }
      ],
      summary: {
        currentAPY: '4.2%',
        projectedAPY: '4.5%',
        monthlyGain: '+$30',
        risk: 'Low',
        gasSavings: '$120/month'
      }
    }
  };

  const data = previewData[strategy] || previewData.balanced;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
      <h3 className="font-semibold mb-4">{data.title}</h3>
      
      {/* Proposed Changes */}
      <div className="space-y-2 mb-4">
        {data.changes.map((change, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{change.from}</span>
              <ArrowUpRight size={14} className="text-gray-600" />
              <span className="text-white">{change.to}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-400">{change.amount}</span>
              <span className={`ml-2 ${change.gain.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {change.gain}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800">
        <div>
          <p className="text-xs text-gray-400">Current APY</p>
          <p className="font-semibold">{data.summary.currentAPY}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Projected APY</p>
          <p className="font-semibold text-green-400">{data.summary.projectedAPY}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Monthly Impact</p>
          <p className={`font-semibold ${data.summary.monthlyGain.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
            {data.summary.monthlyGain}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Risk Level</p>
          <p className="font-semibold">{data.summary.risk}</p>
        </div>
        {data.summary.gasSavings && (
          <div className="col-span-2">
            <p className="text-xs text-gray-400">Gas Savings</p>
            <p className="font-semibold text-blue-400">{data.summary.gasSavings}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== BOTTOM NAVIGATION ====================

const BottomNavigation = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'dashboard', icon: <Activity size={20} />, label: 'Dashboard' },
    { id: 'portfolio', icon: <Layers size={20} />, label: 'Portfolio' },
    { id: 'markets', icon: <Globe size={20} />, label: 'Markets' },
    { id: 'optimize', icon: <Zap size={20} />, label: 'Optimize' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-xl border-t border-gray-800 z-20">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              activeView === item.id
                ? 'text-blue-400'
                : 'text-gray-400'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{
                scale: activeView === item.id ? 1.2 : 1,
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {item.icon}
            </motion.div>
            <span className="text-xs">{item.label}</span>
            {activeView === item.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 w-12 h-1 bg-blue-400 rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </nav>
  );
};

// ==================== BOTTOM SHEET COMPONENT ====================

const BottomSheet = ({ children, onClose }) => {
  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl z-50 max-h-[80vh] overflow-y-auto"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: "spring", damping: 25 }}
      >
        <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mt-3 mb-4" />
        <div className="px-6 pb-6">
          {children}
        </div>
      </motion.div>
    </>
  );
};

// ==================== UTILITY COMPONENTS ====================

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-gray-400">{title}</span>
      <span className={color}>{icon}</span>
    </div>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const WalletButton = () => {
  const [connected, setConnected] = useState(false);
  
  return (
    <motion.button
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
        connected
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      }`}
      whileTap={{ scale: 0.95 }}
      onClick={() => setConnected(!connected)}
    >
      {connected ? (
        <>
          <Wallet size={16} className="inline mr-1" />
          0x1234...5678
        </>
      ) : (
        'Connect Wallet'
      )}
    </motion.button>
  );
};

export default YieldMaxMobileApp;