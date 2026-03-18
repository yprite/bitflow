-- Raw news candidates ingested from RSS and X/Twitter.
CREATE TABLE IF NOT EXISTS news_candidates (
  id BIGSERIAL PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  external_id TEXT NOT NULL,
  author_handle TEXT,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  topic_hint TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_news_candidates_source_external UNIQUE (source_type, source_name, external_id)
);

CREATE INDEX IF NOT EXISTS idx_news_candidates_published_at_desc
  ON news_candidates (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_candidates_topic_hint
  ON news_candidates (topic_hint, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_candidates_author_handle
  ON news_candidates (author_handle, published_at DESC);

ALTER TABLE news_candidates ENABLE ROW LEVEL SECURITY;
