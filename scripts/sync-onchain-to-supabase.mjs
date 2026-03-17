#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

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

function toIsoTimestamp(dayValue) {
  if (dayValue instanceof Date) {
    return `${dayValue.toISOString().slice(0, 10)}T00:00:00Z`;
  }

  return `${String(dayValue).slice(0, 10)}T00:00:00Z`;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function inferAlertAmountBtc(alert) {
  const context = alert.context && typeof alert.context === 'object' ? alert.context : {};
  if (typeof context.total_output_sats === 'number') {
    return context.total_output_sats / 100_000_000;
  }
  if (typeof context.value_sats === 'number') {
    return context.value_sats / 100_000_000;
  }
  return 0;
}

function createSupabaseHeaders() {
  const serviceKey = requiredEnv('SUPABASE_SERVICE_KEY');
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };
}

async function supabaseDelete(relativePath) {
  const url = `${requiredEnv('SUPABASE_URL')}${relativePath}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...createSupabaseHeaders(),
      Prefer: 'return=minimal',
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase DELETE failed (${response.status}): ${await response.text()}`);
  }
}

async function supabaseInsert(relativePath, rows) {
  if (rows.length === 0) return;

  const url = `${requiredEnv('SUPABASE_URL')}${relativePath}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...createSupabaseHeaders(),
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    throw new Error(`Supabase POST failed (${response.status}): ${await response.text()}`);
  }
}

async function insertInBatches(relativePath, rows, batchSize = 500) {
  for (let index = 0; index < rows.length; index += batchSize) {
    await supabaseInsert(relativePath, rows.slice(index, index + batchSize));
  }
}

function toIsoDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function latestPublishedDay(metricRows, alertRows) {
  const values = [];

  for (const row of metricRows) {
    values.push(toIsoDate(row.collected_at));
  }

  for (const row of alertRows) {
    values.push(toIsoDate(row.timestamp));
  }

  const filtered = values.filter(Boolean).sort();
  return filtered.at(-1) ?? null;
}

async function readNodeStatus() {
  try {
    const { stdout } = await execFileAsync('bitcoin-cli', ['getblockchaininfo']);
    const payload = JSON.parse(stdout);
    return {
      state: 'ok',
      nodeTipHeight: typeof payload.blocks === 'number' ? payload.blocks : null,
      headerHeight: typeof payload.headers === 'number' ? payload.headers : null,
      initialBlockDownload:
        typeof payload.initialblockdownload === 'boolean'
          ? payload.initialblockdownload
          : null,
      pruned: typeof payload.pruned === 'boolean' ? payload.pruned : null,
      pruneHeight: typeof payload.pruneheight === 'number' ? payload.pruneheight : null,
    };
  } catch {
    return {
      state: 'rpc_error',
      nodeTipHeight: null,
      headerHeight: null,
      initialBlockDownload: null,
      pruned: null,
      pruneHeight: null,
    };
  }
}

async function readIndexedStatus(client) {
  try {
    const result = await client.query(`
      SELECT
        MAX(height) AS indexed_height,
        MAX(block_time::date)::text AS latest_indexed_day
      FROM btc_blocks
    `);
    const indexedHeight =
      result.rows[0]?.indexed_height === null || result.rows[0]?.indexed_height === undefined
        ? null
        : Number(result.rows[0].indexed_height);

    return {
      state: indexedHeight === null ? 'empty' : 'ok',
      indexedHeight,
      latestIndexedDay: result.rows[0]?.latest_indexed_day ?? null,
    };
  } catch {
    return {
      state: 'query_error',
      indexedHeight: null,
      latestIndexedDay: null,
    };
  }
}

const METRIC_NAME_MAP = new Map([
  ['created_utxo_count:all', 'created_utxo_count'],
  ['spent_utxo_count:all', 'spent_utxo_count'],
  ['spent_btc:all', 'spent_btc'],
  ['dormant_reactivated_btc:all', 'dormant_reactivated_btc'],
  ['active_supply_ratio:30d', 'active_supply_ratio_30d'],
  ['active_supply_ratio:90d', 'active_supply_ratio_90d'],
]);

async function main() {
  await loadEnvFile(path.join(ROOT_DIR, '.env.local'));
  await loadEnvFile(path.join(ROOT_DIR, 'python', '.env'));

  const client = new Client({
    connectionString: process.env.BITFLOW_PG_DSN || 'postgresql:///bitflow_onchain',
  });

  await client.connect();

  try {
    const [nodeStatus, indexedStatus] = await Promise.all([
      readNodeStatus(),
      readIndexedStatus(client),
    ]);

    const metricResult = await client.query(`
      SELECT day::text AS day, metric_name, metric_value, unit, dimension_key
      FROM btc_daily_metrics
      ORDER BY day ASC
    `);

    const metricRows = metricResult.rows.flatMap((row) => {
      const publishedMetricName = METRIC_NAME_MAP.get(
        `${row.metric_name}:${row.dimension_key}`
      );
      if (!publishedMetricName) {
        return [];
      }

      return [
        {
          collected_at: toIsoTimestamp(row.day),
          metric_name: publishedMetricName,
          value: toNumber(row.metric_value),
          resolution: 'daily',
          metadata: {
            source: 'bitflow-local-worker',
            unit: row.unit,
            source_metric_name: row.metric_name,
            dimension_key: row.dimension_key,
          },
        },
      ];
    });

    const alertResult = await client.query(`
      SELECT detected_at, alert_type, severity, title, body, related_txid, context
      FROM btc_alert_events
      WHERE related_txid IS NOT NULL
        AND alert_type IN ('mempool_large_tx', 'large_confirmed_spend', 'dormant_reactivation')
      ORDER BY detected_at DESC
      LIMIT 200
    `);

    const alertRows = alertResult.rows
      .map((row) => ({
        tx_hash: String(row.related_txid),
        timestamp:
          row.detected_at instanceof Date
            ? row.detected_at.toISOString()
            : new Date(String(row.detected_at)).toISOString(),
        amount_btc: inferAlertAmountBtc(row),
        from_type: 'bitflow_onchain',
        from_name: String(row.alert_type),
        to_type: String(row.severity),
        to_name: String(row.title),
        tweeted: false,
      }))
      .filter((row) => row.amount_btc > 0);

    const entityFlowResult = await client.query(`
      WITH latest_day AS (
        SELECT MAX(day) AS day
        FROM btc_entity_flow_daily
      )
      SELECT
        day::text AS day,
        entity_slug,
        received_sats,
        sent_sats,
        netflow_sats,
        tx_count
      FROM btc_entity_flow_daily
      WHERE day = (SELECT day FROM latest_day)
      ORDER BY ABS(netflow_sats) DESC
      LIMIT 24
    `);

    const entityFlowRows = entityFlowResult.rows.map((row) => ({
      collected_at: toIsoTimestamp(row.day),
      metric_name: `entity_flow_net:${String(row.entity_slug)}`,
      value: toNumber(row.netflow_sats) / 100_000_000,
      resolution: 'daily',
      metadata: {
        source: 'bitflow-local-worker',
        entity_slug: String(row.entity_slug),
        received_sats: toNumber(row.received_sats),
        sent_sats: toNumber(row.sent_sats),
        netflow_sats: toNumber(row.netflow_sats),
        tx_count: toNumber(row.tx_count),
        unit: 'btc',
      },
    }));

    const metricNames = Array.from(new Set(metricRows.map((row) => row.metric_name)));
    if (metricNames.length > 0) {
      await supabaseDelete(
        `/rest/v1/onchain_metrics?metric_name=in.(${metricNames.join(',')})&resolution=eq.daily`
      );
      await insertInBatches('/rest/v1/onchain_metrics', metricRows);
    }

    await supabaseDelete(
      '/rest/v1/onchain_metrics?resolution=eq.daily&metric_name=gte.entity_flow_net:&metric_name=lt.entity_flow_net;'
    );
    await insertInBatches('/rest/v1/onchain_metrics', entityFlowRows);

    await supabaseDelete('/rest/v1/whale_transactions?from_type=eq.bitflow_onchain');
    await insertInBatches('/rest/v1/whale_transactions', alertRows, 200);

    const lagBlocks =
      nodeStatus.state === 'ok' &&
      indexedStatus.state === 'ok' &&
      nodeStatus.nodeTipHeight !== null &&
      indexedStatus.indexedHeight !== null
        ? Math.max(nodeStatus.nodeTipHeight - indexedStatus.indexedHeight, 0)
        : null;
    const syncPercent =
      nodeStatus.state === 'ok' &&
      indexedStatus.state === 'ok' &&
      nodeStatus.nodeTipHeight !== null &&
      indexedStatus.indexedHeight !== null &&
      nodeStatus.nodeTipHeight > 0
        ? Number(
            Math.min((indexedStatus.indexedHeight / nodeStatus.nodeTipHeight) * 100, 100).toFixed(
              2
            )
          )
        : null;
    const publishedLatestDay = latestPublishedDay(
      [...metricRows, ...entityFlowRows],
      alertRows
    );
    const publishedState =
      metricRows.length > 0 || alertRows.length > 0 || entityFlowRows.length > 0 ? 'ok' : 'empty';

    await supabaseDelete('/rest/v1/onchain_metrics?metric_name=eq.pipeline_status&resolution=eq.status');
    await supabaseInsert('/rest/v1/onchain_metrics', [
      {
        collected_at: new Date().toISOString(),
        metric_name: 'pipeline_status',
        value: syncPercent ?? 0,
        resolution: 'status',
        metadata: {
          source: 'bitflow-local-worker',
          node_state: nodeStatus.state,
          indexer_state: indexedStatus.state,
          published_state: publishedState,
          node_tip_height: nodeStatus.nodeTipHeight,
          header_height: nodeStatus.headerHeight,
          indexed_height: indexedStatus.indexedHeight,
          lag_blocks: lagBlocks,
          sync_percent: syncPercent,
          latest_indexed_day: indexedStatus.latestIndexedDay,
          published_source: 'supabase',
          published_latest_day: publishedLatestDay,
          alert_total: alertRows.length,
          entity_flow_total: entityFlowRows.length,
          initial_block_download: nodeStatus.initialBlockDownload,
          pruned: nodeStatus.pruned,
          prune_height: nodeStatus.pruneHeight,
        },
      },
    ]);

    console.log(
      JSON.stringify(
        {
          syncedMetricRows: metricRows.length,
          syncedEntityFlowRows: entityFlowRows.length,
          syncedAlertRows: alertRows.length,
          nodeState: nodeStatus.state,
          indexerState: indexedStatus.state,
          publishedState,
        },
        null,
        2
      )
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
