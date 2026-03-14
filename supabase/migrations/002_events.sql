-- Event tracking for admin analytics dashboard.
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,           -- 'pageview', 'click', 'feature_use'
  page TEXT NOT NULL,                 -- '/indicators', '/tools', etc.
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device_type TEXT,                   -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  country TEXT,
  metadata JSONB DEFAULT '{}',       -- arbitrary extra data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_created_at ON events (created_at DESC);
CREATE INDEX idx_events_event_type ON events (event_type, created_at DESC);
CREATE INDEX idx_events_page ON events (page, created_at DESC);
CREATE INDEX idx_events_session ON events (session_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RPC: Daily pageview counts
CREATE OR REPLACE FUNCTION get_daily_pageviews(since_date TEXT)
RETURNS TABLE(day DATE, pageviews BIGINT, unique_sessions BIGINT) AS $$
  SELECT
    DATE(created_at AT TIME ZONE 'Asia/Seoul') AS day,
    COUNT(*) AS pageviews,
    COUNT(DISTINCT session_id) AS unique_sessions
  FROM events
  WHERE event_type = 'pageview'
    AND created_at >= since_date::TIMESTAMPTZ
  GROUP BY day
  ORDER BY day;
$$ LANGUAGE SQL STABLE;

-- RPC: Page breakdown
CREATE OR REPLACE FUNCTION get_page_breakdown(since_date TEXT)
RETURNS TABLE(page TEXT, views BIGINT, unique_sessions BIGINT) AS $$
  SELECT
    page,
    COUNT(*) AS views,
    COUNT(DISTINCT session_id) AS unique_sessions
  FROM events
  WHERE event_type = 'pageview'
    AND created_at >= since_date::TIMESTAMPTZ
  GROUP BY page
  ORDER BY views DESC;
$$ LANGUAGE SQL STABLE;

-- RPC: Referrer breakdown
CREATE OR REPLACE FUNCTION get_referrer_breakdown(since_date TEXT)
RETURNS TABLE(referrer TEXT, count BIGINT) AS $$
  SELECT
    COALESCE(NULLIF(referrer, ''), '(직접 방문)') AS referrer,
    COUNT(*) AS count
  FROM events
  WHERE event_type = 'pageview'
    AND created_at >= since_date::TIMESTAMPTZ
  GROUP BY referrer
  ORDER BY count DESC
  LIMIT 20;
$$ LANGUAGE SQL STABLE;

-- RPC: Device breakdown
CREATE OR REPLACE FUNCTION get_device_breakdown(since_date TEXT)
RETURNS TABLE(device_type TEXT, count BIGINT) AS $$
  SELECT
    COALESCE(device_type, 'unknown') AS device_type,
    COUNT(DISTINCT session_id) AS count
  FROM events
  WHERE created_at >= since_date::TIMESTAMPTZ
  GROUP BY device_type
  ORDER BY count DESC;
$$ LANGUAGE SQL STABLE;

-- RPC: Browser breakdown
CREATE OR REPLACE FUNCTION get_browser_breakdown(since_date TEXT)
RETURNS TABLE(browser TEXT, count BIGINT) AS $$
  SELECT
    COALESCE(browser, 'unknown') AS browser,
    COUNT(DISTINCT session_id) AS count
  FROM events
  WHERE created_at >= since_date::TIMESTAMPTZ
  GROUP BY browser
  ORDER BY count DESC;
$$ LANGUAGE SQL STABLE;

-- RPC: Feature usage (non-pageview events)
CREATE OR REPLACE FUNCTION get_feature_usage(since_date TEXT)
RETURNS TABLE(event_type TEXT, count BIGINT, unique_sessions BIGINT) AS $$
  SELECT
    event_type,
    COUNT(*) AS count,
    COUNT(DISTINCT session_id) AS unique_sessions
  FROM events
  WHERE event_type != 'pageview'
    AND created_at >= since_date::TIMESTAMPTZ
  GROUP BY event_type
  ORDER BY count DESC;
$$ LANGUAGE SQL STABLE;

-- RPC: UTM source breakdown
CREATE OR REPLACE FUNCTION get_utm_breakdown(since_date TEXT)
RETURNS TABLE(source TEXT, medium TEXT, campaign TEXT, count BIGINT) AS $$
  SELECT
    COALESCE(utm_source, '(none)') AS source,
    COALESCE(utm_medium, '(none)') AS medium,
    COALESCE(utm_campaign, '(none)') AS campaign,
    COUNT(*) AS count
  FROM events
  WHERE utm_source IS NOT NULL
    AND created_at >= since_date::TIMESTAMPTZ
  GROUP BY utm_source, utm_medium, utm_campaign
  ORDER BY count DESC
  LIMIT 20;
$$ LANGUAGE SQL STABLE;

-- RPC: Total event counts
CREATE OR REPLACE FUNCTION get_event_totals(since_date TEXT)
RETURNS TABLE(total_events BIGINT, total_pageviews BIGINT, unique_sessions BIGINT) AS $$
  SELECT
    COUNT(*) AS total_events,
    COUNT(*) FILTER (WHERE event_type = 'pageview') AS total_pageviews,
    COUNT(DISTINCT session_id) AS unique_sessions
  FROM events
  WHERE created_at >= since_date::TIMESTAMPTZ;
$$ LANGUAGE SQL STABLE;
