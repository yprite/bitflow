-- Growth analytics helpers for admin dashboard.

-- RPC: Session-level growth overview
CREATE OR REPLACE FUNCTION get_growth_overview(since_date TEXT)
RETURNS TABLE(
  pageview_sessions BIGINT,
  avg_pageviews_per_session NUMERIC,
  activated_sessions BIGINT,
  activation_rate NUMERIC,
  utm_sessions BIGINT,
  utm_rate NUMERIC
) AS $$
  WITH pageview_sessions AS (
    SELECT
      session_id,
      COUNT(*) AS pageviews
    FROM events
    WHERE event_type = 'pageview'
      AND created_at >= since_date::TIMESTAMPTZ
    GROUP BY session_id
  ),
  first_touch AS (
    SELECT DISTINCT ON (session_id)
      session_id,
      COALESCE(utm_source, '') AS utm_source
    FROM events
    WHERE event_type = 'pageview'
      AND created_at >= since_date::TIMESTAMPTZ
    ORDER BY session_id, created_at
  )
  SELECT
    COUNT(ps.session_id) AS pageview_sessions,
    COALESCE(ROUND(AVG(ps.pageviews)::NUMERIC, 2), 0) AS avg_pageviews_per_session,
    COUNT(ps.session_id) FILTER (WHERE ps.pageviews >= 2) AS activated_sessions,
    COALESCE(
      ROUND(
        (COUNT(ps.session_id) FILTER (WHERE ps.pageviews >= 2))::NUMERIC
        / NULLIF(COUNT(ps.session_id), 0) * 100,
        1
      ),
      0
    ) AS activation_rate,
    COUNT(ft.session_id) FILTER (WHERE NULLIF(ft.utm_source, '') IS NOT NULL) AS utm_sessions,
    COALESCE(
      ROUND(
        (COUNT(ft.session_id) FILTER (WHERE NULLIF(ft.utm_source, '') IS NOT NULL))::NUMERIC
        / NULLIF(COUNT(ps.session_id), 0) * 100,
        1
      ),
      0
    ) AS utm_rate
  FROM pageview_sessions ps
  LEFT JOIN first_touch ft USING (session_id);
$$ LANGUAGE SQL STABLE;

-- RPC: Landing page performance from the session's first pageview
CREATE OR REPLACE FUNCTION get_landing_page_breakdown(since_date TEXT)
RETURNS TABLE(
  page TEXT,
  sessions BIGINT,
  activated_sessions BIGINT,
  activation_rate NUMERIC,
  avg_pageviews NUMERIC
) AS $$
  WITH pageview_sessions AS (
    SELECT
      session_id,
      COUNT(*) AS pageviews
    FROM events
    WHERE event_type = 'pageview'
      AND created_at >= since_date::TIMESTAMPTZ
    GROUP BY session_id
  ),
  landing_pages AS (
    SELECT DISTINCT ON (session_id)
      session_id,
      page
    FROM events
    WHERE event_type = 'pageview'
      AND created_at >= since_date::TIMESTAMPTZ
    ORDER BY session_id, created_at
  )
  SELECT
    lp.page,
    COUNT(*) AS sessions,
    COUNT(*) FILTER (WHERE ps.pageviews >= 2) AS activated_sessions,
    COALESCE(
      ROUND(
        (COUNT(*) FILTER (WHERE ps.pageviews >= 2))::NUMERIC
        / NULLIF(COUNT(*), 0) * 100,
        1
      ),
      0
    ) AS activation_rate,
    COALESCE(ROUND(AVG(ps.pageviews)::NUMERIC, 2), 0) AS avg_pageviews
  FROM landing_pages lp
  JOIN pageview_sessions ps USING (session_id)
  GROUP BY lp.page
  ORDER BY sessions DESC, activation_rate DESC
  LIMIT 10;
$$ LANGUAGE SQL STABLE;

-- RPC: First-touch acquisition channel performance
CREATE OR REPLACE FUNCTION get_acquisition_breakdown(since_date TEXT)
RETURNS TABLE(
  channel TEXT,
  sessions BIGINT,
  activated_sessions BIGINT,
  activation_rate NUMERIC,
  avg_pageviews NUMERIC
) AS $$
  WITH pageview_sessions AS (
    SELECT
      session_id,
      COUNT(*) AS pageviews
    FROM events
    WHERE event_type = 'pageview'
      AND created_at >= since_date::TIMESTAMPTZ
    GROUP BY session_id
  ),
  first_touch AS (
    SELECT DISTINCT ON (session_id)
      session_id,
      COALESCE(utm_source, '') AS utm_source,
      COALESCE(utm_medium, '') AS utm_medium,
      COALESCE(referrer, '') AS referrer
    FROM events
    WHERE event_type = 'pageview'
      AND created_at >= since_date::TIMESTAMPTZ
    ORDER BY session_id, created_at
  ),
  labeled_touch AS (
    SELECT
      session_id,
      CASE
        WHEN NULLIF(utm_source, '') IS NOT NULL THEN
          CONCAT(utm_source, ' / ', COALESCE(NULLIF(utm_medium, ''), '(utm)'))
        WHEN referrer = '' THEN
          '(direct)'
        WHEN LOWER(referrer) ~ 'google\\.|naver\\.|bing\\.|daum\\.' THEN
          'organic search'
        WHEN LOWER(referrer) ~ 't\\.co|twitter\\.com|x\\.com|instagram\\.com|facebook\\.com|linkedin\\.com|youtube\\.com' THEN
          'social'
        WHEN LOWER(referrer) ~ '^https?://' THEN
          REGEXP_REPLACE(LOWER(referrer), '^https?://(www\\.)?([^/]+)/?.*$', '\\2')
        ELSE
          LOWER(referrer)
      END AS channel
    FROM first_touch
  )
  SELECT
    lt.channel,
    COUNT(*) AS sessions,
    COUNT(*) FILTER (WHERE ps.pageviews >= 2) AS activated_sessions,
    COALESCE(
      ROUND(
        (COUNT(*) FILTER (WHERE ps.pageviews >= 2))::NUMERIC
        / NULLIF(COUNT(*), 0) * 100,
        1
      ),
      0
    ) AS activation_rate,
    COALESCE(ROUND(AVG(ps.pageviews)::NUMERIC, 2), 0) AS avg_pageviews
  FROM labeled_touch lt
  JOIN pageview_sessions ps USING (session_id)
  GROUP BY lt.channel
  ORDER BY sessions DESC, activation_rate DESC
  LIMIT 10;
$$ LANGUAGE SQL STABLE;
