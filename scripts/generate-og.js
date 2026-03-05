#!/usr/bin/env node
/**
 * generate-og.js - Generate tweet card image using /api/og route.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { main: generateSummary } = require('./generate-summary');

const BITFLOW_HOME = process.env.BITFLOW_HOME || path.resolve(__dirname, '..');
const DEFAULT_ENDPOINT = process.env.BITFLOW_OG_ENDPOINT || 'http://127.0.0.1:3000/api/og';

function formatKst(dateLike) {
  const date = new Date(dateLike);
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

async function fetchUtxoWeeklyChange(supabase) {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('onchain_metrics')
    .select('collected_at, value, metadata')
    .eq('metric_name', 'utxo_age_1y')
    .eq('resolution', 'daily')
    .gte('collected_at', since)
    .order('collected_at', { ascending: true })
    .limit(20);

  if (error || !data || data.length < 2) {
    return 'N/A';
  }

  const clean = data
    .filter((row) => row.metadata?.rejected !== true)
    .map((row) => ({ at: row.collected_at, value: Number(row.value) }))
    .filter((row) => Number.isFinite(row.value));

  if (clean.length < 2) return 'N/A';

  const latest = clean[clean.length - 1];
  const baselineIndex = Math.max(0, clean.length - 8);
  const baseline = clean[baselineIndex];
  const diff = latest.value - baseline.value;
  const prefix = diff > 0 ? '+' : '';
  return `${prefix}${diff.toFixed(2)}%p`;
}

async function generateOgImage(options = {}) {
  const summary = options.summary || (await generateSummary({ silent: true }));
  const outputPath =
    options.outputPath ||
    path.join(BITFLOW_HOME, 'logs', `tweet-card-${new Date().toISOString().replace(/[:.]/g, '-')}.png`);

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const utxo = options.utxo || (await fetchUtxoWeeklyChange(supabase));
  const endpoint = options.endpoint || DEFAULT_ENDPOINT;

  const url = new URL(endpoint);
  url.searchParams.set('status', String(summary.status || 'neutral'));
  if (summary.netflow !== null && summary.netflow !== undefined) {
    const netflow = Number(summary.netflow);
    const sign = netflow > 0 ? '+' : '';
    url.searchParams.set('netflow', `${sign}${Math.round(netflow).toLocaleString()} BTC`);
  } else {
    url.searchParams.set('netflow', 'N/A');
  }
  url.searchParams.set('utxo', utxo);
  if (summary.mempoolFee !== null && summary.mempoolFee !== undefined) {
    url.searchParams.set('mempool', `${Math.round(Number(summary.mempoolFee)).toLocaleString()} sat/vB`);
  } else {
    url.searchParams.set('mempool', 'N/A');
  }
  if (summary.fearGreed !== null && summary.fearGreed !== undefined) {
    url.searchParams.set('fearGreed', String(Math.round(Number(summary.fearGreed))));
  } else {
    url.searchParams.set('fearGreed', 'N/A');
  }
  url.searchParams.set('updatedAt', formatKst(summary.updatedAt || Date.now()));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`/api/og failed: ${response.status} ${await response.text()}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));

  return {
    outputPath,
    endpoint: url.toString(),
    summary,
    utxo,
  };
}

async function main() {
  try {
    const result = await generateOgImage();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('[generate-og] failed:', error.message);
    process.exit(1);
  }
}

module.exports = { generateOgImage };

if (require.main === module) {
  main();
}
