-- Anonymous sessions
CREATE TABLE anonymous_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Votes (with UPSERT support for opinion change)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_slug TEXT NOT NULL,
  session_id UUID NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('bull', 'bear')),
  market_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stock_slug, session_id, market_date)
);

-- Daily aggregates
CREATE TABLE vote_daily_aggregates (
  stock_slug TEXT NOT NULL,
  market_date DATE NOT NULL,
  bull_count INT NOT NULL DEFAULT 0,
  bear_count INT NOT NULL DEFAULT 0,
  total_count INT NOT NULL DEFAULT 0,
  bull_ratio NUMERIC(5,4) NOT NULL DEFAULT 0.5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (stock_slug, market_date)
);

-- Hourly snapshots
CREATE TABLE vote_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_slug TEXT NOT NULL,
  bucket_at TIMESTAMPTZ NOT NULL,
  bull_count INT NOT NULL,
  bear_count INT NOT NULL,
  total_count INT NOT NULL,
  bull_ratio NUMERIC(5,4) NOT NULL,
  delta_1h NUMERIC(5,4),
  is_flip BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stock_slug, bucket_at)
);

-- Briefings (manual operation)
CREATE TABLE briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_slug TEXT NOT NULL,
  market_date DATE NOT NULL,
  slot SMALLINT NOT NULL CHECK (slot BETWEEN 1 AND 3),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  tone TEXT NOT NULL CHECK (tone IN ('bull', 'bear', 'neutral')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stock_slug, market_date, slot)
);

CREATE INDEX idx_votes_stock_market_date ON votes (stock_slug, market_date);
CREATE INDEX idx_snapshots_stock_bucket ON vote_snapshots (stock_slug, bucket_at);

-- RLS policies
ALTER TABLE anonymous_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_daily_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read aggregates" ON vote_daily_aggregates FOR SELECT USING (true);
CREATE POLICY "Public read snapshots" ON vote_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read briefings" ON briefings FOR SELECT USING (true);

-- Service key full access (for API routes)
CREATE POLICY "Service insert sessions" ON anonymous_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manage votes" ON votes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manage aggregates" ON vote_daily_aggregates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manage snapshots" ON vote_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manage briefings" ON briefings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Atomic increment for new vote
CREATE OR REPLACE FUNCTION increment_vote_aggregate(
  p_stock_slug TEXT,
  p_market_date DATE,
  p_side TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO vote_daily_aggregates (stock_slug, market_date, bull_count, bear_count, total_count, bull_ratio)
  VALUES (
    p_stock_slug, p_market_date,
    CASE WHEN p_side = 'bull' THEN 1 ELSE 0 END,
    CASE WHEN p_side = 'bear' THEN 1 ELSE 0 END,
    1,
    CASE WHEN p_side = 'bull' THEN 1.0 ELSE 0.0 END
  )
  ON CONFLICT (stock_slug, market_date)
  DO UPDATE SET
    bull_count = vote_daily_aggregates.bull_count + CASE WHEN p_side = 'bull' THEN 1 ELSE 0 END,
    bear_count = vote_daily_aggregates.bear_count + CASE WHEN p_side = 'bear' THEN 1 ELSE 0 END,
    total_count = vote_daily_aggregates.total_count + 1,
    bull_ratio = (vote_daily_aggregates.bull_count + CASE WHEN p_side = 'bull' THEN 1 ELSE 0 END)::numeric
                 / NULLIF(vote_daily_aggregates.total_count + 1, 0),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Atomic adjust for opinion change (old_side -1, new_side +1, total unchanged)
CREATE OR REPLACE FUNCTION adjust_vote_aggregate(
  p_stock_slug TEXT,
  p_market_date DATE,
  p_old_side TEXT,
  p_new_side TEXT
) RETURNS void AS $$
BEGIN
  UPDATE vote_daily_aggregates SET
    bull_count = bull_count
      + CASE WHEN p_new_side = 'bull' THEN 1 ELSE 0 END
      - CASE WHEN p_old_side = 'bull' THEN 1 ELSE 0 END,
    bear_count = bear_count
      + CASE WHEN p_new_side = 'bear' THEN 1 ELSE 0 END
      - CASE WHEN p_old_side = 'bear' THEN 1 ELSE 0 END,
    bull_ratio = (bull_count
      + CASE WHEN p_new_side = 'bull' THEN 1 ELSE 0 END
      - CASE WHEN p_old_side = 'bull' THEN 1 ELSE 0 END)::numeric
      / NULLIF(total_count, 0),
    updated_at = now()
  WHERE stock_slug = p_stock_slug AND market_date = p_market_date;
END;
$$ LANGUAGE plpgsql;
