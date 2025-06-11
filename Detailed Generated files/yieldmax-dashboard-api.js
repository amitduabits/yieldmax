// ==================== REAL-TIME DASHBOARD IMPLEMENTATION ====================

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

// ==================== DASHBOARD COMPONENTS ====================

const YieldMaxDashboard = () => {
  const [yieldData, setYieldData] = useState([]);
  const [gasData, setGasData] = useState([]);
  const [signals, setSignals] = useState([]);
  const [metrics, setMetrics] = useState({
    dataAccuracy: 0,
    updateLatency: 0,
    systemUptime: 0,
    totalTVL: 0
  });
  const [ws, setWs] = useState(null);

  // WebSocket connection
  useEffect(() => {
    const websocket = new WebSocket('wss://api.yieldmax.fi/v1/ws');
    
    websocket.onopen = () => {
      console.log('Connected to YieldMax data stream');
      // Subscribe to all channels
      websocket.send(JSON.stringify({
        action: 'subscribe',
        channels: ['yields', 'gas', 'signals', 'metrics']
      }));
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleRealtimeUpdate(message);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const handleRealtimeUpdate = (message) => {
    switch (message.type) {
      case 'yield_update':
        setYieldData(message.data.yields);
        break;
      case 'gas_update':
        setGasData(message.data);
        break;
      case 'signal_update':
        setSignals(message.data);
        break;
      case 'metrics_update':
        setMetrics(message.data);
        break;
    }
  };

  return (
    <div className="dashboard">
      <SystemMetrics metrics={metrics} />
      <YieldOverview data={yieldData} />
      <GasOptimizationPanel data={gasData} />
      <OptimizationSignals signals={signals} />
      <LiquidityDepthChart data={yieldData} />
    </div>
  );
};

// System health metrics
const SystemMetrics = ({ metrics }) => {
  const getStatusColor = (value, threshold) => {
    return value >= threshold ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Data Accuracy"
        value={`${(metrics.dataAccuracy * 100).toFixed(2)}%`}
        icon={<Activity />}
        color={getStatusColor(metrics.dataAccuracy, 0.995)}
        target="99.5%"
      />
      <MetricCard
        title="Update Latency"
        value={`${metrics.updateLatency.toFixed(1)}s`}
        icon={<TrendingUp />}
        color={getStatusColor(30 - metrics.updateLatency, 0)}
        target="<30s"
      />
      <MetricCard
        title="System Uptime"
        value={`${(metrics.systemUptime * 100).toFixed(2)}%`}
        icon={<AlertCircle />}
        color={getStatusColor(metrics.systemUptime, 0.999)}
        target="99.9%"
      />
      <MetricCard
        title="Total TVL"
        value={`$${(metrics.totalTVL / 1e6).toFixed(1)}M`}
        icon={<DollarSign />}
        color="text-blue-500"
      />
    </div>
  );
};

// Yield overview with real-time updates
const YieldOverview = ({ data }) => {
  const [selectedChain, setSelectedChain] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');

  const filteredData = selectedChain === 'all' 
    ? data 
    : data.filter(d => d.chain === selectedChain);

  const bestOpportunity = data.reduce((best, current) => {
    const currentScore = current.effectiveApy / (1 + current.riskScore);
    const bestScore = best ? best.effectiveApy / (1 + best.riskScore) : 0;
    return currentScore > bestScore ? current : best;
  }, null);

  return (
    <div className="yield-overview bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Yield Rates</h2>
        <div className="flex gap-2">
          <select 
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="all">All Chains</option>
            <option value="ethereum">Ethereum</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="polygon">Polygon</option>
            <option value="optimism">Optimism</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="1h">1 Hour</option>
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
          </select>
        </div>
      </div>

      {bestOpportunity && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Best Opportunity</p>
              <p className="text-lg font-bold">
                {bestOpportunity.protocol} on {bestOpportunity.chain}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {bestOpportunity.effectiveApy.toFixed(2)}%
              </p>
              <p className="text-sm text-gray-600">Effective APY</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredData.map((item) => (
          <YieldCard key={`${item.protocol}-${item.chain}`} data={item} />
        ))}
      </div>
    </div>
  );
};

// Individual yield card component
const YieldCard = ({ data }) => {
  const trend = data.trending ? 'up' : 'down';
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold">{data.protocol}</h3>
          <p className="text-sm text-gray-600">{data.chain}</p>
        </div>
        <TrendIcon className={`w-5 h-5 ${trendColor}`} />
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-600">APY</p>
          <p className="font-bold text-lg">{data.apy.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-gray-600">Effective APY</p>
          <p className="font-bold text-lg">{data.effectiveApy.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-gray-600">TVL</p>
          <p className="font-medium">${(data.tvl / 1e6).toFixed(1)}M</p>
        </div>
        <div>
          <p className="text-gray-600">Risk Score</p>
          <p className="font-medium">{(data.riskScore * 100).toFixed(0)}%</p>
        </div>
      </div>
      
      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Utilization</span>
          <span>{data.utilization.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div 
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${data.utilization}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ==================== API CLIENT IMPLEMENTATION ====================

class YieldMaxAPI {
  constructor(baseUrl = 'https://api.yieldmax.fi/v1') {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'X-API-Version': '1.0.0'
    };
  }

  // Yield data endpoints
  async getCurrentYields(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseUrl}/yields/current?${queryString}`, {
      headers: this.headers
    });
    return response.json();
  }

  async getHistoricalYields(chain, protocol, timeRange) {
    const params = {
      chain,
      protocol,
      from: Math.floor(Date.now() / 1000) - timeRange,
      to: Math.floor(Date.now() / 1000),
      interval: this.getInterval(timeRange)
    };
    
    const response = await fetch(`${this.baseUrl}/yields/historical?${new URLSearchParams(params)}`, {
      headers: this.headers
    });
    return response.json();
  }

  // Gas price endpoints
  async getCurrentGasPrices() {
    const response = await fetch(`${this.baseUrl}/gas/current`, {
      headers: this.headers
    });
    return response.json();
  }

  async getGasOptimizationWindows() {
    const response = await fetch(`${this.baseUrl}/gas/optimization-windows`, {
      headers: this.headers
    });
    return response.json();
  }

  // Liquidity analysis
  async analyzeLiquidity(protocol, chain, amount) {
    const params = { protocol, chain, amount };
    const response = await fetch(`${this.baseUrl}/liquidity/depth?${new URLSearchParams(params)}`, {
      headers: this.headers
    });
    return response.json();
  }

  // Optimization signals
  async getOptimizationSignals(minProfit = 100, maxRisk = 0.5) {
    const params = { min_profit: minProfit, max_risk: maxRisk };
    const response = await fetch(`${this.baseUrl}/optimization/signals?${new URLSearchParams(params)}`, {
      headers: this.headers
    });
    return response.json();
  }

  // Risk scores
  async getProtocolRiskScores() {
    const response = await fetch(`${this.baseUrl}/risk/scores`, {
      headers: this.headers
    });
    return response.json();
  }

  // Helper methods
  getInterval(timeRange) {
    const intervals = {
      3600: '1m',      // 1 hour
      86400: '5m',     // 1 day
      604800: '1h',    // 1 week
      2592000: '1d'    // 1 month
    };
    return intervals[timeRange] || '1h';
  }

  // WebSocket connection
  connectWebSocket(onMessage, onError) {
    const ws = new WebSocket(`${this.baseUrl.replace('https', 'wss')}/ws`);
    
    ws.onopen = () => {
      console.log('Connected to YieldMax WebSocket');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    ws.onerror = onError;
    
    return ws;
  }
}

// ==================== DATA PROCESSING UTILITIES ====================

class DataProcessor {
  static calculateEffectiveYield(apy, gasImpact, riskScore) {
    // Adjust APY for gas costs and risk
    const gasAdjusted = apy * (1 - gasImpact / 100);
    const riskAdjusted = gasAdjusted * (1 - riskScore);
    return Math.max(0, riskAdjusted);
  }

  static identifyOptimizationOpportunities(yields, gasPrices) {
    const opportunities = [];
    
    // Find yield differentials across chains
    const protocolGroups = this.groupByProtocol(yields);
    
    for (const [protocol, chainYields] of Object.entries(protocolGroups)) {
      const sorted = chainYields.sort((a, b) => b.effectiveApy - a.effectiveApy);
      
      if (sorted.length >= 2) {
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        const differential = best.effectiveApy - worst.effectiveApy;
        
        // Calculate profitability after gas
        const gasCost = this.estimateCrossChainCost(
          worst.chain,
          best.chain,
          gasPrices
        );
        
        if (differential > 2 && gasCost < differential * 0.3) {
          opportunities.push({
            type: 'cross_chain_arbitrage',
            protocol,
            fromChain: worst.chain,
            toChain: best.chain,
            apyDifferential: differential,
            estimatedGasCost: gasCost,
            netProfit: differential - gasCost,
            confidence: this.calculateConfidence(best, worst)
          });
        }
      }
    }
    
    return opportunities;
  }

  static groupByProtocol(yields) {
    return yields.reduce((groups, yield) => {
      if (!groups[yield.protocol]) {
        groups[yield.protocol] = [];
      }
      groups[yield.protocol].push(yield);
      return groups;
    }, {});
  }

  static estimateCrossChainCost(fromChain, toChain, gasPrices) {
    const baseCosts = {
      ethereum: { withdraw: 200000, ccip: 150000 },
      arbitrum: { withdraw: 600000, ccip: 200000 },
      polygon: { withdraw: 400000, ccip: 150000 },
      optimism: { withdraw: 500000, ccip: 180000 }
    };
    
    const fromGas = gasPrices[fromChain].fast;
    const toGas = gasPrices[toChain].fast;
    
    const withdrawCost = (baseCosts[fromChain].withdraw * fromGas) / 1e9;
    const ccipCost = (baseCosts[fromChain].ccip * fromGas) / 1e9;
    const depositCost = (baseCosts[toChain].withdraw * toGas) / 1e9;
    
    return withdrawCost + ccipCost + depositCost;
  }

  static calculateConfidence(bestYield, worstYield) {
    // Factors: TVL, historical stability, data freshness
    const tvlScore = Math.min(bestYield.tvl / 10e6, 1) * 0.3;
    const stabilityScore = (1 - bestYield.volatility) * 0.4;
    const freshnessScore = bestYield.lastUpdate < 60 ? 0.3 : 0.1;
    
    return tvlScore + stabilityScore + freshnessScore;
  }
}

// ==================== ALERT SYSTEM ====================

class AlertManager {
  constructor() {
    this.alerts = [];
    this.subscribers = [];
    this.alertRules = {
      yieldSpike: {
        threshold: 5, // 5% sudden change
        severity: 'high',
        cooldown: 300 // 5 minutes
      },
      gasOpportunity: {
        threshold: 0.7, // 30% below average
        severity: 'medium',
        cooldown: 600
      },
      liquidityCrisis: {
        threshold: 0.5, // 50% drop
        severity: 'critical',
        cooldown: 60
      },
      dataQuality: {
        threshold: 0.995,
        severity: 'high',
        cooldown: 300
      }
    };
  }

  checkAlertConditions(data) {
    const now = Date.now();
    
    // Check yield spikes
    if (data.type === 'yield_update') {
      data.yields.forEach(yield => {
        if (Math.abs(yield.changePercent) > this.alertRules.yieldSpike.threshold) {
          this.createAlert('yield_spike', {
            protocol: yield.protocol,
            chain: yield.chain,
            change: yield.changePercent,
            currentApy: yield.apy
          });
        }
      });
    }
    
    // Check gas opportunities
    if (data.type === 'gas_update') {
      Object.entries(data.prices).forEach(([chain, prices]) => {
        if (prices.current < prices.avg24h * this.alertRules.gasOpportunity.threshold) {
          this.createAlert('gas_opportunity', {
            chain,
            currentPrice: prices.current,
            averagePrice: prices.avg24h,
            savingsPercent: ((1 - prices.current / prices.avg24h) * 100).toFixed(1)
          });
        }
      });
    }
    
    // Check liquidity issues
    if (data.type === 'liquidity_update') {
      data.protocols.forEach(protocol => {
        if (protocol.liquidityRatio < this.alertRules.liquidityCrisis.threshold) {
          this.createAlert('liquidity_crisis', {
            protocol: protocol.name,
            chain: protocol.chain,
            currentLiquidity: protocol.availableLiquidity,
            liquidityRatio: protocol.liquidityRatio
          });
        }
      });
    }
  }

  createAlert(type, details) {
    const alert = {
      id: `${type}_${Date.now()}`,
      type,
      severity: this.alertRules[type].severity,
      timestamp: Date.now(),
      details,
      acknowledged: false
    };
    
    // Check cooldown
    const lastAlert = this.alerts
      .filter(a => a.type === type && !a.acknowledged)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (!lastAlert || Date.now() - lastAlert.timestamp > this.alertRules[type].cooldown * 1000) {
      this.alerts.push(alert);
      this.notifySubscribers(alert);
    }
  }

  notifySubscribers(alert) {
    this.subscribers.forEach(subscriber => {
      subscriber(alert);
    });
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }
}

// ==================== HISTORICAL DATA ANALYSIS ====================

class HistoricalAnalyzer {
  constructor(api) {
    this.api = api;
    this.cache = new Map();
  }

  async analyzeYieldTrends(protocol, chain, days = 30) {
    const cacheKey = `${protocol}_${chain}_${days}d`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.data;
      }
    }

    // Fetch historical data
    const timeRange = days * 24 * 3600;
    const historicalData = await this.api.getHistoricalYields(chain, protocol, timeRange);

    // Calculate statistics
    const analysis = {
      protocol,
      chain,
      period: `${days}d`,
      statistics: this.calculateStatistics(historicalData),
      trends: this.identifyTrends(historicalData),
      volatility: this.calculateVolatility(historicalData),
      predictions: this.predictFutureYields(historicalData),
      correlations: await this.calculateCorrelations(protocol, chain, historicalData)
    };

    // Cache results
    this.cache.set(cacheKey, {
      data: analysis,
      timestamp: Date.now()
    });

    return analysis;
  }

  calculateStatistics(data) {
    const yields = data.map(d => d.apy);
    
    return {
      current: yields[yields.length - 1],
      mean: this.mean(yields),
      median: this.median(yields),
      std: this.standardDeviation(yields),
      min: Math.min(...yields),
      max: Math.max(...yields),
      percentiles: {
        p10: this.percentile(yields, 10),
        p25: this.percentile(yields, 25),
        p75: this.percentile(yields, 75),
        p90: this.percentile(yields, 90)
      }
    };
  }

  identifyTrends(data) {
    // Simple moving averages
    const sma7 = this.movingAverage(data, 7 * 24); // 7 day
    const sma30 = this.movingAverage(data, 30 * 24); // 30 day
    
    // Trend direction
    const currentYield = data[data.length - 1].apy;
    const shortTrend = currentYield > sma7[sma7.length - 1] ? 'bullish' : 'bearish';
    const longTrend = currentYield > sma30[sma30.length - 1] ? 'bullish' : 'bearish';
    
    // Rate of change
    const roc24h = this.rateOfChange(data, 24);
    const roc7d = this.rateOfChange(data, 24 * 7);
    
    return {
      shortTerm: shortTrend,
      longTerm: longTrend,
      momentum: {
        '24h': roc24h,
        '7d': roc7d
      },
      sma: {
        sma7: sma7[sma7.length - 1],
        sma30: sma30[sma30.length - 1]
      }
    };
  }

  calculateVolatility(data) {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const ret = (data[i].apy - data[i-1].apy) / data[i-1].apy;
      returns.push(ret);
    }
    
    const volatility = this.standardDeviation(returns);
    
    return {
      daily: volatility,
      annualized: volatility * Math.sqrt(365),
      classification: this.classifyVolatility(volatility)
    };
  }

  predictFutureYields(data) {
    // Simple linear regression for trend
    const x = data.map((_, i) => i);
    const y = data.map(d => d.apy);
    
    const regression = this.linearRegression(x, y);
    
    // Predict next 24h, 7d, 30d
    const predictions = {
      '24h': Math.max(0, regression.predict(data.length)),
      '7d': Math.max(0, regression.predict(data.length + 7 * 24)),
      '30d': Math.max(0, regression.predict(data.length + 30 * 24)),
      confidence: regression.r2,
      trend: regression.slope > 0 ? 'increasing' : 'decreasing'
    };
    
    return predictions;
  }

  async calculateCorrelations(protocol, chain, data) {
    // Get data for other protocols on same chain
    const otherProtocols = ['aave_v3', 'compound_v3', 'morpho', 'spark']
      .filter(p => p !== protocol);
    
    const correlations = {};
    
    for (const otherProtocol of otherProtocols) {
      try {
        const otherData = await this.api.getHistoricalYields(
          chain, 
          otherProtocol, 
          30 * 24 * 3600
        );
        
        if (otherData && otherData.length > 0) {
          correlations[otherProtocol] = this.correlation(
            data.map(d => d.apy),
            otherData.map(d => d.apy)
          );
        }
      } catch (error) {
        console.error(`Failed to get correlation data for ${otherProtocol}:`, error);
      }
    }
    
    return correlations;
  }

  // Statistical helper functions
  mean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  standardDeviation(values) {
    const avg = this.mean(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  percentile(values, p) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  movingAverage(data, period) {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const avg = this.mean(slice.map(d => d.apy));
      result.push(avg);
    }
    return result;
  }

  rateOfChange(data, period) {
    if (data.length < period) return 0;
    const current = data[data.length - 1].apy;
    const previous = data[data.length - period].apy;
    return ((current - previous) / previous) * 100;
  }

  linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumXX = x.reduce((total, xi) => total + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = y.reduce((total, yi) => total + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((total, yi, i) => {
      const prediction = slope * x[i] + intercept;
      return total + Math.pow(yi - prediction, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);
    
    return {
      slope,
      intercept,
      r2,
      predict: (xi) => slope * xi + intercept
    };
  }

  correlation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const xMean = this.mean(x.slice(0, n));
    const yMean = this.mean(y.slice(0, n));
    
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xDenominator += xDiff * xDiff;
      yDenominator += yDiff * yDiff;
    }
    
    return numerator / Math.sqrt(xDenominator * yDenominator);
  }

  classifyVolatility(vol) {
    if (vol < 0.01) return 'very_low';
    if (vol < 0.02) return 'low';
    if (vol < 0.05) return 'medium';
    if (vol < 0.1) return 'high';
    return 'very_high';
  }
}

// ==================== GAS OPTIMIZATION PANEL ====================

const GasOptimizationPanel = ({ data }) => {
  const [selectedChain, setSelectedChain] = useState('all');
  const [historicalData, setHistoricalData] = useState({});

  useEffect(() => {
    // Fetch historical gas data for charts
    const fetchHistorical = async () => {
      const api = new YieldMaxAPI();
      const chains = ['ethereum', 'arbitrum', 'polygon', 'optimism'];
      const historical = {};
      
      for (const chain of chains) {
        historical[chain] = await api.getHistoricalGasData(chain, 24); // 24 hours
      }
      
      setHistoricalData(historical);
    };
    
    fetchHistorical();
  }, []);

  const getOptimizationStatus = (chain) => {
    const current = data[chain]?.current || 0;
    const avg = data[chain]?.avg24h || current;
    const ratio = current / avg;
    
    if (ratio < 0.7) return { status: 'optimal', color: 'text-green-600', bg: 'bg-green-100' };
    if (ratio < 0.9) return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (ratio < 1.1) return { status: 'normal', color: 'text-gray-600', bg: 'bg-gray-100' };
    return { status: 'high', color: 'text-red-600', bg: 'bg-red-100' };
  };

  return (
    <div className="gas-optimization bg-white rounded-lg shadow-lg p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">Gas Optimization Windows</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(data).map(([chain, gasData]) => {
          const status = getOptimizationStatus(chain);
          const savings = ((1 - gasData.current / gasData.avg24h) * 100).toFixed(1);
          
          return (
            <div key={chain} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold capitalize">{chain}</h3>
                <span className={`px-2 py-1 rounded text-xs ${status.bg} ${status.color}`}>
                  {status.status}
                </span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Current</p>
                  <p className="text-lg font-bold">{gasData.current.toFixed(1)} gwei</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">24h Average</p>
                  <p className="text-lg">{gasData.avg24h.toFixed(1)} gwei</p>
                </div>
                
                {gasData.current < gasData.avg24h && (
                  <div className="bg-green-50 rounded p-2">
                    <p className="text-sm text-green-600 font-medium">
                      Save {savings}% on gas
                    </p>
                  </div>
                )}
              </div>
              
              {historicalData[chain] && (
                <div className="mt-4 h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData[chain]}>
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== OPTIMIZATION SIGNALS COMPONENT ====================

const OptimizationSignals = ({ signals }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('profit');

  const filteredSignals = signals
    .filter(signal => filter === 'all' || signal.urgency === filter)
    .sort((a, b) => {
      if (sortBy === 'profit') return b.netProfit - a.netProfit;
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'urgency') {
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      }
      return 0;
    });

  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[urgency] || colors.low;
  };

  const executeSignal = async (signal) => {
    console.log('Executing signal:', signal);
    // Integration with smart contracts would go here
  };

  return (
    <div className="optimization-signals bg-white rounded-lg shadow-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Optimization Opportunities</h2>
        <div className="flex gap-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="all">All Signals</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="profit">Net Profit</option>
            <option value="confidence">Confidence</option>
            <option value="urgency">Urgency</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredSignals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No optimization opportunities at the moment</p>
        ) : (
          filteredSignals.map(signal => (
            <div 
              key={signal.id} 
              className={`border rounded-lg p-4 ${getUrgencyColor(signal.urgency)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(signal.urgency)}`}>
                      {signal.urgency.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      Expires in {Math.floor((signal.expiresAt - Date.now()) / 60000)} minutes
                    </span>
                  </div>
                  
                  <h3 className="font-semibold mb-1">
                    {signal.type === 'rebalance' && `Rebalance: ${signal.fromProtocol} → ${signal.toProtocol}`}
                    {signal.type === 'harvest' && `Harvest rewards from ${signal.protocol}`}
                    {signal.type === 'migration' && `Migrate position to ${signal.toProtocol}`}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-2">
                    <div>
                      <p className="text-gray-600">Amount</p>
                      <p className="font-medium">${(signal.amount / 1e6).toFixed(2)}M</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Est. Profit</p>
                      <p className="font-medium text-green-600">+${signal.estimatedProfit.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Gas Cost</p>
                      <p className="font-medium">-${signal.gasCost.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Net Profit</p>
                      <p className="font-bold text-green-600">${signal.netProfit.toFixed(0)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Confidence</span>
                      <span>{(signal.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${signal.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => executeSignal(signal)}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Execute
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Export components and utilities
export {
  YieldMaxDashboard,
  YieldMaxAPI,
  DataProcessor,
  AlertManager,
  HistoricalAnalyzer,
  SystemMetrics,
  YieldOverview,
  GasOptimizationPanel,
  OptimizationSignals
};