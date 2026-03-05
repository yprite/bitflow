#!/usr/bin/env node
/**
 * collect-data.js - Collect on-chain metrics from various APIs
 *
 * Runs hourly via launchd. Fetches:
 * - BTC price/market cap (CoinGecko)
 * - Exchange netflow (Blockchain.com)
 * - Mempool fees (Mempool.space)
 * - Fear & Greed index (Alternative.me) - daily
 * - UTXO age distribution (Blockchain.com) - daily
 *
 * All timestamps stored in UTC. Daily metrics use KST day boundary.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Metric configuration
const METRIC_CONFIG = {
  btc_price: { resolution: 'hourly', truncate: 'hour' },
  btc_market_cap: { resolution: 'hourly', truncate: 'hour' },
  exchange_netflow: { resolution: 'hourly', truncate: 'hour' },
  mempool_fees: { resolution: 'hourly', truncate: 'hour' },
  fear_greed: { resolution: 'daily', truncate: 'day_kst' },
  utxo_age_1y: { resolution: 'daily', truncate: 'day_kst' },
};

// Range limits for outlier detection
const RANGE_LIMITS = {
  exchange_netflow: { min: -100000, max: 100000 },
  fear_greed: { min: 0, max: 100 },
  utxo_age_1y: { min: 0, max: 100 },
  btc_price: { min: 0, max: 10000000 },
  btc_market_cap: { min: 0, max: 100000000000000 },
  mempool_fees: { min: 0, max: 10000 },
};

function getCollectedAt(truncate) {
  const now = new Date();
  if (truncate === 'hour') {
    now.setMinutes(0, 0, 0);
    return now.toISOString();
  }
  // day_kst: KST day boundary (00:00 KST)
  const kstMs = now.getTime() + 9 * 3600 * 1000;
  const kst = new Date(kstMs);
  kst.setHours(0, 0, 0, 0);
  return new Date(kst.getTime() - 9 * 3600 * 1000).toISOString();
}

function validateRange(metricName, value) {
  const limits = RANGE_LIMITS[metricName];
  if (!limits) return { valid: true };
  if (value < limits.min || value > limits.max) {
    return { valid: false, reason: `out_of_range: ${value} not in [${limits.min}, ${limits.max}]` };
  }
  return { valid: true };
}

async function detectSpike(metricName, newValue) {
  if (metricName !== 'exchange_netflow') return false;

  const { data } = await supabase
    .from('onchain_metrics')
    .select('value')
    .eq('metric_name', metricName)
    .order('collected_at', { ascending: false })
    .limit(3);

  if (!data || data.length < 3) return false;

  const values = data.map((d) => Number(d.value));
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const threshold = Math.max(Math.abs(median) * 10, 500);

  return Math.abs(newValue - median) > threshold;
}

async function upsertMetric(metricName, value, metadata = {}) {
  const config = METRIC_CONFIG[metricName];
  if (!config) {
    console.error(`[collect] Unknown metric: ${metricName}`);
    return;
  }

  // Range validation
  const rangeCheck = validateRange(metricName, value);
  if (!rangeCheck.valid) {
    console.warn(`[collect] ${metricName} rejected: ${rangeCheck.reason}`);
    metadata = { ...metadata, rejected: true, reason: rangeCheck.reason };
  }

  // Spike detection
  if (rangeCheck.valid) {
    const isSpike = await detectSpike(metricName, value);
    if (isSpike) {
      console.warn(`[collect] ${metricName} spike detected: ${value}`);
      metadata = { ...metadata, rejected: true, reason: 'spike_detected' };
    }
  }

  const collectedAt = getCollectedAt(config.truncate);

  const { error } = await supabase.rpc('upsert_metric', {
    p_collected_at: collectedAt,
    p_metric_name: metricName,
    p_value: value,
    p_resolution: config.resolution,
    p_metadata: Object.keys(metadata).length > 0 ? metadata : null,
  });

  // Fallback to direct upsert if RPC doesn't exist yet
  if (error && error.message?.includes('function')) {
    const { error: upsertError } = await supabase
      .from('onchain_metrics')
      .upsert(
        {
          collected_at: collectedAt,
          metric_name: metricName,
          value,
          resolution: config.resolution,
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
        },
        { onConflict: 'metric_name,collected_at' }
      );
    if (upsertError) {
      console.error(`[collect] upsert failed for ${metricName}:`, upsertError.message);
      return;
    }
  } else if (error) {
    console.error(`[collect] RPC failed for ${metricName}:`, error.message);
    return;
  }

  console.log(`[collect] ${metricName} = ${value} @ ${collectedAt}`);
}

// --- Data fetchers ---

async function fetchBtcPrice() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=true',
      {
        headers: process.env.COINGECKO_API_KEY
          ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
          : {},
      }
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    const btc = data.bitcoin;

    await upsertMetric('btc_price', btc.usd, {
      source: 'coingecko',
      source_timestamp: Math.floor(Date.now() / 1000),
    });
    await upsertMetric('btc_market_cap', btc.usd_market_cap, {
      source: 'coingecko',
      source_timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (err) {
    console.error('[collect] BTC price failed:', err.message);
  }
}

async function fetchFearGreed() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1');
    if (!res.ok) throw new Error(`Alternative.me ${res.status}`);
    const data = await res.json();
    const fng = data.data[0];

    await upsertMetric('fear_greed', Number(fng.value), {
      source: 'alternative.me',
      source_timestamp: Number(fng.timestamp),
      source_date: new Date(Number(fng.timestamp) * 1000).toISOString().slice(0, 10),
      value_classification: fng.value_classification,
    });
  } catch (err) {
    console.error('[collect] Fear & Greed failed:', err.message);
  }
}

async function fetchMempoolFees() {
  try {
    const res = await fetch('https://mempool.space/api/v1/fees/recommended');
    if (!res.ok) throw new Error(`Mempool.space ${res.status}`);
    const data = await res.json();

    // Use halfHourFee as representative metric (middle priority)
    await upsertMetric('mempool_fees', data.halfHourFee, {
      source: 'mempool.space',
      source_timestamp: Math.floor(Date.now() / 1000),
      fastest_fee: data.fastestFee,
      half_hour_fee: data.halfHourFee,
      hour_fee: data.hourFee,
      economy_fee: data.economyFee,
      minimum_fee: data.minimumFee,
    });
  } catch (err) {
    console.error('[collect] Mempool fees failed:', err.message);
  }
}

async function fetchExchangeNetflow() {
  try {
    // BGeometrics / bitcoin-data.com - real exchange netflow in BTC
    const res = await fetch('https://bitcoin-data.com/v1/exchange-netflow-btc/1');
    if (!res.ok) throw new Error(`bitcoin-data.com netflow ${res.status}`);
    const data = await res.json();

    // Response: {"d":"2026-03-04","unixTs":1772582400,"exchangeNetflowBtc":-20461.08}
    const entry = Array.isArray(data) ? data[0] : data;
    await upsertMetric('exchange_netflow', entry.exchangeNetflowBtc, {
      source: 'bitcoin-data.com',
      source_timestamp: Number(entry.unixTs),
      source_date: entry.d,
    });
  } catch (err) {
    console.error('[collect] Exchange netflow failed:', err.message);
  }
}

async function fetchUtxoAge() {
  try {
    // BGeometrics / bitcoin-data.com - HODL waves (UTXO age bands in BTC)
    const res = await fetch('https://bitcoin-data.com/v1/hodl-waves-supply/1');
    if (!res.ok) throw new Error(`bitcoin-data.com hodl ${res.status}`);
    const data = await res.json();

    const entry = Array.isArray(data) ? data[0] : data;
    // Sum BTC supply that hasn't moved in 1+ year
    const oneyearPlus =
      Number(entry.age_1y_2y) +
      Number(entry.age_2y_3y) +
      Number(entry.age_3y_4y) +
      Number(entry.age_4y_5y) +
      Number(entry.age_5y_7y) +
      Number(entry.age_7y_10y) +
      Number(entry.age_10y);
    const totalSupply =
      Number(entry.age_0d_1d) +
      Number(entry.age_1d_1w) +
      Number(entry.age_1w_1m) +
      Number(entry.age_1m_3m) +
      Number(entry.age_3m_6m) +
      Number(entry.age_6m_1y) +
      oneyearPlus;
    const pct = (oneyearPlus / totalSupply) * 100;

    await upsertMetric('utxo_age_1y', parseFloat(pct.toFixed(2)), {
      source: 'bitcoin-data.com',
      source_timestamp: Number(entry.unixTs),
      source_date: entry.d,
      supply_1y_plus_btc: parseFloat(oneyearPlus.toFixed(2)),
      total_supply_btc: parseFloat(totalSupply.toFixed(2)),
    });
  } catch (err) {
    console.error('[collect] UTXO age failed:', err.message);
  }
}

// --- Main ---

async function main() {
  console.log(`[collect] Starting data collection at ${new Date().toISOString()}`);

  const results = await Promise.allSettled([
    fetchBtcPrice(),
    fetchFearGreed(),
    fetchMempoolFees(),
    fetchExchangeNetflow(),
    fetchUtxoAge(),
  ]);

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.error(`[collect] ${failed.length} fetchers failed`);
  }

  console.log(`[collect] Done at ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error('[collect] Fatal error:', err);
  process.exit(1);
});
