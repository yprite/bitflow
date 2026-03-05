#!/usr/bin/env node
/**
 * weekly-report.js - Generate and post weekly on-chain summary
 * Runs every Sunday 10:00 KST via launchd.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { notify } = require('./notify');
const { main: generateSummary } = require('./generate-summary');
const { buildTweetText } = require('./lib/post-utils');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getWeeklyStats() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get price range for the week
  const { data: priceData } = await supabase
    .from('onchain_metrics')
    .select('value, collected_at')
    .eq('metric_name', 'btc_price')
    .gte('collected_at', since)
    .order('collected_at', { ascending: true });

  let priceHigh = null, priceLow = null, priceStart = null, priceEnd = null;
  if (priceData && priceData.length > 0) {
    const values = priceData.map((d) => Number(d.value));
    priceHigh = Math.max(...values);
    priceLow = Math.min(...values);
    priceStart = values[0];
    priceEnd = values[values.length - 1];
  }

  // Whale transaction count
  const { count: whaleCount } = await supabase
    .from('whale_transactions')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', since);

  // Tweet count
  const { count: tweetCount } = await supabase
    .from('tweet_log')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'success')
    .gte('tweeted_at', since);

  return {
    priceHigh,
    priceLow,
    priceStart,
    priceEnd,
    priceChange: priceStart && priceEnd ? ((priceEnd - priceStart) / priceStart * 100).toFixed(1) : null,
    whaleCount: whaleCount || 0,
    tweetCount: tweetCount || 0,
  };
}

function buildWeeklyText(summary, stats) {
  const lines = [];
  lines.push(`📊 주간 온체인 리포트`);
  lines.push('');

  if (stats.priceStart && stats.priceEnd) {
    const sign = stats.priceChange > 0 ? '+' : '';
    lines.push(`BTC: $${Math.round(stats.priceEnd).toLocaleString()} (${sign}${stats.priceChange}%)`);
    lines.push(`주간 범위: $${Math.round(stats.priceLow).toLocaleString()} ~ $${Math.round(stats.priceHigh).toLocaleString()}`);
  }

  lines.push('');
  lines.push(`${summary.emoji} 현재 상태: ${summary.label}`);

  if (summary.fearGreed !== null) {
    lines.push(`공포/탐욕: ${Math.round(summary.fearGreed)}`);
  }

  if (stats.whaleCount > 0) {
    lines.push(`고래 트랜잭션: ${stats.whaleCount}건`);
  }

  lines.push('');
  lines.push('#Bitcoin #주간리포트 #온체인데이터');

  const text = lines.join('\n');
  return text.length > 280 ? text.slice(0, 279) + '…' : text;
}

async function main() {
  console.log(`[weekly] Starting at ${new Date().toISOString()}`);

  try {
    const [summary, stats] = await Promise.all([
      generateSummary({ silent: true }),
      getWeeklyStats(),
    ]);

    const tweetText = buildWeeklyText(summary, stats);

    // Log the weekly report
    await supabase.from('tweet_log').insert({
      tweet_type: 'weekly_report',
      status: 'generated_only',
      content: tweetText,
    });

    console.log(tweetText);
    console.log('\n[weekly] Report generated. Use post-tweet.js --type weekly to post.');
  } catch (err) {
    console.error('[weekly] Failed:', err.message);
    await notify('주간 리포트 실패', err.message);
    process.exit(1);
  }
}

main();
