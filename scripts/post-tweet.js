#!/usr/bin/env node
/**
 * post-tweet.js
 * - Validate data freshness (source_timestamp/source_date based)
 * - Generate summary text and OG card image
 * - Optionally post via external OpenChrome command
 *
 * Usage:
 *   node scripts/post-tweet.js --generate-only
 *   node scripts/post-tweet.js
 *   node scripts/post-tweet.js --force --type weekly
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { notify } = require('./notify');
const { main: generateSummary } = require('./generate-summary');
const { generateOgImage } = require('./generate-og');
const { evaluateStale, buildTweetText } = require('./lib/post-utils');

const BITFLOW_HOME = process.env.BITFLOW_HOME || path.resolve(__dirname, '..');
const RETRY_DELAY_MS = Number(process.env.BITFLOW_TWEET_RETRY_MS || 5 * 60 * 1000);

class PostConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PostConfigError';
  }
}

function parseArgs(argv) {
  const args = {
    generateOnly: false,
    force: false,
    type: 'daily_summary',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--generate-only') args.generateOnly = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--type') args.type = argv[i + 1] || args.type;
  }
  return args;
}

function ensureLogDir() {
  const dir = path.join(BITFLOW_HOME, 'logs');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeDraft(text) {
  const dir = ensureLogDir();
  const file = path.join(dir, `tweet-draft-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);
  fs.writeFileSync(file, text, 'utf-8');
  return file;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

async function fetchLatestMetrics(supabase) {
  const metricNames = ['exchange_netflow', 'mempool_fees', 'fear_greed', 'utxo_age_1y'];
  const rows = {};

  await Promise.all(
    metricNames.map(async (metricName) => {
      const { data } = await supabase
        .from('onchain_metrics')
        .select('metric_name, collected_at, metadata, value')
        .eq('metric_name', metricName)
        .order('collected_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      rows[metricName] = data || null;
    })
  );

  return rows;
}

async function insertTweetLog(supabase, payload) {
  const { error } = await supabase.from('tweet_log').insert(payload);
  if (error) {
    console.error('[tweet] tweet_log insert failed:', error.message);
  }
}

function runOpenChromePost({ text, textFilePath, imagePath }) {
  const cmd = process.env.OPENCHROME_POST_CMD;
  if (!cmd) {
    throw new PostConfigError(
      'OPENCHROME_POST_CMD is not configured. Use --generate-only or set a posting command.'
    );
  }

  const result = spawnSync(cmd, {
    shell: true,
    env: {
      ...process.env,
      BITFLOW_TWEET_TEXT: text,
      BITFLOW_TWEET_TEXT_FILE: textFilePath,
      BITFLOW_TWEET_IMAGE: imagePath,
    },
    encoding: 'utf-8',
  });

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    throw new Error(`post command failed (${result.status}): ${stderr || 'unknown error'}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabase = getSupabase();
  const startedAt = new Date().toISOString();
  console.log(`[tweet] start ${startedAt}`);

  const latestMetrics = await fetchLatestMetrics(supabase);
  const stale = evaluateStale(latestMetrics);

  if (stale.shouldSkip && !args.force) {
    const reason = `stale skip: ${stale.reason}`;
    await insertTweetLog(supabase, {
      tweet_type: args.type,
      status: 'skipped_stale',
      error_message: reason,
      content: null,
    });
    await notify('Tweet skipped (stale)', reason);
    console.log(`[tweet] skipped - ${reason}`);
    return;
  }

  const summary = await generateSummary({ silent: true });
  const tweetText = buildTweetText(summary);
  const draftPath = writeDraft(tweetText);
  const og = await generateOgImage({ summary });

  if (args.generateOnly) {
    await insertTweetLog(supabase, {
      tweet_type: args.type,
      status: 'generated_only',
      content: tweetText,
      error_message: null,
    });
    console.log(
      JSON.stringify(
        {
          mode: 'generate-only',
          textFile: draftPath,
          imageFile: og.outputPath,
        },
        null,
        2
      )
    );
    return;
  }

  try {
    runOpenChromePost({
      text: tweetText,
      textFilePath: draftPath,
      imagePath: og.outputPath,
    });

    await insertTweetLog(supabase, {
      tweet_type: args.type,
      status: 'success',
      content: tweetText,
      error_message: null,
    });
    console.log('[tweet] posted successfully');
    return;
  } catch (error) {
    if (error instanceof PostConfigError) {
      await insertTweetLog(supabase, {
        tweet_type: args.type,
        status: 'failed',
        content: tweetText,
        error_message: error.message,
      });
      await notify('Tweet post config error', error.message);
      throw error;
    }

    console.error('[tweet] first attempt failed:', error.message);
    await notify('Tweet post failed (retry)', error.message);
    await sleep(RETRY_DELAY_MS);
  }

  try {
    runOpenChromePost({
      text: tweetText,
      textFilePath: draftPath,
      imagePath: og.outputPath,
    });

    await insertTweetLog(supabase, {
      tweet_type: args.type,
      status: 'success',
      content: tweetText,
      error_message: 'posted after retry',
    });
    console.log('[tweet] posted successfully after retry');
  } catch (error) {
    await insertTweetLog(supabase, {
      tweet_type: args.type,
      status: 'retry_failed',
      content: tweetText,
      error_message: error.message,
    });
    await notify('Tweet post retry failed', error.message);
    throw error;
  }
}

main().catch((error) => {
  console.error('[tweet] fatal:', error.message);
  process.exit(1);
});
