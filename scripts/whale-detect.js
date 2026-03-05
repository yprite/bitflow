#!/usr/bin/env node
/**
 * whale-detect.js - Detect large BTC transfers via Whale Alert API
 *
 * Runs 3x/day (08:00, 14:00, 20:00 KST) via launchd.
 * Uses shlock (macOS built-in) for single-instance enforcement.
 * Tracks monthly API usage in DB (limit: 90/month, hard cap 100).
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { notify } = require('./notify');

const BITFLOW_HOME = process.env.BITFLOW_HOME || path.resolve(__dirname, '..');
const LOCK_FILE = path.join(BITFLOW_HOME, '.whale-detect.lock');
const MONTHLY_LIMIT = 90;
const MONTHLY_WARN = 81; // 90% of 100

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Single-instance lock using shlock (macOS built-in)
function acquireLock() {
  try {
    const pid = process.pid;
    const result = execSync(`/usr/bin/shlock -f "${LOCK_FILE}" -p ${pid}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return true;
  } catch {
    // shlock exits non-zero if lock already held
    return false;
  }
}

function releaseLock() {
  try {
    fs.unlinkSync(LOCK_FILE);
  } catch {
    // Ignore if already removed
  }
}

function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function checkMonthlyUsage() {
  const monthKey = getMonthKey();
  const { count, error } = await supabase
    .from('api_usage')
    .select('*', { count: 'exact', head: true })
    .eq('api_name', 'whale_alert')
    .eq('month_key', monthKey);

  if (error) {
    console.error('[whale] Usage check failed:', error.message);
    return { count: Infinity, monthKey }; // Fail-safe: block on error
  }

  return { count: count || 0, monthKey };
}

async function recordUsage(monthKey) {
  const { data, error } = await supabase
    .from('api_usage')
    .insert({ api_name: 'whale_alert', month_key: monthKey })
    .select('id')
    .single();

  if (error) {
    console.error('[whale] Usage record failed:', error.message);
    return null;
  }
  return data.id;
}

async function removeUsage(id) {
  await supabase.from('api_usage').delete().eq('id', id);
}

async function fetchWhaleTransactions() {
  const apiKey = process.env.WHALE_ALERT_API_KEY;
  if (!apiKey) {
    throw new Error('WHALE_ALERT_API_KEY not configured');
  }

  // Fetch transactions from the last 8 hours
  const since = Math.floor(Date.now() / 1000) - 8 * 3600;

  const res = await fetch(
    `https://api.whale-alert.io/v1/transactions?api_key=${apiKey}&min_value=1000000&start=${since}&currency=btc`
  );

  if (!res.ok) {
    throw new Error(`Whale Alert API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.transactions || [];
}

async function saveTransactions(transactions) {
  let saved = 0;
  for (const tx of transactions) {
    const { error } = await supabase.from('whale_transactions').upsert(
      {
        tx_hash: tx.hash,
        timestamp: new Date(tx.timestamp * 1000).toISOString(),
        amount_btc: tx.amount,
        from_type: tx.from?.owner_type || null,
        from_name: tx.from?.owner || null,
        to_type: tx.to?.owner_type || null,
        to_name: tx.to?.owner || null,
      },
      { onConflict: 'tx_hash' }
    );
    if (!error) saved++;
  }
  return saved;
}

async function main() {
  console.log(`[whale] Starting at ${new Date().toISOString()}`);

  // 1. Acquire lock
  if (!acquireLock()) {
    console.log('[whale] Another instance running, exiting');
    return;
  }

  try {
    // 2. Check monthly usage
    const { count, monthKey } = await checkMonthlyUsage();
    console.log(`[whale] Monthly usage: ${count}/${MONTHLY_LIMIT} (${monthKey})`);

    if (count >= MONTHLY_LIMIT) {
      console.log('[whale] Monthly limit reached, skipping');
      return;
    }

    if (count >= MONTHLY_WARN) {
      await notify('Whale Alert', `API 한도 경고: ${count}/100 (${monthKey})`);
    }

    // 3. Record usage (pre-increment)
    const usageId = await recordUsage(monthKey);
    if (!usageId) return;

    try {
      // 4. Fetch transactions
      const transactions = await fetchWhaleTransactions();
      console.log(`[whale] Found ${transactions.length} transactions`);

      // 5. Save to DB
      const saved = await saveTransactions(transactions);
      console.log(`[whale] Saved ${saved} new transactions`);
    } catch (err) {
      // API call failed - remove usage record (doesn't count)
      console.error('[whale] API call failed:', err.message);
      if (usageId) await removeUsage(usageId);
      await notify('Whale Alert 실패', err.message);
    }
  } finally {
    releaseLock();
  }

  console.log(`[whale] Done at ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error('[whale] Fatal:', err);
  releaseLock();
  process.exit(1);
});
