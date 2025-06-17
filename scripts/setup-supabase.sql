-- Create events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  network VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  user_address VARCHAR(42),
  amount NUMERIC,
  shares NUMERIC,
  dest_chain INTEGER,
  tx_hash VARCHAR(66) UNIQUE,
  block_number INTEGER,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Create metrics table
CREATE TABLE metrics (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  value NUMERIC NOT NULL,
  network VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create user_positions table
CREATE TABLE user_positions (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  network VARCHAR(50) NOT NULL,
  shares NUMERIC NOT NULL,
  last_update TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_address, network)
);

-- Create yield_history table
CREATE TABLE yield_history (
  id SERIAL PRIMARY KEY,
  protocol VARCHAR(50) NOT NULL,
  network VARCHAR(50) NOT NULL,
  apy NUMERIC NOT NULL,
  tvl NUMERIC,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_events_network ON events(network);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_user ON events(user_address);
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX idx_yield_history_protocol ON yield_history(protocol, network);

-- Create views for analytics
CREATE VIEW daily_metrics AS
SELECT 
  DATE_TRUNC('day', timestamp) as day,
  network,
  COUNT(DISTINCT user_address) as unique_users,
  SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
  SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) as total_withdrawals,
  COUNT(*) as total_transactions
FROM events
GROUP BY DATE_TRUNC('day', timestamp), network;

CREATE VIEW protocol_performance AS
SELECT 
  protocol,
  network,
  AVG(apy) as avg_apy,
  MAX(apy) as max_apy,
  MIN(apy) as min_apy,
  AVG(tvl) as avg_tvl
FROM yield_history
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY protocol, network;