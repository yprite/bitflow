import fs from 'node:fs/promises';
import path from 'node:path';

const MEMPOOL_TIP_URL = 'https://mempool.space/api/blocks/tip/height';
const MEMPOOL_BLOCKS_URL = 'https://mempool.space/api/v1/blocks';
const SATS_PER_BTC = 100_000_000;
const REQUEST_DELAY_MS = 80;
const MAX_RETRIES = 5;

function parseArgs(argv) {
  const args = { days: 5 };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--days') args.days = Number(argv[++i]);
  }

  if (!Number.isInteger(args.days) || args.days <= 0) {
    throw new Error('Invalid --days');
  }

  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url) {
  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    if (REQUEST_DELAY_MS > 0) {
      await sleep(REQUEST_DELAY_MS);
    }

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'bitflow/1.0' },
      });

      if (response.ok) {
        return await response.text();
      }

      if (response.status < 500 && response.status !== 429) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      lastError = new Error(`HTTP ${response.status} for ${url}`);
    } catch (error) {
      lastError = error;
    }

    const delayMs = 1000 * 2 ** attempt;
    console.warn(`Retrying ${url} in ${delayMs}ms`);
    await sleep(delayMs);
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

function dayKeyFromUnix(seconds) {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

async function fetchTipHeight() {
  const text = await fetchText(MEMPOOL_TIP_URL);
  return Number(text.trim());
}

async function fetchBlocksPage(height) {
  const text = await fetchText(`${MEMPOOL_BLOCKS_URL}/${height}`);
  const blocks = JSON.parse(text);

  if (!Array.isArray(blocks)) {
    throw new Error(`Unexpected blocks payload for height ${height}`);
  }

  return blocks.map((block) => ({
    height: Number(block.height),
    time: Number(block.timestamp),
    inputCount: Number(block.extras?.totalInputs ?? 0),
    outputCount: Number(block.extras?.totalOutputs ?? 0),
    inputValue: Number(block.extras?.totalInputAmt ?? 0),
    hash: String(block.id ?? ''),
  }));
}

async function main() {
  const { days } = parseArgs(process.argv.slice(2));
  const tipHeight = await fetchTipHeight();
  const dayStats = new Map();
  const distinctDays = [];

  console.log(`Generating fallback snapshot for last ${days} UTC day(s) from height ${tipHeight}`);

  for (let height = tipHeight; height >= 0; ) {
    const blocks = await fetchBlocksPage(height);
    if (blocks.length === 0) break;

    let shouldStop = false;

    for (const block of blocks) {
      const dayKey = dayKeyFromUnix(block.time);

      if (!dayStats.has(dayKey)) {
        if (distinctDays.length === days) {
          shouldStop = true;
          break;
        }
        distinctDays.push(dayKey);
        dayStats.set(dayKey, {
          createdUtxoCount: 0,
          spentUtxoCount: 0,
          spentSats: 0,
        });
      }

      const stats = dayStats.get(dayKey);
      stats.createdUtxoCount += block.outputCount;
      stats.spentUtxoCount += Math.max(block.inputCount, 0);
      stats.spentSats += block.inputValue;
    }

    const lastHeight = blocks.at(-1)?.height ?? 0;
    console.log(`Processed blocks ${blocks[0]?.height}..${lastHeight} (${distinctDays.join(', ')})`);

    if (shouldStop || lastHeight === 0) {
      break;
    }

    height = lastHeight - 1;
  }

  const metrics = Array.from(dayStats.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .flatMap(([day, stats]) => ([
      {
        day,
        metricName: 'created_utxo_count',
        metricValue: stats.createdUtxoCount,
        unit: 'count',
        dimensionKey: 'all',
      },
      {
        day,
        metricName: 'spent_utxo_count',
        metricValue: stats.spentUtxoCount,
        unit: 'count',
        dimensionKey: 'all',
      },
      {
        day,
        metricName: 'spent_btc',
        metricValue: Number((stats.spentSats / SATS_PER_BTC).toFixed(8)),
        unit: 'btc',
        dimensionKey: 'all',
      },
    ]));

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'mempool.space block aggregates',
    latestBlockHeight: tipHeight,
    metrics,
  };

  const outputPath = path.join(process.cwd(), 'src/data/onchain-fallback.json');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${metrics.length} metric rows to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
