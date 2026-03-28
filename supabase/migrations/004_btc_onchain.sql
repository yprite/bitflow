-- Bitcoin on-chain normalized and serving tables for Supabase-backed delivery.

CREATE TABLE IF NOT EXISTS btc_blocks (
  height BIGINT PRIMARY KEY,
  block_hash TEXT NOT NULL UNIQUE,
  prev_block_hash TEXT,
  block_time TIMESTAMPTZ NOT NULL,
  median_time TIMESTAMPTZ NOT NULL,
  size_bytes INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  tx_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_btc_blocks_time_desc
  ON btc_blocks (block_time DESC);

CREATE TABLE IF NOT EXISTS btc_txs (
  txid TEXT PRIMARY KEY,
  block_height BIGINT NOT NULL REFERENCES btc_blocks(height) ON DELETE CASCADE,
  block_hash TEXT NOT NULL REFERENCES btc_blocks(block_hash) ON DELETE CASCADE,
  tx_index INTEGER NOT NULL,
  version INTEGER NOT NULL,
  lock_time BIGINT NOT NULL,
  size_bytes INTEGER NOT NULL,
  vsize INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  is_coinbase BOOLEAN NOT NULL DEFAULT FALSE,
  fee_sats BIGINT,
  total_input_sats BIGINT,
  total_output_sats BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_btc_txs_block_index UNIQUE (block_height, tx_index)
);

CREATE INDEX IF NOT EXISTS idx_btc_txs_block_height
  ON btc_txs (block_height DESC, tx_index ASC);

CREATE TABLE IF NOT EXISTS btc_outputs (
  txid TEXT NOT NULL REFERENCES btc_txs(txid) ON DELETE CASCADE,
  vout_n INTEGER NOT NULL,
  block_height BIGINT NOT NULL REFERENCES btc_blocks(height) ON DELETE CASCADE,
  value_sats BIGINT NOT NULL,
  script_pubkey TEXT NOT NULL,
  script_type TEXT,
  address TEXT,
  descriptor TEXT,
  is_op_return BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (txid, vout_n)
);

CREATE INDEX IF NOT EXISTS idx_btc_outputs_block_height
  ON btc_outputs (block_height DESC);

CREATE INDEX IF NOT EXISTS idx_btc_outputs_address
  ON btc_outputs (address)
  WHERE address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_btc_outputs_script_type
  ON btc_outputs (script_type)
  WHERE script_type IS NOT NULL;

CREATE TABLE IF NOT EXISTS btc_inputs (
  spending_txid TEXT NOT NULL REFERENCES btc_txs(txid) ON DELETE CASCADE,
  vin_n INTEGER NOT NULL,
  block_height BIGINT NOT NULL REFERENCES btc_blocks(height) ON DELETE CASCADE,
  prev_txid TEXT,
  prev_vout_n INTEGER,
  sequence BIGINT NOT NULL,
  coinbase_data TEXT,
  prev_value_sats BIGINT,
  prev_script_pubkey TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (spending_txid, vin_n)
);

CREATE INDEX IF NOT EXISTS idx_btc_inputs_prevout
  ON btc_inputs (prev_txid, prev_vout_n)
  WHERE prev_txid IS NOT NULL AND prev_vout_n IS NOT NULL;

CREATE TABLE IF NOT EXISTS btc_spent_edges (
  spending_txid TEXT NOT NULL,
  vin_n INTEGER NOT NULL,
  prev_txid TEXT NOT NULL,
  prev_vout_n INTEGER NOT NULL,
  spending_block_height BIGINT NOT NULL REFERENCES btc_blocks(height) ON DELETE CASCADE,
  spending_time TIMESTAMPTZ NOT NULL,
  created_block_height BIGINT,
  created_time TIMESTAMPTZ,
  value_sats BIGINT,
  age_seconds BIGINT,
  prev_script_pubkey TEXT,
  prev_script_type TEXT,
  prev_address TEXT,
  prev_descriptor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (spending_txid, vin_n),
  CONSTRAINT uq_btc_spent_edges_prevout UNIQUE (prev_txid, prev_vout_n),
  CONSTRAINT fk_btc_spent_edges_input FOREIGN KEY (spending_txid, vin_n)
    REFERENCES btc_inputs (spending_txid, vin_n) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_btc_spent_edges_time
  ON btc_spent_edges (spending_time DESC);

CREATE TABLE IF NOT EXISTS btc_descriptor_watchlists (
  id BIGSERIAL PRIMARY KEY,
  watch_slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  descriptor TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'mainnet',
  start_height BIGINT NOT NULL DEFAULT 0,
  end_height BIGINT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS btc_entity_labels (
  id BIGSERIAL PRIMARY KEY,
  entity_slug TEXT NOT NULL,
  label_type TEXT NOT NULL,
  target_kind TEXT NOT NULL,
  target_value TEXT NOT NULL,
  confidence NUMERIC(5,4) NOT NULL DEFAULT 1.0000,
  source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_btc_entity_target UNIQUE (entity_slug, target_kind, target_value)
);

CREATE INDEX IF NOT EXISTS idx_btc_entity_labels_entity
  ON btc_entity_labels (entity_slug, label_type);

CREATE TABLE IF NOT EXISTS btc_sync_state (
  pipeline_name TEXT PRIMARY KEY,
  last_height BIGINT NOT NULL,
  last_block_hash TEXT NOT NULL,
  cursor JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS btc_daily_metrics (
  day DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  dimension_key TEXT NOT NULL DEFAULT 'all',
  dimensions JSONB NOT NULL DEFAULT '{}'::JSONB,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (day, metric_name, dimension_key)
);

CREATE INDEX IF NOT EXISTS idx_btc_daily_metrics_metric_day
  ON btc_daily_metrics (metric_name, day DESC);

CREATE TABLE IF NOT EXISTS btc_entity_flow_daily (
  day DATE NOT NULL,
  entity_slug TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'mainnet',
  received_sats BIGINT NOT NULL DEFAULT 0,
  sent_sats BIGINT NOT NULL DEFAULT 0,
  netflow_sats BIGINT NOT NULL DEFAULT 0,
  tx_count INTEGER NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (day, entity_slug, network)
);

CREATE INDEX IF NOT EXISTS idx_btc_entity_flow_daily_entity
  ON btc_entity_flow_daily (entity_slug, day DESC);

CREATE TABLE IF NOT EXISTS btc_alert_events (
  id BIGSERIAL PRIMARY KEY,
  detected_at TIMESTAMPTZ NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  related_txid TEXT,
  related_entity_slug TEXT,
  context JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_btc_alert_dedup UNIQUE (alert_type, detected_at, related_txid, related_entity_slug)
);

CREATE INDEX IF NOT EXISTS idx_btc_alert_events_detected_at
  ON btc_alert_events (detected_at DESC);

ALTER TABLE btc_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE btc_txs ENABLE ROW LEVEL SECURITY;
ALTER TABLE btc_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE btc_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE btc_spent_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE btc_descriptor_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE btc_entity_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE btc_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE btc_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE btc_entity_flow_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE btc_alert_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_btc_metric_series(
  target_metric TEXT,
  target_dimension_key TEXT DEFAULT 'all',
  lookback_days INTEGER DEFAULT 90
)
RETURNS TABLE(day DATE, metric_value NUMERIC, unit TEXT) AS $$
  SELECT
    day,
    metric_value,
    unit
  FROM btc_daily_metrics
  WHERE metric_name = target_metric
    AND dimension_key = target_dimension_key
    AND day >= CURRENT_DATE - lookback_days
  ORDER BY day;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_btc_entity_flow_series(
  target_entity_slug TEXT,
  lookback_days INTEGER DEFAULT 90
)
RETURNS TABLE(
  day DATE,
  received_sats BIGINT,
  sent_sats BIGINT,
  netflow_sats BIGINT,
  tx_count INTEGER
) AS $$
  SELECT
    day,
    received_sats,
    sent_sats,
    netflow_sats,
    tx_count
  FROM btc_entity_flow_daily
  WHERE entity_slug = target_entity_slug
    AND day >= CURRENT_DATE - lookback_days
  ORDER BY day;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_btc_alert_feed(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
  detected_at TIMESTAMPTZ,
  alert_type TEXT,
  severity TEXT,
  title TEXT,
  body TEXT,
  related_txid TEXT,
  related_entity_slug TEXT,
  context JSONB
) AS $$
  SELECT
    detected_at,
    alert_type,
    severity,
    title,
    body,
    related_txid,
    related_entity_slug,
    context
  FROM btc_alert_events
  ORDER BY detected_at DESC
  LIMIT limit_count;
$$ LANGUAGE SQL STABLE;
