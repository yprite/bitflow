ALTER TABLE btc_spent_edges
  ADD COLUMN IF NOT EXISTS prev_script_pubkey TEXT,
  ADD COLUMN IF NOT EXISTS prev_script_type TEXT,
  ADD COLUMN IF NOT EXISTS prev_address TEXT,
  ADD COLUMN IF NOT EXISTS prev_descriptor TEXT;

ALTER TABLE btc_spent_edges
  DROP CONSTRAINT IF EXISTS fk_btc_spent_edges_output;
