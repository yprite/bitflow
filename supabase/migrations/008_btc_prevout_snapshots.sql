CREATE TABLE IF NOT EXISTS btc_prevout_snapshots (
  txid TEXT NOT NULL,
  vout_n INTEGER NOT NULL,
  block_height BIGINT NOT NULL,
  block_time TIMESTAMPTZ NOT NULL,
  value_sats BIGINT NOT NULL,
  script_pubkey TEXT NOT NULL,
  script_type TEXT,
  address TEXT,
  descriptor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (txid, vout_n)
);

CREATE INDEX IF NOT EXISTS idx_btc_prevout_snapshots_block_height
  ON btc_prevout_snapshots (block_height DESC);

ALTER TABLE btc_prevout_snapshots ENABLE ROW LEVEL SECURITY;
