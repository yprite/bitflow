-- Bitflow: Initial schema
-- All timestamps stored in UTC. Daily metrics use KST day boundary.

-- On-chain metrics (time-series, upsert collection)
CREATE TABLE IF NOT EXISTS onchain_metrics (
  id BIGSERIAL PRIMARY KEY,
  collected_at TIMESTAMPTZ NOT NULL,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  resolution TEXT NOT NULL DEFAULT 'hourly',  -- 'hourly' | 'daily'
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_metric_time UNIQUE (metric_name, collected_at)
);

CREATE INDEX IF NOT EXISTS idx_metrics_name_time
  ON onchain_metrics (metric_name, collected_at DESC);

-- Whale transactions
CREATE TABLE IF NOT EXISTS whale_transactions (
  id BIGSERIAL PRIMARY KEY,
  tx_hash TEXT UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  amount_btc NUMERIC NOT NULL,
  from_type TEXT,
  from_name TEXT,
  to_type TEXT,
  to_name TEXT,
  tweeted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tweet log
CREATE TABLE IF NOT EXISTS tweet_log (
  id BIGSERIAL PRIMARY KEY,
  tweeted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tweet_type TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'success',  -- success, failed, retry_failed, skipped_stale
  error_message TEXT
);

-- API usage counter (Whale Alert rate limiting)
CREATE TABLE IF NOT EXISTS api_usage (
  id BIGSERIAL PRIMARY KEY,
  api_name TEXT NOT NULL,
  called_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  month_key TEXT NOT NULL,
  success BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_api_usage_month
  ON api_usage (api_name, month_key);

-- RLS policies
ALTER TABLE onchain_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweet_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Allow anon (public) read-only access to metrics and whales
CREATE POLICY "Public read onchain_metrics"
  ON onchain_metrics FOR SELECT
  USING (true);

CREATE POLICY "Public read whale_transactions"
  ON whale_transactions FOR SELECT
  USING (true);

-- Service key (authenticated) full access
CREATE POLICY "Service insert onchain_metrics"
  ON onchain_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service update onchain_metrics"
  ON onchain_metrics FOR UPDATE
  USING (true);

CREATE POLICY "Service all whale_transactions"
  ON whale_transactions FOR ALL
  USING (true);

CREATE POLICY "Service all tweet_log"
  ON tweet_log FOR ALL
  USING (true);

CREATE POLICY "Service all api_usage"
  ON api_usage FOR ALL
  USING (true);
