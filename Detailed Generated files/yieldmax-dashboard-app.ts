// ==================== YIELDMAX DASHBOARD APPLICATION ====================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, DollarSign, 
  Layers, Globe, Wallet, Bell, Settings, ChevronRight,
  ArrowUpRight, ArrowDownRight, Clock, AlertCircle,
  CheckCircle, XCircle, RefreshCw, ExternalLink
} from 'lucide-react';
import styled from 'styled-components';
import { useWeb3 } from './hooks/useWeb3';
import { useRealTimeData } from './hooks/useRealTimeData';
import { formatNumber, formatCurrency, formatPercentage } from './utils/format';
import { designTokens } from './design-system';

// ==================== STYLED COMPONENTS ====================

const DashboardContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: ${designTokens.colors.neutral[950]};
`;

const Sidebar = styled(motion.aside)`
  width: 280px;
  background: ${designTokens.colors.glass.bg};
  backdrop-filter: blur(16px);
  border-right: 1px solid ${designTokens.colors.glass.border};
  padding: ${designTokens.spacing[6]};
  display: flex;
  flex-direction: column;
  
  @media (max-width: ${designTokens.breakpoints.lg}) {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: ${designTokens.zIndex.modal};
    transform: translateX(-100%);
    
    &.open {
      transform: translateX(0);
    }
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: ${designTokens.spacing[6]};
  overflow-y: auto;
  
  @media (max-width: ${designTokens.breakpoints.lg}) {
    padding: ${designTokens.spacing[4]};
  }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${designTokens.spacing[8]};
  
  @media (max-width: ${designTokens.breakpoints.md}) {
    flex-direction: column;
    gap: ${designTokens.spacing[4]};
    align-items: stretch;
  }
`;

const PageTitle = styled.h1`
  font-size: ${designTokens.typography.fontSize['4xl']};
  font-weight: ${designTokens.typography.fontWeight.bold};
  background: linear-gradient(135deg, 
    ${designTokens.colors.neutral[50]} 0%, 
    ${designTokens.colors.primary[400]} 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${designTokens.spacing[6]};
  margin-bottom: ${designTokens.spacing[8]};
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: ${designTokens.spacing[6]};
  margin-bottom: ${designTokens.spacing[8]};
  
  @media (max-width: ${designTokens.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

// ==================== MAIN DASHBOARD COMPONENT ====================

export const YieldMaxDashboard: React.FC = () => {
  const { account, chainId, connectWallet, switchChain } = useWeb3();
  const { yields, portfolio, transactions, gasPrice, isConnected } = useRealTimeData();
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (!portfolio) return null;
    
    const totalValue = portfolio.positions.reduce((sum, pos) => sum + pos.value, 0);
    const totalYield = portfolio.positions.reduce((sum, pos) => sum + pos.yield * pos.value, 0) / totalValue;
    const dailyEarnings = (totalValue * totalYield) / 365;
    
    return {
      totalValue,
      totalYield,
      dailyEarnings,
      change24h: portfolio.change24h,
      positions: portfolio.positions.length
    };
  }, [portfolio]);

  return (
    <DashboardContainer>
      <AnimatePresence>
        <Sidebar className={showMobileMenu ? 'open' : ''}>
          <SidebarContent />
        </Sidebar>
      </AnimatePresence>

      <MainContent>
        <Header>
          <div>
            <PageTitle>YieldMax Dashboard</PageTitle>
            <SubTitle>Cross-Chain Yield Optimization</SubTitle>
          </div>
          <HeaderActions>
            <GasPriceIndicator gasPrice={gasPrice} />
            <NotificationButton />
            <WalletButton account={account} onConnect={connectWallet} />
          </HeaderActions>
        </Header>

        {account ? (
          <>
            <StatsGrid>
              <StatCard
                title="Total Portfolio Value"
                value={formatCurrency(portfolioMetrics?.totalValue || 0)}
                change={portfolioMetrics?.change24h || 0}
                icon={<DollarSign />}
              />
              <StatCard
                title="Average APY"
                value={formatPercentage(portfolioMetrics?.totalYield || 0)}
                subtitle="Across all positions"
                icon={<TrendingUp />}
                accent="success"
              />
              <StatCard
                title="Daily Earnings"
                value={formatCurrency(portfolioMetrics?.dailyEarnings || 0)}
                subtitle="Estimated"
                icon={<Activity />}
                accent="info"
              />
              <StatCard
                title="Active Positions"
                value={portfolioMetrics?.positions || 0}
                subtitle="Across chains"
                icon={<Layers />}
              />
            </StatsGrid>

            <YieldComparison yields={yields} />
            <PortfolioOverview portfolio={portfolio} />
            <TransactionHistory transactions={transactions} />
            <OptimizationSuggestions />
          </>
        ) : (
          <EmptyState onConnect={connectWallet} />
        )}
      </MainContent>
    </DashboardContainer>
  );
};

// ==================== SIDEBAR COMPONENT ====================

const SidebarContent: React.FC = () => {
  const navItems = [
    { icon: <Activity />, label: 'Dashboard', path: '/', active: true },
    { icon: <Layers />, label: 'Portfolio', path: '/portfolio' },
    { icon: <Globe />, label: 'Markets', path: '/markets' },
    { icon: <Clock />, label: 'History', path: '/history' },
    { icon: <Settings />, label: 'Settings', path: '/settings' }
  ];

  return (
    <>
      <Logo>
        <LogoIcon>
          <Layers size={32} />
        </LogoIcon>
        <LogoText>YieldMax</LogoText>
      </Logo>

      <Navigation>
        {navItems.map((item) => (
          <NavItem key={item.path} active={item.active}>
            {item.icon}
            <span>{item.label}</span>
          </NavItem>
        ))}
      </Navigation>

      <ProtocolList>
        <SectionTitle>Supported Protocols</SectionTitle>
        <ProtocolItem>
          <ProtocolIcon src="/aave-logo.svg" alt="Aave" />
          <span>Aave V3</span>
        </ProtocolItem>
        <ProtocolItem>
          <ProtocolIcon src="/compound-logo.svg" alt="Compound" />
          <span>Compound V3</span>
        </ProtocolItem>
        <ProtocolItem>
          <ProtocolIcon src="/morpho-logo.svg" alt="Morpho" />
          <span>Morpho</span>
        </ProtocolItem>
        <ProtocolItem>
          <ProtocolIcon src="/spark-logo.svg" alt="Spark" />
          <span>Spark</span>
        </ProtocolItem>
      </ProtocolList>
    </>
  );
};

// ==================== STAT CARD COMPONENT ====================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: 'default' | 'success' | 'error' | 'info';
}

const StatCardContainer = styled(Card)`
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
      ${({ accent }) => {
        switch (accent) {
          case 'success': return `${designTokens.colors.success.main}20`;
          case 'error': return `${designTokens.colors.error.main}20`;
          case 'info': return `${designTokens.colors.info.main}20`;
          default: return `${designTokens.colors.primary[500]}20`;
        }
      }},
      transparent
    );
    pointer-events: none;
  }
`;

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  subtitle, 
  icon,
  accent = 'default' 
}) => {
  return (
    <StatCardContainer glass accent={accent}>
      <StatHeader>
        <StatIcon accent={accent}>{icon}</StatIcon>
        <StatTitle>{title}</StatTitle>
      </StatHeader>
      
      <StatValue>{value}</StatValue>
      
      {subtitle && <StatSubtitle>{subtitle}</StatSubtitle>}
      
      {change !== undefined && (
        <StatChange positive={change >= 0}>
          {change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {Math.abs(change).toFixed(2)}%
        </StatChange>
      )}
    </StatCardContainer>
  );
};

// ==================== YIELD COMPARISON COMPONENT ====================

interface YieldComparisonProps {
  yields: Array<{
    protocol: string;
    chain: string;
    apy: number;
    tvl: number;
    risk: number;
  }>;
}

const YieldComparison: React.FC<YieldComparisonProps> = ({ yields }) => {
  const [selectedChain, setSelectedChain] = useState('all');
  
  const filteredYields = selectedChain === 'all' 
    ? yields 
    : yields.filter(y => y.chain === selectedChain);

  const chartData = filteredYields.map(y => ({
    name: `${y.protocol} (${y.chain})`,
    apy: y.apy,
    tvl: y.tvl / 1e6,
    risk: y.risk * 100
  }));

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Yield Comparison</SectionTitle>
        <ChainFilter value={selectedChain} onChange={setSelectedChain} />
      </SectionHeader>

      <ChartContainer>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={designTokens.colors.neutral[800]} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: designTokens.colors.neutral[400], fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fill: designTokens.colors.neutral[400] }}
              axisLine={{ stroke: designTokens.colors.neutral[700] }}
            />
            <Tooltip
              contentStyle={{
                background: designTokens.colors.neutral[900],
                border: `1px solid ${designTokens.colors.neutral[700]}`,
                borderRadius: designTokens.borderRadius.base
              }}
            />
            <Bar 
              dataKey="apy" 
              fill={designTokens.colors.primary[500]}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <YieldGrid>
        {filteredYields.map((yield) => (
          <YieldCard key={`${yield.protocol}-${yield.chain}`}>
            <YieldCardHeader>
              <ProtocolBadge>{yield.protocol}</ProtocolBadge>
              <ChainBadge chain={yield.chain} />
            </YieldCardHeader>
            
            <YieldMetrics>
              <YieldMetric>
                <MetricLabel>APY</MetricLabel>
                <MetricValue accent="success">{yield.apy.toFixed(2)}%</MetricValue>
              </YieldMetric>
              <YieldMetric>
                <MetricLabel>TVL</MetricLabel>
                <MetricValue>${formatNumber(yield.tvl)}</MetricValue>
              </YieldMetric>
              <YieldMetric>
                <MetricLabel>Risk</MetricLabel>
                <RiskIndicator level={yield.risk} />
              </YieldMetric>
            </YieldMetrics>

            <OptimizeButton>
              Optimize Position <ArrowUpRight size={16} />
            </OptimizeButton>
          </YieldCard>
        ))}
      </YieldGrid>
    </Section>
  );
};

// ==================== PORTFOLIO OVERVIEW COMPONENT ====================

interface PortfolioOverviewProps {
  portfolio: {
    positions: Array<{
      id: string;
      protocol: string;
      chain: string;
      asset: string;
      amount: number;
      value: number;
      yield: number;
      earnings: number;
    }>;
    totalValue: number;
    change24h: number;
  };
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ portfolio }) => {
  const [timeframe, setTimeframe] = useState('1W');
  
  // Mock historical data for chart
  const historicalData = generateMockHistoricalData(portfolio.totalValue, timeframe);
  
  // Calculate allocation by protocol
  const allocationData = portfolio.positions.reduce((acc, pos) => {
    const existing = acc.find(a => a.name === pos.protocol);
    if (existing) {
      existing.value += pos.value;
    } else {
      acc.push({ name: pos.protocol, value: pos.value });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  const COLORS = [
    designTokens.colors.primary[500],
    designTokens.colors.info.main,
    designTokens.colors.success.main,
    designTokens.colors.warning.main
  ];

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Portfolio Performance</SectionTitle>
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      </SectionHeader>

      <ChartGrid>
        <ChartCard>
          <ChartTitle>Portfolio Value</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={designTokens.colors.primary[500]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={designTokens.colors.primary[500]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={designTokens.colors.neutral[800]} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: designTokens.colors.neutral[400], fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: designTokens.colors.neutral[400] }}
                axisLine={{ stroke: designTokens.colors.neutral[700] }}
              />
              <Tooltip
                contentStyle={{
                  background: designTokens.colors.neutral[900],
                  border: `1px solid ${designTokens.colors.neutral[700]}`,
                  borderRadius: designTokens.borderRadius.base
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={designTokens.colors.primary[500]}
                fillOpacity={1}
                fill="url(#valueGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ChartTitle>Protocol Allocation</ChartTitle>
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
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  background: designTokens.colors.neutral[900],
                  border: `1px solid ${designTokens.colors.neutral[700]}`,
                  borderRadius: designTokens.borderRadius.base
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartGrid>

      <PositionsTable>
        <TableHeader>
          <TableRow>
            <TableHead>Position</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>APY</TableHead>
            <TableHead>24h Earnings</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {portfolio.positions.map((position) => (
            <TableRow key={position.id}>
              <TableCell>
                <PositionInfo>
                  <PositionProtocol>{position.protocol}</PositionProtocol>
                  <PositionDetails>
                    {position.asset} on {position.chain}
                  </PositionDetails>
                </PositionInfo>
              </TableCell>
              <TableCell>
                <CellValue>{formatCurrency(position.value)}</CellValue>
                <CellSubvalue>{formatNumber(position.amount)} {position.asset}</CellSubvalue>
              </TableCell>
              <TableCell>
                <CellValue accent="success">{position.yield.toFixed(2)}%</CellValue>
              </TableCell>
              <TableCell>
                <CellValue accent="info">+{formatCurrency(position.earnings)}</CellValue>
              </TableCell>
              <TableCell>
                <ActionButtons>
                  <IconButton title="Withdraw">
                    <ArrowDownRight size={16} />
                  </IconButton>
                  <IconButton title="Add">
                    <ArrowUpRight size={16} />
                  </IconButton>
                  <IconButton title="Optimize">
                    <RefreshCw size={16} />
                  </IconButton>
                </ActionButtons>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </PositionsTable>
    </Section>
  );
};

// ==================== TRANSACTION HISTORY COMPONENT ====================

interface TransactionHistoryProps {
  transactions: Array<{
    id: string;
    type: 'deposit' | 'withdraw' | 'rebalance';
    protocol: string;
    chain: string;
    amount: number;
    asset: string;
    hash: string;
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: number;
    gasUsed?: number;
  }>;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} color={designTokens.colors.success.main} />;
      case 'failed':
        return <XCircle size={16} color={designTokens.colors.error.main} />;
      default:
        return <Clock size={16} color={designTokens.colors.warning.main} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return { label: 'Deposit', color: designTokens.colors.success.main };
      case 'withdraw':
        return { label: 'Withdraw', color: designTokens.colors.error.main };
      case 'rebalance':
        return { label: 'Rebalance', color: designTokens.colors.info.main };
      default:
        return { label: type, color: designTokens.colors.neutral[400] };
    }
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Recent Transactions</SectionTitle>
        <ViewAllButton>
          View All <ChevronRight size={16} />
        </ViewAllButton>
      </SectionHeader>

      <TransactionList>
        {transactions.slice(0, 5).map((tx) => {
          const typeInfo = getTypeLabel(tx.type);
          
          return (
            <TransactionItem key={tx.id}>
              <TransactionIcon type={tx.type}>
                {tx.type === 'deposit' ? <ArrowDownRight /> : 
                 tx.type === 'withdraw' ? <ArrowUpRight /> : 
                 <RefreshCw />}
              </TransactionIcon>
              
              <TransactionInfo>
                <TransactionHeader>
                  <TransactionType color={typeInfo.color}>
                    {typeInfo.label}
                  </TransactionType>
                  <TransactionProtocol>
                    {tx.protocol} • {tx.chain}
                  </TransactionProtocol>
                </TransactionHeader>
                <TransactionDetails>
                  {formatNumber(tx.amount)} {tx.asset}
                  <TransactionTime>
                    {new Date(tx.timestamp).toLocaleString()}
                  </TransactionTime>
                </TransactionDetails>
              </TransactionInfo>

              <TransactionStatus>
                {getStatusIcon(tx.status)}
                <TransactionHash 
                  href={`https://etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                  <ExternalLink size={12} />
                </TransactionHash>
              </TransactionStatus>
            </TransactionItem>
          );
        })}
      </TransactionList>
    </Section>
  );
};

// ==================== OPTIMIZATION SUGGESTIONS COMPONENT ====================

const OptimizationSuggestions: React.FC = () => {
  const suggestions = [
    {
      id: '1',
      type: 'rebalance',
      urgency: 'high',
      title: 'Higher yield available on Arbitrum',
      description: 'Move USDC from Ethereum Aave (3.2%) to Arbitrum Aave (5.8%)',
      estimatedGain: 2.6,
      gasCost: 45,
      netGain: 850,
      confidence: 0.92
    },
    {
      id: '2',
      type: 'harvest',
      urgency: 'medium',
      title: 'Compound rewards ready to claim',
      description: 'You have 125 COMP tokens ready to claim and compound',
      estimatedGain: 0,
      gasCost: 12,
      netGain: 1250,
      confidence: 1.0
    },
    {
      id: '3',
      type: 'risk',
      urgency: 'low',
      title: 'Reduce concentration risk',
      description: 'Consider diversifying - 65% of portfolio is in Aave',
      estimatedGain: 0,
      gasCost: 0,
      netGain: 0,
      confidence: 0.85
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return designTokens.colors.error.main;
      case 'medium': return designTokens.colors.warning.main;
      default: return designTokens.colors.info.main;
    }
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Optimization Opportunities</SectionTitle>
        <Badge variant="info">{suggestions.length} Available</Badge>
      </SectionHeader>

      <SuggestionGrid>
        {suggestions.map((suggestion) => (
          <SuggestionCard key={suggestion.id} glass hover>
            <SuggestionHeader>
              <UrgencyIndicator color={getUrgencyColor(suggestion.urgency)} />
              <SuggestionTitle>{suggestion.title}</SuggestionTitle>
            </SuggestionHeader>

            <SuggestionDescription>
              {suggestion.description}
            </SuggestionDescription>

            <SuggestionMetrics>
              {suggestion.estimatedGain > 0 && (
                <MetricItem>
                  <MetricLabel>APY Gain</MetricLabel>
                  <MetricValue accent="success">+{suggestion.estimatedGain}%</MetricValue>
                </MetricItem>
              )}
              <MetricItem>
                <MetricLabel>Gas Cost</MetricLabel>
                <MetricValue>${suggestion.gasCost}</MetricValue>
              </MetricItem>
              {suggestion.netGain > 0 && (
                <MetricItem>
                  <MetricLabel>Net Gain</MetricLabel>
                  <MetricValue accent="success">${suggestion.netGain}</MetricValue>
                </MetricItem>
              )}
            </SuggestionMetrics>

            <SuggestionFooter>
              <ConfidenceBar confidence={suggestion.confidence} />
              <ExecuteButton variant="primary" size="sm">
                Execute <ArrowUpRight size={14} />
              </ExecuteButton>
            </SuggestionFooter>
          </SuggestionCard>
        ))}
      </SuggestionGrid>
    </Section>
  );
};

// ==================== MOBILE RESPONSIVE COMPONENTS ====================

const MobileMenuButton = styled.button`
  display: none;
  position: fixed;
  bottom: ${designTokens.spacing[4]};
  right: ${designTokens.spacing[4]};
  width: 56px;
  height: 56px;
  border-radius: ${designTokens.borderRadius.full};
  background: ${designTokens.colors.primary[500]};
  color: white;
  border: none;
  box-shadow: ${designTokens.shadows.lg};
  z-index: ${designTokens.zIndex.sticky};
  
  @media (max-width: ${designTokens.breakpoints.lg}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

// ==================== UTILITY FUNCTIONS ====================

function generateMockHistoricalData(currentValue: number, timeframe: string): Array<{date: string; value: number}> {
  const dataPoints = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 365;
  const volatility = 0.02;
  const trend = 1.0001;
  
  const data = [];
  let value = currentValue / Math.pow(trend, dataPoints);
  
  for (let i = dataPoints; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    value = value * trend * (1 + (Math.random() - 0.5) * volatility);
    
    data.push({
      date: date.toLocaleDateString(),
      value: Math.round(value)
    });
  }
  
  return data;
}

// ==================== EXPORT ====================

export default YieldMaxDashboard;