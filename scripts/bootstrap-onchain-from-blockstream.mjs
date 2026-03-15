import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const API_BASES = [
  'https://mempool.space/api',
  'https://blockstream.info/api',
];
const SATS_PER_BTC = 100_000_000;
const DORMANT_DAYS = 180;
const REQUEST_DELAY_MS = 120;
const MAX_RETRIES = 6;
const AGE_BANDS = [
  { key: 'lt_1d', lowerSeconds: 0, upperSeconds: 86400 },
  { key: '1d_1w', lowerSeconds: 86400, upperSeconds: 604800 },
  { key: '1w_1m', lowerSeconds: 604800, upperSeconds: 2592000 },
  { key: '1m_3m', lowerSeconds: 2592000, upperSeconds: 7776000 },
  { key: '3m_6m', lowerSeconds: 7776000, upperSeconds: 15552000 },
  { key: '6m_1y', lowerSeconds: 15552000, upperSeconds: 31536000 },
  { key: '1y_plus', lowerSeconds: 31536000, upperSeconds: Number.POSITIVE_INFINITY },
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx);
    const value = trimmed.slice(idx + 1);
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const args = {
    startHeight: 0,
    endHeight: 1000,
    batchSize: 200,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--start-height') args.startHeight = Number(argv[++i]);
    if (arg === '--end-height') args.endHeight = Number(argv[++i]);
    if (arg === '--batch-size') args.batchSize = Number(argv[++i]);
  }

  if (!Number.isInteger(args.startHeight) || args.startHeight < 0) {
    throw new Error('Invalid --start-height');
  }

  if (!Number.isInteger(args.endHeight) || args.endHeight < args.startHeight) {
    throw new Error('Invalid --end-height');
  }

  if (!Number.isInteger(args.batchSize) || args.batchSize <= 0) {
    throw new Error('Invalid --batch-size');
  }

  return args;
}

async function fetchJson(url) {
  return fetchWithRetry(url, 'json');
}

async function fetchText(url) {
  return fetchWithRetry(url, 'text');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, mode) {
  const directMatch = API_BASES.find((base) => url.startsWith(base));
  const candidates = directMatch
    ? [directMatch, ...API_BASES.filter((base) => base !== directMatch)]
    : API_BASES;
  let lastError = null;

  for (const base of candidates) {
    const candidateUrl = directMatch ? url.replace(directMatch, base) : `${base}${url}`;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      if (REQUEST_DELAY_MS > 0) {
        await sleep(REQUEST_DELAY_MS);
      }

      const response = await fetch(candidateUrl, {
        headers: { 'User-Agent': 'bitflow/1.0' },
      });

      if (response.ok) {
        return mode === 'json' ? response.json() : response.text();
      }

      if (response.status !== 429 && response.status < 500) {
        throw new Error(`HTTP ${response.status} for ${candidateUrl}`);
      }

      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
      const backoffMs = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1000
        : 1000 * 2 ** attempt;

      lastError = new Error(`HTTP ${response.status} for ${candidateUrl}`);
      console.warn(`Retrying ${candidateUrl} in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(backoffMs);
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

async function fetchBlockByHeight(height) {
  const hash = (await fetchText(`${API_BASES[0]}/block-height/${height}`)).trim();
  const block = await fetchJson(`${API_BASES[0]}/block/${hash}`);
  const txs = [];

  for (let startIndex = 0; startIndex < block.tx_count; startIndex += 25) {
    const page = await fetchJson(`${API_BASES[0]}/block/${hash}/txs/${startIndex}`);
    txs.push(...page);
    if (page.length < 25) break;
  }

  return { hash, block, txs };
}

function isoFromUnix(seconds) {
  return new Date(seconds * 1000).toISOString();
}

function dayKeyFromUnix(seconds) {
  return isoFromUnix(seconds).slice(0, 10);
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function createDayStats() {
  return {
    createdUtxoCount: 0,
    spentUtxoCount: 0,
    spentSats: 0,
    dormantSats: 0,
    spentByBand: Object.fromEntries(AGE_BANDS.map((band) => [band.key, 0])),
    issuedSats: 0,
  };
}

function getDayStats(map, dayKey) {
  if (!map.has(dayKey)) {
    map.set(dayKey, createDayStats());
  }

  return map.get(dayKey);
}

function bandKeyForAge(ageSeconds) {
  for (const band of AGE_BANDS) {
    if (ageSeconds >= band.lowerSeconds && ageSeconds < band.upperSeconds) {
      return band.key;
    }
  }

  return '1y_plus';
}

async function upsertInChunks(supabase, table, rows, onConflict, batchSize) {
  if (rows.length === 0) return;

  for (const batch of chunk(rows, batchSize)) {
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict, ignoreDuplicates: false });

    if (error) {
      throw new Error(`${table} upsert failed: ${error.message}`);
    }
  }
}

function buildMetricRows(dayStatsMap) {
  const days = Array.from(dayStatsMap.keys()).sort();
  const metricRows = [];
  let cumulativeIssuedSats = 0;

  for (let index = 0; index < days.length; index += 1) {
    const day = days[index];
    const stats = dayStatsMap.get(day);
    cumulativeIssuedSats += stats.issuedSats;

    const lookbackSpent = (windowSize) => {
      let total = 0;
      for (let offset = Math.max(0, index - windowSize + 1); offset <= index; offset += 1) {
        total += dayStatsMap.get(days[offset]).spentSats;
      }
      return total;
    };

    metricRows.push({
      day,
      metric_name: 'created_utxo_count',
      metric_value: stats.createdUtxoCount,
      unit: 'count',
      dimension_key: 'all',
      dimensions: {},
    });
    metricRows.push({
      day,
      metric_name: 'spent_utxo_count',
      metric_value: stats.spentUtxoCount,
      unit: 'count',
      dimension_key: 'all',
      dimensions: {},
    });
    metricRows.push({
      day,
      metric_name: 'spent_btc',
      metric_value: stats.spentSats / SATS_PER_BTC,
      unit: 'btc',
      dimension_key: 'all',
      dimensions: {},
    });
    metricRows.push({
      day,
      metric_name: 'dormant_reactivated_btc',
      metric_value: stats.dormantSats / SATS_PER_BTC,
      unit: 'btc',
      dimension_key: 'all',
      dimensions: { minimum_days: DORMANT_DAYS },
    });

    for (const window of [
      { key: '30d', size: 30 },
      { key: '90d', size: 90 },
    ]) {
      const spentSats = lookbackSpent(window.size);
      const metricValue =
        cumulativeIssuedSats === 0
          ? 0
          : Number(((spentSats / cumulativeIssuedSats) * 100).toFixed(6));

      metricRows.push({
        day,
        metric_name: 'active_supply_ratio',
        metric_value: metricValue,
        unit: 'percent',
        dimension_key: window.key,
        dimensions: { window: window.key },
      });
    }

    for (const band of AGE_BANDS) {
      metricRows.push({
        day,
        metric_name: 'spent_btc_age_band',
        metric_value: stats.spentByBand[band.key] / SATS_PER_BTC,
        unit: 'btc',
        dimension_key: band.key,
        dimensions: { band: band.key },
      });
    }
  }

  return metricRows;
}

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function main() {
  loadEnvFile(path.join(process.cwd(), '.env.local'));
  const { startHeight, endHeight, batchSize } = parseArgs(process.argv.slice(2));
  const supabase = createSupabaseClient();

  const blocks = [];
  const txs = [];
  const outputs = [];
  const inputs = [];
  const spentEdges = [];
  const outputIndex = new Map();
  const dayStatsMap = new Map();

  console.log(`Fetching blocks ${startHeight}..${endHeight} from Blockstream API`);

  for (let height = startHeight; height <= endHeight; height += 1) {
    const { hash, block, txs: blockTxs } = await fetchBlockByHeight(height);
    const blockTimeIso = isoFromUnix(block.timestamp);
    const dayKey = dayKeyFromUnix(block.timestamp);
    const dayStats = getDayStats(dayStatsMap, dayKey);

    blocks.push({
      height: block.height,
      block_hash: hash,
      prev_block_hash: block.previousblockhash ?? null,
      block_time: blockTimeIso,
      median_time: isoFromUnix(block.mediantime),
      size_bytes: block.size,
      weight: block.weight,
      tx_count: block.tx_count,
    });

    blockTxs.forEach((tx, txIndex) => {
      const isCoinbase = tx.vin.some((vin) => vin.is_coinbase);
      const totalInputSats = isCoinbase
        ? null
        : tx.vin.reduce((sum, vin) => sum + (vin.prevout?.value ?? 0), 0);
      const totalOutputSats = tx.vout.reduce((sum, vout) => sum + vout.value, 0);

      txs.push({
        txid: tx.txid,
        block_height: block.height,
        block_hash: hash,
        tx_index: txIndex,
        version: tx.version,
        lock_time: tx.locktime,
        size_bytes: tx.size,
        vsize: Math.ceil(tx.weight / 4),
        weight: tx.weight,
        is_coinbase: isCoinbase,
        fee_sats: tx.fee ?? null,
        total_input_sats: totalInputSats,
        total_output_sats: totalOutputSats,
      });

      tx.vout.forEach((vout, voutN) => {
        const outputRow = {
          txid: tx.txid,
          vout_n: voutN,
          block_height: block.height,
          value_sats: vout.value,
          script_pubkey: vout.scriptpubkey,
          script_type: vout.scriptpubkey_type ?? null,
          address: vout.scriptpubkey_address ?? null,
          descriptor: null,
          is_op_return: vout.scriptpubkey_type === 'op_return',
        };

        outputs.push(outputRow);
        outputIndex.set(`${tx.txid}:${voutN}`, {
          blockHeight: block.height,
          blockTimeIso,
          valueSats: vout.value,
          scriptPubkey: vout.scriptpubkey,
          scriptType: vout.scriptpubkey_type ?? null,
          address: vout.scriptpubkey_address ?? null,
        });
      });

      tx.vin.forEach((vin, vinN) => {
        const prevOutput = vin.txid ? outputIndex.get(`${vin.txid}:${vin.vout}`) : null;
        const prevValueSats = vin.prevout?.value ?? prevOutput?.valueSats ?? null;
        const prevScriptPubkey = vin.prevout?.scriptpubkey ?? prevOutput?.scriptPubkey ?? null;

        inputs.push({
          spending_txid: tx.txid,
          vin_n: vinN,
          block_height: block.height,
          prev_txid: vin.is_coinbase ? null : vin.txid,
          prev_vout_n: vin.is_coinbase ? null : vin.vout,
          sequence: vin.sequence,
          coinbase_data: vin.is_coinbase ? vin.scriptsig ?? null : null,
          prev_value_sats: prevValueSats,
          prev_script_pubkey: prevScriptPubkey,
        });

        if (!vin.is_coinbase && vin.txid !== undefined && vin.vout !== undefined && prevOutput) {
          const createdAtMs = Date.parse(prevOutput.blockTimeIso);
          const spentAtMs = Date.parse(blockTimeIso);
          const ageSeconds = Math.max(0, Math.floor((spentAtMs - createdAtMs) / 1000));

          spentEdges.push({
            spending_txid: tx.txid,
            vin_n: vinN,
            prev_txid: vin.txid,
            prev_vout_n: vin.vout,
            spending_block_height: block.height,
            spending_time: blockTimeIso,
            created_block_height: prevOutput.blockHeight,
            created_time: prevOutput.blockTimeIso,
            value_sats: prevOutput.valueSats,
            age_seconds: ageSeconds,
          });

          dayStats.spentUtxoCount += 1;
          dayStats.spentSats += prevOutput.valueSats;
          dayStats.spentByBand[bandKeyForAge(ageSeconds)] += prevOutput.valueSats;
          if (ageSeconds >= DORMANT_DAYS * 86400) {
            dayStats.dormantSats += prevOutput.valueSats;
          }
        }
      });

      dayStats.createdUtxoCount += tx.vout.length;
      if (isCoinbase) {
        dayStats.issuedSats += totalOutputSats;
      }
    });

    if (height === startHeight || height === endHeight || height % 100 === 0) {
      console.log(`Processed block ${height} (${block.tx_count} tx)`);
    }
  }

  const metricRows = buildMetricRows(dayStatsMap);
  const syncStateRows = [
    {
      pipeline_name: 'public_bootstrap_blockstream',
      last_height: endHeight,
      last_block_hash: blocks.at(-1)?.block_hash ?? '',
      cursor: {
        source: 'blockstream.info',
        start_height: startHeight,
        end_height: endHeight,
        imported_at: new Date().toISOString(),
      },
    },
  ];

  console.log('Writing normalized tables to Supabase');
  await upsertInChunks(supabase, 'btc_blocks', blocks, 'height', batchSize);
  await upsertInChunks(supabase, 'btc_txs', txs, 'txid', batchSize);
  await upsertInChunks(supabase, 'btc_outputs', outputs, 'txid,vout_n', batchSize);
  await upsertInChunks(supabase, 'btc_inputs', inputs, 'spending_txid,vin_n', batchSize);
  await upsertInChunks(supabase, 'btc_spent_edges', spentEdges, 'spending_txid,vin_n', batchSize);
  await upsertInChunks(supabase, 'btc_daily_metrics', metricRows, 'day,metric_name,dimension_key', batchSize);
  await upsertInChunks(supabase, 'btc_sync_state', syncStateRows, 'pipeline_name', batchSize);

  console.log(
    `Done. blocks=${blocks.length} txs=${txs.length} outputs=${outputs.length} inputs=${inputs.length} spent_edges=${spentEdges.length} metric_rows=${metricRows.length}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
