import React from 'react';
import styled from 'styled-components';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { useQuery } from 'react-query';

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    color: #888;
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  .value {
    font-size: 36px;
    font-weight: bold;
    color: #4CAF50;
    margin-bottom: 8px;
  }
  
  .change {
    font-size: 14px;
    color: #4CAF50;
  }
`;

const ChartContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  
  h2 {
    margin-bottom: 24px;
    color: #fff;
  }
`;

export default function InvestorDashboard() {
  const { data: metrics } = useQuery('investor-metrics', fetchInvestorMetrics);
  
  if (!metrics) return <div>Loading...</div>;
  
  return (
    <DashboardContainer>
      <h1>YieldMax Investor Dashboard</h1>
      
      <MetricsGrid>
        <MetricCard>
          <h3>Total Value Locked (TVL)</h3>
          <div className="value">${(metrics.tvl / 1e6).toFixed(2)}M</div>
          <div className="change">+{metrics.tvlGrowth}% (30d)</div>
        </MetricCard>
        
        <MetricCard>
          <h3>Monthly Active Users</h3>
          <div className="value">{metrics.mau.toLocaleString()}</div>
          <div className="change">+{metrics.mauGrowth}% (30d)</div>
        </MetricCard>
        
        <MetricCard>
          <h3>Revenue Run Rate</h3>
          <div className="value">${(metrics.arr / 1e6).toFixed(2)}M</div>
          <div className="change">+{metrics.arrGrowth}% (30d)</div>
        </MetricCard>
        
        <MetricCard>
          <h3>Average User Value</h3>
          <div className="value">${metrics.avgUserValue.toLocaleString()}</div>
          <div className="change">+{metrics.auvGrowth}% (30d)</div>
        </MetricCard>
      </MetricsGrid>
      
      <ChartContainer>
        <h2>TVL Growth</h2>
        <Line data={metrics.tvlChart} options={chartOptions} />
      </ChartContainer>
      
      <ChartContainer>
        <h2>Protocol Distribution</h2>
        <Doughnut data={metrics.protocolChart} options={doughnutOptions} />
      </ChartContainer>
      
      <ChartContainer>
        <h2>Cross-Chain Volume</h2>
        <Bar data={metrics.volumeChart} options={chartOptions} />
      </ChartContainer>
      
      <ChartContainer>
        <h2>Key Metrics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div>
            <h4>Retention Rate</h4>
            <p>{metrics.retentionRate}% (90-day)</p>
          </div>
          <div>
            <h4>LTV:CAC Ratio</h4>
            <p>{metrics.ltvCac}:1</p>
          </div>
          <div>
            <h4>Gross Margin</h4>
            <p>{metrics.grossMargin}%</p>
          </div>
          <div>
            <h4>Runway</h4>
            <p>{metrics.runway} months</p>
          </div>
        </div>
      </ChartContainer>
    </DashboardContainer>
  );
}

async function fetchInvestorMetrics() {
  const response = await fetch('/api/analytics/investor-metrics');
  return response.json();
}

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    },
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    }
  }
};

const doughnutOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'right' as const
    }
  }
};