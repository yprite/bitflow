#!/usr/bin/env node
/**
 * generate-summary.js - Market status determination + summary text generation
 * Rule-based template composition (no LLM, zero cost).
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Signal scoring functions
function scoreNetflow(netflow) {
  if (netflow < -2000) return 1;
  if (netflow > 2000) return -1;
  return 0;
}

function scoreUtxoAge(weeklyChange) {
  if (weeklyChange > 0.1) return 1;
  if (weeklyChange < -0.1) return -1;
  return 0;
}

function scoreFearGreed(value) {
  if (value < 25) return 1;
  if (value > 75) return -1;
  return 0;
}

function getStatusEmoji(status) {
  switch (status) {
    case 'accumulation': return '🟢';
    case 'caution': return '🔴';
    case 'neutral': return '🟡';
    default: return '⚪';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'accumulation': return '축적 국면';
    case 'caution': return '주의 구간';
    case 'neutral': return '중립';
    default: return '데이터 부족';
  }
}

// Template-based summary generation
function generateSummaryText(metrics) {
  const parts = [];

  if (metrics.netflow !== null) {
    if (metrics.netflow < -2000) {
      parts.push(`거래소에서 BTC 순유출 ${Math.abs(Math.round(metrics.netflow)).toLocaleString()} BTC 발생`);
    } else if (metrics.netflow > 2000) {
      parts.push(`거래소로 BTC 순유입 ${Math.round(metrics.netflow).toLocaleString()} BTC 발생`);
    } else {
      parts.push('거래소 넷플로우 중립 구간');
    }
  }

  if (metrics.fearGreed !== null) {
    const fg = metrics.fearGreed;
    const label = fg < 25 ? '극도의 공포' : fg < 45 ? '공포' : fg < 55 ? '중립' : fg < 75 ? '탐욕' : '극도의 탐욕';
    parts.push(`공포/탐욕 지수 ${fg} (${label})`);
  }

  if (metrics.mempoolFee !== null) {
    parts.push(`멤풀 수수료 ${metrics.mempoolFee} sat/vB`);
  }

  return parts.join('. ') + '.';
}

async function getLatestMetrics() {
  const metrics = {};

  for (const metricName of ['exchange_netflow', 'fear_greed', 'mempool_fees', 'utxo_age_1y', 'btc_price']) {
    const { data } = await supabase
      .from('onchain_metrics')
      .select('value, metadata, collected_at')
      .eq('metric_name', metricName)
      .is('metadata->rejected', null)  // Exclude rejected values
      .order('collected_at', { ascending: false })
      .limit(1)
      .single();

    metrics[metricName] = data;
  }

  return metrics;
}

async function getUtxoWeeklyChange() {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('onchain_metrics')
    .select('collected_at, value, metadata')
    .eq('metric_name', 'utxo_age_1y')
    .eq('resolution', 'daily')
    .gte('collected_at', since)
    .order('collected_at', { ascending: true })
    .limit(20);

  if (error || !data || data.length < 2) return null;

  const clean = data
    .filter((row) => row.metadata?.rejected !== true)
    .map((row) => ({ collectedAt: row.collected_at, value: Number(row.value) }))
    .filter((row) => Number.isFinite(row.value));

  if (clean.length < 2) return null;
  const latest = clean[clean.length - 1];
  const baseline = clean[Math.max(0, clean.length - 8)];
  return latest.value - baseline.value;
}

async function main(options = {}) {
  const latest = await getLatestMetrics();

  const netflowValue = latest.exchange_netflow ? Number(latest.exchange_netflow.value) : null;
  const fearGreedValue = latest.fear_greed ? Number(latest.fear_greed.value) : null;
  const utxoValue = latest.utxo_age_1y ? Number(latest.utxo_age_1y.value) : null;
  const utxoWeeklyChange = await getUtxoWeeklyChange();
  const btcPrice = latest.btc_price ? Number(latest.btc_price.value) : null;
  const mempoolFee = latest.mempool_fees ? Number(latest.mempool_fees.value) : null;

  // Score calculation (3 indicators, mempool excluded from scoring)
  const scores = [
    netflowValue !== null ? scoreNetflow(netflowValue) : null,
    utxoValue !== null && utxoWeeklyChange !== null ? scoreUtxoAge(utxoWeeklyChange) : null,
    fearGreedValue !== null ? scoreFearGreed(fearGreedValue) : null,
  ];

  const validScores = scores.filter((s) => s !== null);
  let status, total;
  if (validScores.length < 2) {
    status = 'insufficient';
    total = 0;
  } else {
    total = validScores.reduce((sum, s) => sum + s, 0);
    if (total >= 2) status = 'accumulation';
    else if (total <= -2) status = 'caution';
    else status = 'neutral';
  }

  const summary = generateSummaryText({
    netflow: netflowValue,
    fearGreed: fearGreedValue,
    mempoolFee: mempoolFee,
  });

  const result = {
    status,
    emoji: getStatusEmoji(status),
    label: getStatusLabel(status),
    total,
    summary,
    btcPrice,
    fearGreed: fearGreedValue,
    mempoolFee,
    netflow: netflowValue,
    utxoWeeklyChange,
    updatedAt: new Date().toISOString(),
  };

  if (!options.silent) {
    // Output as JSON for post-tweet.js to consume
    console.log(JSON.stringify(result, null, 2));
  }
  return result;
}

module.exports = { main, generateSummaryText };

if (require.main === module) {
  main().catch((err) => {
    console.error('[summary] Fatal:', err);
    process.exit(1);
  });
}
