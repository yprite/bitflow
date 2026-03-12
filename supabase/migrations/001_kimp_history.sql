-- Persistent kimp history sampled in 10-minute buckets.
CREATE TABLE IF NOT EXISTS kimp_history (
  id BIGSERIAL PRIMARY KEY,
  bucket_at TIMESTAMPTZ NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL,
  upbit_price NUMERIC NOT NULL,
  global_price NUMERIC NOT NULL,
  usd_krw NUMERIC NOT NULL,
  kimchi_premium NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_kimp_history_bucket UNIQUE (bucket_at)
);

CREATE INDEX IF NOT EXISTS idx_kimp_history_bucket_desc
  ON kimp_history (bucket_at DESC);

ALTER TABLE kimp_history ENABLE ROW LEVEL SECURITY;
