// components/tabs/MarketsTab.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Activity, AlertCircle,
  Globe, Zap, BarChart3, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import styled from 'styled-components';

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
`;

const FilterButton = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${({ active }) => active ? 'rgba(59, 130, 246, 0.2)' : 'transparent'};
  color: ${({ active }) => active ? '#3B82F6' : '#9CA3AF'};
  border: 1px solid ${({ active }) => active ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }
`;

const MarketGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const MarketCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    border-color: rgba(59, 130, 246, 0.3);
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
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

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.5rem;
`;

export const MarketsTab = ({ yieldsData, gasData, realTimeData }: any) => {
  const [selectedChain, setSelectedChain] = useState('all');
  const [selectedProtocol, setSelectedProtocol] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');

  // Filter yields data
  const filteredYields = yieldsData?.yields?.filter((y: any) => {
    if (selectedChain !== 'all' && y.chain !== selectedChain) return false;
    if (selectedProtocol !== 'all' && !y.protocol.toLowerCase().includes(selectedProtocol)) return false;
    return true;
  }) || [];

  // Prepare chart data
  const chainComparison = prepareChainComparison(yieldsData?.yields || []);
  const protocolPerformance = prepareProtocolPerformance(yieldsData?.yields || []);
  const riskRadarData = prepareRiskRadarData(yieldsData?.yields || []);

  return (
    <Container
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Filters */}
      <FilterBar>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <div className="flex gap-2">
          <FilterButton 
            active={selectedChain === 'all'} 
            onClick={() => setSelectedChain('all')}
          >
            All Chains
          </FilterButton>
          <FilterButton 
            active={selectedChain === 'ethereum'} 
            onClick={() => setSelectedChain('ethereum')}
          >
            Ethereum
          </FilterButton>
          <FilterButton 
            active={selectedChain === 'arbitrum'} 
            onClick={() => setSelectedChain('arbitrum')}
          >
            Arbitrum
          </FilterButton>
          <FilterButton 
            active={selectedChain === 'polygon'} 
            onClick={() => setSelectedChain('polygon')}
          >
            Polygon
          </FilterButton>
          <FilterButton 
            active={selectedChain === 'optimism'} 
            onClick={() => setSelectedChain('optimism')}
          >
            Optimism
          </FilterButton>
        </div>
      </FilterBar>

      {/* Market Overview Cards */}
      <MarketGrid>
        {filteredYields.slice(0, 6).map((yield: any, index: number) => (
          <MarketCard
            key={`${yield.protocol}-${yield.chain}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{yield.protocol}</h3>
                <p className="text-sm text-gray-400">{yield.chain}</p>
              </div>
              <ChainIcon chain={yield.chain} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-400">APY</p>
                <p className="text-xl font-bold text-green-400">{yield.apy.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">TVL</p>
                <p className="text-xl font-bold">${(yield.tvl / 1e6).toFixed(1)}M</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${yield.trending ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-xs text-gray-400">
                  {yield.trending ? 'Trending Up' : 'Trending Down'}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                Risk: {(yield.risk * 100).toFixed(0)}%
              </span>
            </div>

            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${yield.utilization}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {yield.utilization.toFixed(1)}% Utilization
            </p>
          </MarketCard>
        ))}
      </MarketGrid>

      {/* Charts */}
      <ChartSection>
        {/* Chain Comparison */}
        <ChartCard>
          <h3 className="text-lg font-semibold mb-4">Average APY by Chain</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chainComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="chain" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(value) => `${value}%`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: '1px solid rgba(55, 65, 81, 0.5)',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => `${value.toFixed(2)}%`}
              />
              <Bar dataKey="avgAPY" radius={[8, 8, 0, 0]}>
                {chainComparison.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={getChainColor(entry.chain)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Protocol Performance */}
        <ChartCard>
          <h3 className="text-lg font-semibold mb-4">Protocol Risk vs Reward</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={riskRadarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="protocol" stroke="#9CA3AF" />
              <PolarRadiusAxis stroke="#9CA3AF" domain={[0, 100]} />
              <Radar
                name="APY"
                dataKey="apy"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
              <Radar
                name="Safety"
                dataKey="safety"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: '1px solid rgba(55, 65, 81, 0.5)',
                  borderRadius: '8px'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartSection>

      {/* Gas Optimization */}
      <ChartCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Gas Price Trends</h3>
          <div className="flex gap-2">
            {Object.entries(gasData?.prices || {}).map(([chain, data]: any) => (
              <div key={chain} className="flex items-center gap-2">
                <ChainIcon chain={chain} size="sm" />
                <span className={`text-sm font-medium ${
                  data.trend === 'up' ? 'text-red-400' : 
                  data.trend === 'down' ? 'text-green-400' : 
                  'text-gray-400'
                }`}>
                  {data.current.toFixed(1)} gwei
                </span>
              </div>
            ))}
          </div>
        </div>
        <GasOptimizationChart gasData={gasData} />
      </ChartCard>

      {/* Opportunities Alert */}
      {yieldsData?.opportunities?.length > 0 && (
        <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold">Arbitrage Opportunities Detected</h3>
              <p className="text-sm text-gray-400">
                {yieldsData.opportunities.length} opportunities found across chains
              </p>
            </div>
          </div>
          <OpportunitiesList opportunities={yieldsData.opportunities} />
        </div>
      )}
    </Container>
  );
};

// Helper Components
const ChainIcon = ({ chain, size = 'md' }: { chain: string; size?: string }) => {
  const icons: Record<string, string> = {
    ethereum: '⟠',
    arbitrum: '🔷',
    polygon: '🟣',
    optimism: '🔴'
  };
  
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return <span className={sizeClasses[size]}>{icons[chain] || '🌐'}</span>;
};

const GasOptimizationChart = ({ gasData }: any) => {
  const data = Object.entries(gasData?.prices || {}).map(([chain, prices]: any) => ({
    chain,
    current: prices.current,
    avg24h: prices.avg24h,
    savings: ((prices.avg24h - prices.current) / prices.avg24h * 100).toFixed(1)
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {data.map((item) => (
        <div key={item.chain} className="bg-gray-800/50 rounded-lg p-4">
          <h4 className="font-medium capitalize mb-2">{item.chain}</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current</span>
              <span>{item.current.toFixed(1)} gwei</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">24h Avg</span>
              <span>{item.avg24h.toFixed(1)} gwei</span>
            </div>
            {parseFloat(item.savings) > 0 && (
              <div className="mt-2 p-2 bg-green-500/20 rounded text-green-400 text-xs text-center">
                Save {item.savings}%
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const OpportunitiesList = ({ opportunities }: any) => {
  return (
    <div className="space-y-3">
      {opportunities.slice(0, 3).map((opp: any, index: number) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
          <div className="flex items-center gap-3">
            <ArrowRight className="w-5 h-5 text-green-400" />
            <div>
              <p className="font-medium">{opp.protocol}</p>
              <p className="text-sm text-gray-400">
                {opp.fromChain} → {opp.toChain}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-green-400">+{opp.apyDiff.toFixed(2)}%</p>
            <p className="text-xs text-gray-400">
              ${opp.estimatedGain.toFixed(0)} gain
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper functions
function getChainColor(chain: string): string {
  const colors: Record<string, string> = {
    ethereum: '#627EEA',
    arbitrum: '#28A0F0',
    polygon: '#8247E5',
    optimism: '#FF0420'
  };
  return colors[chain] || '#3B82F6';
}

function prepareChainComparison(yields: any[]): any[] {
  const chainData: Record<string, { total: number; count: number }> = {};
  
  yields.forEach(y => {
    if (!chainData[y.chain]) {
      chainData[y.chain] = { total: 0, count: 0 };
    }
    chainData[y.chain].total += y.apy;
    chainData[y.chain].count += 1;
  });
  
  return Object.entries(chainData).map(([chain, data]) => ({
    chain: chain.charAt(0).toUpperCase() + chain.slice(1),
    avgAPY: data.total / data.count
  }));
}

function prepareProtocolPerformance(yields: any[]): any[] {
  const protocols = ['aave_v3', 'compound_v3', 'morpho', 'spark'];
  return protocols.map(protocol => {
    const protocolYields = yields.filter(y => y.protocol === protocol);
    const avgAPY = protocolYields.reduce((sum, y) => sum + y.apy, 0) / (protocolYields.length || 1);
    const avgRisk = protocolYields.reduce((sum, y) => sum + y.risk, 0) / (protocolYields.length || 1);
    
    return {
      protocol: protocol.replace('_v3', ''),
      apy: avgAPY,
      risk: avgRisk * 100,
      tvl: protocolYields.reduce((sum, y) => sum + y.tvl, 0) / 1e6
    };
  });
}

function prepareRiskRadarData(yields: any[]): any[] {
  const protocols = ['Aave', 'Compound', 'Morpho', 'Spark'];
  return protocols.map(protocol => {
    const protocolYields = yields.filter(y => y.protocol.toLowerCase().includes(protocol.toLowerCase()));
    const avgAPY = protocolYields.reduce((sum, y) => sum + y.apy, 0) / (protocolYields.length || 1);
    const avgRisk = protocolYields.reduce((sum, y) => sum + y.risk, 0) / (protocolYields.length || 1);
    
    return {
      protocol,
      apy: (avgAPY / 10) * 100, // Scale to 0-100
      safety: (1 - avgRisk) * 100 // Invert risk to safety score
    };
  });
}

// Import missing icon
import { ArrowRight } from 'lucide-react';