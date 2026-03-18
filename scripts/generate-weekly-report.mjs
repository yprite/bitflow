#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const execFileAsync = promisify(execFile);
const { Pool: PgPool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const CODEx_TIMEOUT_SECONDS = 120;

const NEWS_FEEDS = [
  {
    name: 'Google News BTC',
    url: 'https://news.google.com/rss/search?q=%28bitcoin%20OR%20BTC%29%20when%3A7d&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'Google News ETF',
    url: 'https://news.google.com/rss/search?q=%28bitcoin%20ETF%20OR%20BlackRock%20OR%20Fidelity%20OR%20SEC%29%20when%3A7d&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'Google News Strategy',
    url: 'https://news.google.com/rss/search?q=%28Strategy%20OR%20MicroStrategy%29%20bitcoin%20when%3A7d&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'SEC Press Releases',
    url: 'https://www.sec.gov/news/pressreleases.rss',
  },
  {
    name: 'Bitcoin.org Blog',
    url: 'https://bitcoin.org/en/rss/blog.xml',
  },
];

function setEnvFromText(text) {
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const [key, ...rest] = line.split('=');
    if (!process.env[key]) {
      process.env[key] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  }
}

async function loadEnvFile(filePath) {
  try {
    const text = await readFile(filePath, 'utf8');
    setEnvFromText(text);
  } catch {
    // Optional env file.
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function toKstMidnight(date) {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - KST_OFFSET_MS);
}

function addDaysKst(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function formatIsoDateKst(date) {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

function parseIsoDateKst(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid ISO date: ${value}`);
  }

  return new Date(`${value}T00:00:00+09:00`);
}

function resolveWeekWindow(explicitWeekStart) {
  if (explicitWeekStart) {
    const weekStartDate = parseIsoDateKst(explicitWeekStart);
    return {
      weekStart: explicitWeekStart,
      weekEnd: formatIsoDateKst(addDaysKst(weekStartDate, 6)),
    };
  }

  const todayKst = toKstMidnight(new Date());
  const weekday = new Date(todayKst.getTime() + KST_OFFSET_MS).getUTCDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  const currentWeekMonday = addDaysKst(todayKst, -daysSinceMonday);
  const previousWeekMonday = addDaysKst(currentWeekMonday, -7);

  return {
    weekStart: formatIsoDateKst(previousWeekMonday),
    weekEnd: formatIsoDateKst(addDaysKst(previousWeekMonday, 6)),
  };
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    skipLlm: false,
    weekStart: null,
    model: process.env.BITFLOW_WEEKLY_REPORT_MODEL || null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--skip-llm') {
      options.skipLlm = true;
      continue;
    }

    if (arg === '--week-start') {
      options.weekStart = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === '--model') {
      options.model = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
  }

  return options;
}

function createSupabaseClient() {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_KEY'), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function fetchJson(url, revalidateLabel) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'bitflow-weekly-report/1.0' },
  });

  if (!response.ok) {
    throw new Error(`${revalidateLabel} request failed (${response.status})`);
  }

  return response.json();
}

function average(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stripHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, 'i'));
  return match ? stripHtml(match[1]) : '';
}

function extractSource(block, fallbackName) {
  const match = block.match(/<source(?:\s+url="([^"]+)")?>([\s\S]*?)<\/source>/i);
  if (!match) {
    return { sourceName: fallbackName, sourceUrl: null };
  }

  return {
    sourceName: stripHtml(match[2]) || fallbackName,
    sourceUrl: match[1] ?? null,
  };
}

function normalizeTitle(value) {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d'"]/g, '')
    .replace(/[^a-z0-9가-힣]+/g, ' ')
    .trim();
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.toString();
  } catch {
    return value.trim();
  }
}

function inferTopicFromText(text) {
  const normalized = text.toLowerCase();
  if (/etf|blackrock|fidelity|sec/.test(normalized)) return 'ETF/정책';
  if (/strategy|microstrategy|treasury|reserve/.test(normalized)) return '기업 매수';
  if (/hack|exploit|security|stolen|exchange/.test(normalized)) return '보안/거래소';
  if (/miner|mining|hashrate|difficulty/.test(normalized)) return '마이닝';
  if (/fed|cpi|inflation|jobs|employment|macro/.test(normalized)) return '거시';
  return '시장 일반';
}

function scoreNewsCandidate(candidate, weekStartDate) {
  const publishedAt = candidate.publishedAt ? new Date(candidate.publishedAt) : null;
  const text = `${candidate.title} ${candidate.description}`.toLowerCase();
  let score = 0;

  if (publishedAt && Number.isFinite(publishedAt.getTime())) {
    const ageDays = Math.max(0, Math.floor((Date.now() - publishedAt.getTime()) / DAY_MS));
    score += Math.max(0, 8 - ageDays);
  }

  if (/bitcoin|btc/.test(text)) score += 6;
  if (/etf|sec|blackrock|fidelity/.test(text)) score += 5;
  if (/strategy|microstrategy|treasury|reserve/.test(text)) score += 5;
  if (/hack|exploit|security|exchange/.test(text)) score += 4;
  if (/miner|mining|hashrate|difficulty/.test(text)) score += 3;
  if (/fed|cpi|inflation|jobs/.test(text)) score += 2;
  if (candidate.feedName === 'SEC Press Releases') score += 3;

  if (publishedAt && publishedAt < weekStartDate) {
    score -= 4;
  }

  return score;
}

function parseRssFeed(xml, feedName) {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return items.map((block, index) => {
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const description = extractTag(block, 'description');
    const pubDate = extractTag(block, 'pubDate');
    const source = extractSource(block, feedName);

    return {
      id: `${feedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index + 1}`,
      feedName,
      title,
      url: normalizeUrl(link),
      publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
      description,
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      topicHint: inferTopicFromText(`${title} ${description}`),
    };
  });
}

async function fetchNewsCandidates(weekStart, weekEnd) {
  const weekStartDate = new Date(`${weekStart}T00:00:00+09:00`);
  const weekEndExclusive = new Date(`${weekEnd}T23:59:59+09:00`);
  const seen = new Set();
  const candidates = [];

  for (const feed of NEWS_FEEDS) {
    try {
      const response = await fetch(feed.url, {
        headers: { 'User-Agent': 'bitflow-weekly-report/1.0' },
      });
      if (!response.ok) {
        continue;
      }

      const xml = await response.text();
      const items = parseRssFeed(xml, feed.name);

      for (const item of items) {
        if (!item.title || !item.url) {
          continue;
        }

        if (item.publishedAt) {
          const publishedAt = new Date(item.publishedAt);
          if (publishedAt > weekEndExclusive || publishedAt < new Date(weekStartDate.getTime() - DAY_MS)) {
            continue;
          }
        }

        const dedupeKey = `${normalizeTitle(item.title)}::${normalizeUrl(item.url)}`;
        if (seen.has(dedupeKey)) {
          continue;
        }
        seen.add(dedupeKey);

        candidates.push({
          ...item,
          score: scoreNewsCandidate(item, weekStartDate),
        });
      }
    } catch {
      // Skip broken feeds and continue.
    }
  }

  const ranked = candidates
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (right.publishedAt ?? '').localeCompare(left.publishedAt ?? '');
    })
    .slice(0, 60);

  const topicCounts = new Map();
  const balanced = ranked.filter((item) => {
    const topic = item.topicHint || '시장 일반';
    const count = topicCounts.get(topic) ?? 0;
    if (count >= 8) {
      return false;
    }
    topicCounts.set(topic, count + 1);
    return true;
  });

  return balanced
    .slice(0, 30)
    .map((item, index) => ({
      ...item,
      id: `candidate-${index + 1}`,
    }));
}

async function fetchMarketSnapshot(supabase, weekStart, weekEnd) {
  const [{ prices }, fearGreed, funding, upbitPrice, usdRates, kimpHistoryRows] = await Promise.all([
    fetchJson(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=14&interval=daily',
      'CoinGecko market chart'
    ),
    fetchJson('https://api.alternative.me/fng/', 'Fear & Greed'),
    fetchJson(
      'https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP',
      'OKX funding'
    ),
    fetchJson('https://api.upbit.com/v1/ticker?markets=KRW-BTC', 'Upbit ticker'),
    fetchJson('https://open.er-api.com/v6/latest/USD', 'USD/KRW exchange rate'),
    supabase
      .from('kimp_history')
      .select('bucket_at, kimchi_premium')
      .gte('bucket_at', `${weekStart}T00:00:00+09:00`)
      .lte('bucket_at', `${weekEnd}T23:59:59+09:00`)
      .order('bucket_at', { ascending: true }),
  ]);

  const priceSeries = Array.isArray(prices) ? prices : [];
  const firstPoint = priceSeries.at(0)?.[1];
  const lastPoint = priceSeries.at(-1)?.[1];
  const weeklyPriceChangePercent =
    typeof firstPoint === 'number' &&
    typeof lastPoint === 'number' &&
    Number.isFinite(firstPoint) &&
    Number.isFinite(lastPoint) &&
    firstPoint !== 0
      ? ((lastPoint - firstPoint) / firstPoint) * 100
      : null;

  const kimpValues = ((kimpHistoryRows.data ?? []) || [])
    .map((row) => Number(row.kimchi_premium))
    .filter((value) => Number.isFinite(value));

  const latestKimp =
    kimpValues.length > 0 ? kimpValues[kimpValues.length - 1] : null;
  const fearGreedEntry = Array.isArray(fearGreed?.data) ? fearGreed.data[0] : null;
  const fundingEntry = Array.isArray(funding?.data) ? funding.data[0] : null;
  const latestPriceUsd = typeof lastPoint === 'number' && Number.isFinite(lastPoint) ? lastPoint : null;
  const latestUpbitPrice = Array.isArray(upbitPrice) ? Number(upbitPrice[0]?.trade_price) : null;
  const usdKrw = Number(usdRates?.rates?.KRW);
  const computedKimp =
    latestUpbitPrice && latestPriceUsd && usdKrw
      ? ((latestUpbitPrice / (latestPriceUsd * usdKrw)) - 1) * 100
      : latestKimp;

  return {
    priceUsd: latestPriceUsd,
    weeklyPriceChangePercent,
    kimpAverage: average(kimpValues),
    kimpLatest: computedKimp,
    fearGreedValue: fearGreedEntry ? Number(fearGreedEntry.value) : null,
    fearGreedClassification:
      fearGreedEntry && typeof fearGreedEntry.value_classification === 'string'
        ? fearGreedEntry.value_classification
        : null,
    fundingRatePercent: fundingEntry ? Number(fundingEntry.fundingRate) * 100 : null,
  };
}

function buildMetricSeries(rows) {
  const map = new Map();

  for (const row of rows) {
    const key = `${row.metric_name}:${row.dimension_key}`;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push({
      day: row.day,
      value: Number(row.metric_value),
    });
  }

  for (const series of map.values()) {
    series.sort((left, right) => left.day.localeCompare(right.day));
  }

  return map;
}

function latestMetricValue(metricSeries, key, maxDay) {
  const series = metricSeries.get(key) ?? [];
  const filtered = series.filter((row) => row.day <= maxDay);
  return filtered.length > 0 ? filtered[filtered.length - 1].value : null;
}

function sumMetric(metricSeries, key, minDay, maxDay) {
  const series = metricSeries.get(key) ?? [];
  const values = series
    .filter((row) => row.day >= minDay && row.day <= maxDay)
    .map((row) => row.value)
    .filter((value) => Number.isFinite(value));

  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) : null;
}

async function loadOnchainSnapshotFromPostgres(pgPool, weekStart, weekEnd) {
  const previousWeekStart = formatIsoDateKst(addDaysKst(parseIsoDateKst(weekStart), -7));
  const previousWeekEnd = formatIsoDateKst(addDaysKst(parseIsoDateKst(weekEnd), -7));

  const [metricsResult, entityFlowResult, alertCountResult, highlightAlertsResult] = await Promise.all([
    pgPool.query(
      `
        SELECT day::text AS day, metric_name, dimension_key, metric_value::float8 AS metric_value
        FROM btc_daily_metrics
        WHERE day BETWEEN $1::date AND $2::date
          AND (
            (metric_name = 'spent_btc' AND dimension_key = 'all')
            OR (metric_name = 'dormant_reactivated_btc' AND dimension_key = 'all')
            OR (metric_name = 'active_supply_ratio' AND dimension_key IN ('30d', '90d'))
          )
        ORDER BY day ASC
      `,
      [previousWeekStart, weekEnd]
    ),
    pgPool.query(
      `
        SELECT
          entity_slug,
          SUM(received_sats)::float8 / 100000000 AS received_btc,
          SUM(sent_sats)::float8 / 100000000 AS sent_btc,
          SUM(netflow_sats)::float8 / 100000000 AS netflow_btc,
          SUM(tx_count)::int AS tx_count
        FROM btc_entity_flow_daily
        WHERE day BETWEEN $1::date AND $2::date
        GROUP BY entity_slug
        ORDER BY ABS(SUM(netflow_sats)) DESC
        LIMIT 5
      `,
      [weekStart, weekEnd]
    ),
    pgPool.query(
      `
        SELECT alert_type, COUNT(*)::int AS count
        FROM btc_alert_events
        WHERE detected_at >= $1::timestamptz
          AND detected_at < $2::timestamptz + INTERVAL '1 day'
          AND alert_type IN ('large_confirmed_spend', 'dormant_reactivation')
        GROUP BY alert_type
      `,
      [`${weekStart}T00:00:00+09:00`, `${weekEnd}T00:00:00+09:00`]
    ),
    pgPool.query(
      `
        SELECT
          detected_at,
          alert_type,
          title,
          COALESCE(
            NULLIF(context->>'amount_btc', '')::float8,
            NULLIF(context->>'value_sats', '')::float8 / 100000000,
            NULLIF(context->>'total_output_sats', '')::float8 / 100000000
          ) AS amount_btc
        FROM btc_alert_events
        WHERE detected_at >= $1::timestamptz
          AND detected_at < $2::timestamptz + INTERVAL '1 day'
          AND alert_type IN ('large_confirmed_spend', 'dormant_reactivation')
        ORDER BY amount_btc DESC NULLS LAST, detected_at DESC
        LIMIT 5
      `,
      [`${weekStart}T00:00:00+09:00`, `${weekEnd}T00:00:00+09:00`]
    ),
  ]);

  const metricSeries = buildMetricSeries(metricsResult.rows);
  const latestDay = metricsResult.rows.length > 0 ? metricsResult.rows[metricsResult.rows.length - 1].day : null;
  const whaleAlertCount7d = alertCountResult.rows.reduce((sum, row) => sum + Number(row.count), 0);

  return {
    latestDay,
    spentBtc7d: sumMetric(metricSeries, 'spent_btc:all', weekStart, weekEnd),
    spentBtcPrevious7d: sumMetric(metricSeries, 'spent_btc:all', previousWeekStart, previousWeekEnd),
    dormantReactivatedBtc7d: sumMetric(
      metricSeries,
      'dormant_reactivated_btc:all',
      weekStart,
      weekEnd
    ),
    dormantReactivatedBtcPrevious7d: sumMetric(
      metricSeries,
      'dormant_reactivated_btc:all',
      previousWeekStart,
      previousWeekEnd
    ),
    activeSupply30d: latestDay ? latestMetricValue(metricSeries, 'active_supply_ratio:30d', latestDay) : null,
    activeSupply90d: latestDay ? latestMetricValue(metricSeries, 'active_supply_ratio:90d', latestDay) : null,
    activeSupply30dPrevious:
      previousWeekEnd ? latestMetricValue(metricSeries, 'active_supply_ratio:30d', previousWeekEnd) : null,
    activeSupply90dPrevious:
      previousWeekEnd ? latestMetricValue(metricSeries, 'active_supply_ratio:90d', previousWeekEnd) : null,
    whaleAlertCount7d,
    alertCounts: Object.fromEntries(
      alertCountResult.rows.map((row) => [row.alert_type, Number(row.count)])
    ),
    topEntityFlows: entityFlowResult.rows.map((row) => ({
      entitySlug: row.entity_slug,
      receivedBtc: Number(row.received_btc),
      sentBtc: Number(row.sent_btc),
      netflowBtc: Number(row.netflow_btc),
      txCount: Number(row.tx_count),
    })),
    highlightAlerts: highlightAlertsResult.rows.map((row) => ({
      detectedAt: row.detected_at instanceof Date ? row.detected_at.toISOString() : String(row.detected_at),
      alertType: row.alert_type,
      title: row.title,
      amountBtc: row.amount_btc == null ? null : Number(row.amount_btc),
    })),
  };
}

async function loadOnchainSnapshotFromSupabase(supabase, weekStart, weekEnd) {
  const previousWeekStart = formatIsoDateKst(addDaysKst(parseIsoDateKst(weekStart), -7));
  const previousWeekEnd = formatIsoDateKst(addDaysKst(parseIsoDateKst(weekEnd), -7));
  const weekEndExclusive = `${formatIsoDateKst(addDaysKst(parseIsoDateKst(weekEnd), 1))}T00:00:00+09:00`;

  const [metricsResult, publishedMetricsResult, entityFlowsResult, publishedEntityFlowsResult, alertsResult, publishedAlertsResult] = await Promise.all([
    supabase
      .from('btc_daily_metrics')
      .select('day, metric_name, dimension_key, metric_value')
      .gte('day', previousWeekStart)
      .lte('day', weekEnd)
      .in('metric_name', ['spent_btc', 'dormant_reactivated_btc', 'active_supply_ratio'])
      .order('day', { ascending: true }),
    supabase
      .from('onchain_metrics')
      .select('collected_at, metric_name, value')
      .eq('resolution', 'daily')
      .in('metric_name', [
        'spent_btc',
        'dormant_reactivated_btc',
        'active_supply_ratio_30d',
        'active_supply_ratio_90d',
      ])
      .gte('collected_at', `${previousWeekStart}T00:00:00+09:00`)
      .lt('collected_at', weekEndExclusive)
      .order('collected_at', { ascending: true }),
    supabase
      .from('btc_entity_flow_daily')
      .select('entity_slug, received_sats, sent_sats, netflow_sats, tx_count')
      .gte('day', weekStart)
      .lte('day', weekEnd),
    supabase
      .from('onchain_metrics')
      .select('collected_at, metric_name, value, metadata')
      .eq('resolution', 'daily')
      .gte('metric_name', 'entity_flow_net:')
      .lt('metric_name', 'entity_flow_net;')
      .gte('collected_at', `${weekStart}T00:00:00+09:00`)
      .lt('collected_at', weekEndExclusive)
      .order('collected_at', { ascending: false }),
    supabase
      .from('btc_alert_events')
      .select('detected_at, alert_type, title, context')
      .gte('detected_at', `${weekStart}T00:00:00+09:00`)
      .lt('detected_at', weekEndExclusive)
      .in('alert_type', ['large_confirmed_spend', 'dormant_reactivation'])
      .order('detected_at', { ascending: false }),
    supabase
      .from('whale_transactions')
      .select('timestamp, amount_btc, from_name, to_name')
      .eq('from_type', 'bitflow_onchain')
      .gte('timestamp', `${weekStart}T00:00:00+09:00`)
      .lt('timestamp', weekEndExclusive)
      .order('timestamp', { ascending: false }),
  ]);

  const rawMetricRows = (metricsResult.data ?? []).map((row) => ({
    day: String(row.day).slice(0, 10),
    metric_name: String(row.metric_name),
    dimension_key: String(row.dimension_key),
    metric_value: Number(row.metric_value),
  }));
  const publishedMetricRows = (publishedMetricsResult.data ?? []).map((row) => {
    const metricName = String(row.metric_name);
    let normalizedMetricName = metricName;
    let dimensionKey = 'all';

    if (metricName === 'active_supply_ratio_30d') {
      normalizedMetricName = 'active_supply_ratio';
      dimensionKey = '30d';
    } else if (metricName === 'active_supply_ratio_90d') {
      normalizedMetricName = 'active_supply_ratio';
      dimensionKey = '90d';
    }

    return {
      day: String(row.collected_at).slice(0, 10),
      metric_name: normalizedMetricName,
      dimension_key: dimensionKey,
      metric_value: Number(row.value),
    };
  });
  const metricRows = rawMetricRows.length > 0 ? rawMetricRows : publishedMetricRows;
  const metricSeries = buildMetricSeries(metricRows);
  const latestDay = metricRows.length > 0 ? metricRows[metricRows.length - 1].day : null;

  const entityFlowMap = new Map();
  const rawEntityFlowRows = entityFlowsResult.data ?? [];
  if (rawEntityFlowRows.length > 0) {
    for (const row of rawEntityFlowRows) {
      const entitySlug = String(row.entity_slug);
      if (!entityFlowMap.has(entitySlug)) {
        entityFlowMap.set(entitySlug, {
          entitySlug,
          receivedBtc: 0,
          sentBtc: 0,
          netflowBtc: 0,
          txCount: 0,
        });
      }

      const entry = entityFlowMap.get(entitySlug);
      entry.receivedBtc += Number(row.received_sats ?? 0) / 100000000;
      entry.sentBtc += Number(row.sent_sats ?? 0) / 100000000;
      entry.netflowBtc += Number(row.netflow_sats ?? 0) / 100000000;
      entry.txCount += Number(row.tx_count ?? 0);
    }
  } else {
    for (const row of publishedEntityFlowsResult.data ?? []) {
      const entitySlug = String(row.metric_name).replace(/^entity_flow_net:/, '');
      const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
      entityFlowMap.set(entitySlug, {
        entitySlug,
        receivedBtc: Number(metadata.received_sats ?? 0) / 100000000,
        sentBtc: Number(metadata.sent_sats ?? 0) / 100000000,
        netflowBtc: Number(row.value ?? 0),
        txCount: Number(metadata.tx_count ?? 0),
      });
    }
  }

  const rawAlerts = (alertsResult.data ?? []).map((row) => {
    const context = row.context && typeof row.context === 'object' ? row.context : {};
    const amountBtc =
      Number(context.amount_btc ?? NaN) ||
      Number(context.value_sats ?? NaN) / 100000000 ||
      Number(context.total_output_sats ?? NaN) / 100000000 ||
      null;

    return {
      detectedAt: typeof row.detected_at === 'string' ? row.detected_at : String(row.detected_at),
      alertType: String(row.alert_type),
      title: String(row.title),
      amountBtc,
    };
  });
  const publishedAlerts = (publishedAlertsResult.data ?? []).flatMap((row) => {
    const alertType = typeof row.from_name === 'string' ? row.from_name : '';
    if (alertType !== 'large_confirmed_spend' && alertType !== 'dormant_reactivation') {
      return [];
    }

    return [
      {
        detectedAt: typeof row.timestamp === 'string' ? row.timestamp : String(row.timestamp),
        alertType,
        title: typeof row.to_name === 'string' ? row.to_name : alertType,
        amountBtc: row.amount_btc == null ? null : Number(row.amount_btc),
      },
    ];
  });
  const alerts = rawAlerts.length > 0 ? rawAlerts : publishedAlerts;

  return {
    latestDay,
    spentBtc7d: sumMetric(metricSeries, 'spent_btc:all', weekStart, weekEnd),
    spentBtcPrevious7d: sumMetric(metricSeries, 'spent_btc:all', previousWeekStart, previousWeekEnd),
    dormantReactivatedBtc7d: sumMetric(
      metricSeries,
      'dormant_reactivated_btc:all',
      weekStart,
      weekEnd
    ),
    dormantReactivatedBtcPrevious7d: sumMetric(
      metricSeries,
      'dormant_reactivated_btc:all',
      previousWeekStart,
      previousWeekEnd
    ),
    activeSupply30d: latestDay ? latestMetricValue(metricSeries, 'active_supply_ratio:30d', latestDay) : null,
    activeSupply90d: latestDay ? latestMetricValue(metricSeries, 'active_supply_ratio:90d', latestDay) : null,
    activeSupply30dPrevious:
      previousWeekEnd ? latestMetricValue(metricSeries, 'active_supply_ratio:30d', previousWeekEnd) : null,
    activeSupply90dPrevious:
      previousWeekEnd ? latestMetricValue(metricSeries, 'active_supply_ratio:90d', previousWeekEnd) : null,
    whaleAlertCount7d: alerts.length,
    alertCounts: alerts.reduce((accumulator, alert) => {
      accumulator[alert.alertType] = (accumulator[alert.alertType] ?? 0) + 1;
      return accumulator;
    }, {}),
    topEntityFlows: Array.from(entityFlowMap.values())
      .sort((left, right) => Math.abs(right.netflowBtc) - Math.abs(left.netflowBtc))
      .slice(0, 5),
    highlightAlerts: [...alerts]
      .sort((left, right) => (right.amountBtc ?? 0) - (left.amountBtc ?? 0))
      .slice(0, 5),
  };
}

async function loadOnchainSnapshot(pgPool, supabase, weekStart, weekEnd) {
  try {
    const snapshot = await loadOnchainSnapshotFromPostgres(pgPool, weekStart, weekEnd);
    if (snapshot.latestDay || snapshot.spentBtc7d != null || snapshot.activeSupply30d != null) {
      return snapshot;
    }
  } catch {
    // Fall through to Supabase tables.
  }

  return loadOnchainSnapshotFromSupabase(supabase, weekStart, weekEnd);
}

function compactNumber(value, digits = 1) {
  if (value == null || !Number.isFinite(value)) return 'n/a';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

function buildFallbackReport({ weekStart, weekEnd, marketSnapshot, onchainSnapshot, newsCandidates, modelName }) {
  const seenTopics = new Set();
  const diversifiedCandidates = [];
  for (const candidate of newsCandidates) {
    const topic = candidate.topicHint || '시장 일반';
    if (!seenTopics.has(topic)) {
      diversifiedCandidates.push(candidate);
      seenTopics.add(topic);
      continue;
    }
    if (diversifiedCandidates.length < 5) {
      diversifiedCandidates.push(candidate);
    }
    if (diversifiedCandidates.length >= 5) {
      break;
    }
  }

  const topNews = diversifiedCandidates.slice(0, 5).map((candidate, index) => ({
    rank: index + 1,
    title: candidate.title,
    sourceName: candidate.sourceName,
    sourceUrl: candidate.url,
    publishedAt: candidate.publishedAt,
    summary: candidate.description || `${candidate.sourceName}에서 비트코인 관련 핵심 이슈로 다룬 기사입니다.`,
    whyItMatters: `${candidate.topicHint} 관점에서 이번 주 흐름을 확인할 필요가 있습니다.`,
    topic: candidate.topicHint,
    priority: index + 1,
  }));

  return {
    title: `${weekStart} 주간 비트코인 리포트`,
    dek: `${weekStart}부터 ${weekEnd}까지의 시장과 온체인 흐름을 한 번에 정리했습니다.`,
    summary:
      `BTC 현물 가격은 ${compactNumber(marketSnapshot.priceUsd, 0)}달러, 주간 변화율은 ` +
      `${marketSnapshot.weeklyPriceChangePercent == null ? 'n/a' : `${marketSnapshot.weeklyPriceChangePercent.toFixed(2)}%`}입니다. ` +
      `온체인 기준 7일 이동량은 ${compactNumber(onchainSnapshot.spentBtc7d, 0)} BTC, ` +
      `휴면 재활성 물량은 ${compactNumber(onchainSnapshot.dormantReactivatedBtc7d, 0)} BTC였습니다.`,
    marketView:
      `김프 평균은 ${marketSnapshot.kimpAverage == null ? 'n/a' : `${marketSnapshot.kimpAverage.toFixed(2)}%`}이고 ` +
      `펀딩비는 ${marketSnapshot.fundingRatePercent == null ? 'n/a' : `${marketSnapshot.fundingRatePercent.toFixed(4)}%`} 수준입니다.`,
    onchainView:
      `활성 공급 30일 비율은 ${onchainSnapshot.activeSupply30d == null ? 'n/a' : `${onchainSnapshot.activeSupply30d.toFixed(2)}%`}, ` +
      `경보 이벤트는 ${compactNumber(onchainSnapshot.whaleAlertCount7d, 0)}건 집계됐습니다.`,
    riskWatch:
      topNews.length > 0
        ? `이번 주에는 ${topNews[0].topic ?? '시장 일반'} 이슈를 가장 먼저 확인해야 합니다.`
        : '이번 주 핵심 뉴스를 아직 확보하지 못했습니다.',
    watchlist: [
      'BTC 현물 가격과 7일 수익률 변화',
      '휴면 재활성 물량과 대형 이동 경보',
      'ETF/정책/기업 매수 관련 헤드라인',
    ],
    sections: [
      {
        id: 'market',
        title: '시장 한눈에',
        summary: '가격, 김프, 펀딩비, 공포탐욕을 중심으로 시장의 체온을 점검합니다.',
        bullets: [
          `BTC 현물 가격 ${compactNumber(marketSnapshot.priceUsd, 0)} USD`,
          `7일 수익률 ${marketSnapshot.weeklyPriceChangePercent == null ? 'n/a' : `${marketSnapshot.weeklyPriceChangePercent.toFixed(2)}%`}`,
          `김프 최신 ${marketSnapshot.kimpLatest == null ? 'n/a' : `${marketSnapshot.kimpLatest.toFixed(2)}%`}`,
        ],
      },
      {
        id: 'onchain',
        title: '온체인 흐름',
        summary: '이동량, 휴면 재활성, 활성 공급 비율, 대형 경보를 통해 체인 내부 압력을 봅니다.',
        bullets: [
          `7일 이동 BTC ${compactNumber(onchainSnapshot.spentBtc7d, 0)} BTC`,
          `휴면 재활성 ${compactNumber(onchainSnapshot.dormantReactivatedBtc7d, 0)} BTC`,
          `Whale/대형 경보 ${compactNumber(onchainSnapshot.whaleAlertCount7d, 0)}건`,
        ],
      },
      {
        id: 'news',
        title: '이번 주 꼭 볼 뉴스',
        summary: '헤드라인을 많이 모으는 대신 시장 영향도가 큰 것만 남겼습니다.',
        bullets: topNews.slice(0, 3).map((item) => item.title),
      },
    ],
    newsItems: topNews,
    modelName: modelName ?? 'fallback-template',
    payload: {
      mode: 'fallback',
      selected_candidate_ids: newsCandidates.slice(0, 5).map((candidate) => candidate.id),
    },
  };
}

function buildPrompt({ weekStart, weekEnd, marketSnapshot, onchainSnapshot, newsCandidates }) {
  return `당신은 한국어로 쓰는 비트코인 주간 편집자입니다.

아래 JSON 컨텍스트만 사용해서 주간 리포트를 작성하세요.
사실을 꾸며내지 마세요.
출력은 JSON 하나만 반환하세요. 마크다운, 설명, 코드펜스 금지.
news_items에는 반드시 제공된 candidate_id만 사용하세요.
selected_candidate_ids와 news_items의 candidate_id는 서로 일치해야 합니다.

필수 JSON 스키마:
{
  "title": string,
  "dek": string,
  "summary": string,
  "market_view": string,
  "onchain_view": string,
  "risk_watch": string,
  "watchlist": string[],
  "sections": [
    {
      "id": string,
      "title": string,
      "summary": string,
      "bullets": string[]
    }
  ],
  "selected_candidate_ids": string[],
  "news_items": [
    {
      "candidate_id": string,
      "summary": string,
      "why_it_matters": string,
      "topic": string,
      "priority": number
    }
  ]
}

제약:
- 한국어로 작성
- title은 기사 제목처럼 쓰지 말고 리포트 제목처럼 작성
- dek는 1문장
- summary는 2~3문장
- market_view, onchain_view, risk_watch는 각각 2~4문장
- watchlist는 3개
- sections는 3개 이상 5개 이하
- news_items는 3개 이상 5개 이하
- 뉴스는 비트코인 투자자가 이번 주 반드시 봐야 할 것만 고르기
- ETF/정책, 기업 매수/보유, 거래소/보안, 채굴, 거시 중 영향을 설명할 것

컨텍스트:
${JSON.stringify(
    {
      week_start: weekStart,
      week_end: weekEnd,
      market_snapshot: marketSnapshot,
      onchain_snapshot: onchainSnapshot,
      news_candidates: newsCandidates,
    },
    null,
    2
  )}`;
}

async function callCodex(prompt, model = null) {
  const cmd = ['codex', 'exec', '--json', prompt];
  if (model) {
    cmd.splice(2, 0, '--model', model);
  }

  const { stdout, stderr } = await execFileAsync(cmd[0], cmd.slice(1), {
    cwd: ROOT_DIR,
    timeout: CODEx_TIMEOUT_SECONDS * 1000,
    maxBuffer: 8 * 1024 * 1024,
  });

  if (stderr && stderr.trim()) {
    // Codex often writes progress to stderr; do not fail on that alone.
  }

  let assistantText = null;
  for (const line of stdout.trim().split('\n')) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event.type === 'item.completed' && event.item?.type === 'agent_message' && event.item?.text) {
        assistantText = event.item.text;
      }
    } catch {
      // Ignore malformed event lines.
    }
  }

  if (!assistantText) {
    throw new Error('No assistant message found in codex output');
  }

  return assistantText;
}

function extractJsonObject(raw) {
  const cleaned = raw.replace(/```json|```/gi, '').trim();
  const start = cleaned.indexOf('{');
  if (start < 0) {
    throw new Error('Assistant response did not contain a JSON object');
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < cleaned.length; index += 1) {
    const char = cleaned[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(cleaned.slice(start, index + 1));
      }
    }
  }

  throw new Error('Assistant JSON object was incomplete');
}

function finalizeModelReport({
  generated,
  newsCandidates,
  weekStart,
  weekEnd,
  marketSnapshot,
  onchainSnapshot,
  modelName,
}) {
  const candidateMap = new Map(newsCandidates.map((candidate) => [candidate.id, candidate]));
  const newsItems = [];

  for (const item of Array.isArray(generated.news_items) ? generated.news_items : []) {
    const candidateId = typeof item?.candidate_id === 'string' ? item.candidate_id : '';
    const candidate = candidateMap.get(candidateId);
    if (!candidate) {
      continue;
    }

    newsItems.push({
      rank: newsItems.length + 1,
      title: candidate.title,
      sourceName: candidate.sourceName,
      sourceUrl: candidate.url,
      publishedAt: candidate.publishedAt,
      summary: typeof item.summary === 'string' ? item.summary.trim() : candidate.description,
      whyItMatters:
        typeof item.why_it_matters === 'string'
          ? item.why_it_matters.trim()
          : `${candidate.topicHint} 관점에서 중요한 이슈입니다.`,
      topic: typeof item.topic === 'string' && item.topic.trim() ? item.topic.trim() : candidate.topicHint,
      priority:
        typeof item.priority === 'number' && Number.isFinite(item.priority)
          ? item.priority
          : newsItems.length + 1,
    });
  }

  if (newsItems.length === 0) {
    return buildFallbackReport({
      weekStart,
      weekEnd,
      marketSnapshot,
      onchainSnapshot,
      newsCandidates,
      modelName,
    });
  }

  return {
    title:
      typeof generated.title === 'string' && generated.title.trim()
        ? generated.title.trim()
        : `${weekStart} 주간 비트코인 리포트`,
    dek:
      typeof generated.dek === 'string' && generated.dek.trim()
        ? generated.dek.trim()
        : `${weekStart}부터 ${weekEnd}까지의 핵심 이슈를 정리했습니다.`,
    summary:
      typeof generated.summary === 'string' && generated.summary.trim()
        ? generated.summary.trim()
        : buildFallbackReport({
            weekStart,
            weekEnd,
            marketSnapshot,
            onchainSnapshot,
            newsCandidates,
            modelName,
          }).summary,
    marketView:
      typeof generated.market_view === 'string' && generated.market_view.trim()
        ? generated.market_view.trim()
        : '시장 데이터 해석을 준비하지 못했습니다.',
    onchainView:
      typeof generated.onchain_view === 'string' && generated.onchain_view.trim()
        ? generated.onchain_view.trim()
        : '온체인 데이터 해석을 준비하지 못했습니다.',
    riskWatch:
      typeof generated.risk_watch === 'string' && generated.risk_watch.trim()
        ? generated.risk_watch.trim()
        : '이번 주 핵심 리스크 포인트를 추가로 확인하세요.',
    watchlist: Array.isArray(generated.watchlist)
      ? generated.watchlist.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
      : [],
    sections: Array.isArray(generated.sections)
      ? generated.sections
          .map((section) => ({
            id: typeof section?.id === 'string' ? section.id.trim() : '',
            title: typeof section?.title === 'string' ? section.title.trim() : '',
            summary: typeof section?.summary === 'string' ? section.summary.trim() : '',
            bullets: Array.isArray(section?.bullets)
              ? section.bullets.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
              : [],
          }))
          .filter((section) => section.id && section.title && section.summary)
          .slice(0, 5)
      : [],
    newsItems,
    modelName: modelName ?? 'codex',
    payload: generated,
  };
}

async function storeWeeklyReport(supabase, row, newsItems) {
  const timestamp = new Date().toISOString();
  const reportPayload = {
    slug: row.slug,
    week_start: row.weekStart,
    week_end: row.weekEnd,
    title: row.title,
    dek: row.dek,
    summary: row.summary,
    market_view: row.marketView,
    onchain_view: row.onchainView,
    risk_watch: row.riskWatch,
    watchlist: row.watchlist,
    sections: row.sections,
    market_snapshot: row.marketSnapshot,
    onchain_snapshot: row.onchainSnapshot,
    payload: row.payload,
    model_name: row.modelName,
    generated_by: row.generatedBy,
    generated_at: timestamp,
    published_at: timestamp,
    updated_at: timestamp,
  };

  const { error: reportError } = await supabase
    .from('weekly_reports')
    .upsert(reportPayload, { onConflict: 'slug' });

  if (reportError) {
    throw reportError;
  }

  const { error: deleteError } = await supabase
    .from('weekly_report_news_items')
    .delete()
    .eq('report_slug', row.slug);

  if (deleteError) {
    throw deleteError;
  }

  if (newsItems.length === 0) {
    return;
  }

  const { error: newsError } = await supabase
    .from('weekly_report_news_items')
    .insert(
      newsItems.map((item) => ({
        report_slug: row.slug,
        rank: item.rank,
        title: item.title,
        source_name: item.sourceName,
        source_url: item.sourceUrl,
        published_at: item.publishedAt,
        summary: item.summary,
        why_it_matters: item.whyItMatters,
        topic: item.topic,
        priority: item.priority,
      }))
    );

  if (newsError) {
    throw newsError;
  }
}

async function main() {
  await loadEnvFile(path.join(ROOT_DIR, '.env.local'));
  await loadEnvFile(path.join(ROOT_DIR, 'python', '.env'));

  const options = parseArgs(process.argv.slice(2));
  const { weekStart, weekEnd } = resolveWeekWindow(options.weekStart);
  const slug = weekStart;
  const supabase = createSupabaseClient();
  const pgPool = new PgPool({
    connectionString: requiredEnv('BITFLOW_PG_DSN'),
    max: 4,
  });

  try {
    const [marketSnapshot, onchainSnapshot, newsCandidates] = await Promise.all([
      fetchMarketSnapshot(supabase, weekStart, weekEnd),
      loadOnchainSnapshot(pgPool, supabase, weekStart, weekEnd),
      fetchNewsCandidates(weekStart, weekEnd),
    ]);

    let report = null;
    const modelName = options.model ?? process.env.BITFLOW_WEEKLY_REPORT_MODEL ?? null;

    if (!options.skipLlm && newsCandidates.length > 0) {
      try {
        const prompt = buildPrompt({
          weekStart,
          weekEnd,
          marketSnapshot,
          onchainSnapshot,
          newsCandidates,
        });
        const assistantText = await callCodex(prompt, modelName);
        const generated = extractJsonObject(assistantText);
        report = finalizeModelReport({
          generated,
          newsCandidates,
          weekStart,
          weekEnd,
          marketSnapshot,
          onchainSnapshot,
          modelName,
        });
      } catch (error) {
        console.error('Weekly report LLM generation failed, falling back to template:', error);
      }
    }

    if (!report) {
      report = buildFallbackReport({
        weekStart,
        weekEnd,
        marketSnapshot,
        onchainSnapshot,
        newsCandidates,
        modelName,
      });
    }

    const storedPayload = {
      slug,
      weekStart,
      weekEnd,
      title: report.title,
      dek: report.dek,
      summary: report.summary,
      marketView: report.marketView,
      onchainView: report.onchainView,
      riskWatch: report.riskWatch,
      watchlist: report.watchlist,
      sections: report.sections,
      marketSnapshot,
      onchainSnapshot: {
        latestDay: onchainSnapshot.latestDay,
        spentBtc7d: onchainSnapshot.spentBtc7d,
        dormantReactivatedBtc7d: onchainSnapshot.dormantReactivatedBtc7d,
        activeSupply30d: onchainSnapshot.activeSupply30d,
        activeSupply90d: onchainSnapshot.activeSupply90d,
        whaleAlertCount7d: onchainSnapshot.whaleAlertCount7d,
        topEntityFlows: onchainSnapshot.topEntityFlows,
      },
      payload: report.payload,
      modelName: report.modelName,
      generatedBy: options.skipLlm ? 'local_template_worker' : 'local_codex_worker',
    };

    if (options.dryRun) {
      console.log(
        JSON.stringify(
          {
            report: storedPayload,
            newsItems: report.newsItems,
            newsCandidateCount: newsCandidates.length,
          },
          null,
          2
        )
      );
      return;
    }

    await storeWeeklyReport(supabase, storedPayload, report.newsItems);

    console.log(
      JSON.stringify(
        {
          ok: true,
          slug,
          weekStart,
          weekEnd,
          newsItems: report.newsItems.length,
          modelName: report.modelName,
        },
        null,
        2
      )
    );
  } finally {
    await pgPool.end();
  }
}

main().catch((error) => {
  console.error('Weekly report generation failed:', error);
  process.exitCode = 1;
});
