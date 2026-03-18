#!/usr/bin/env node

import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  fetchRssCandidates,
  fetchXCandidates,
  getTrackedXAccounts,
  getXSessionStatePath,
  loadEnvFile,
  normalizeUrl,
  requiredEnv,
} from './lib/news-ingest-lib.mjs';

const ROOT_DIR = path.resolve(new URL('..', import.meta.url).pathname);
const LOOKBACK_HOURS = 24 * 7;

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
  };
}

function createSupabaseClient() {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_KEY'), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function toCandidateRow(candidate) {
  return {
    source_type: candidate.sourceType,
    source_name: candidate.sourceName,
    external_id:
      candidate.sourceType === 'x'
        ? String(candidate.id).replace(/^x-/, '')
        : normalizeUrl(candidate.url),
    author_handle: candidate.authorHandle ?? null,
    title: candidate.title,
    body: candidate.body ?? null,
    url: candidate.url,
    published_at: candidate.publishedAt ?? new Date().toISOString(),
    topic_hint: candidate.topicHint ?? null,
    score: candidate.score ?? 0,
    metadata: {
      feed_name: candidate.feedName ?? candidate.sourceName,
      source_url: candidate.sourceUrl ?? null,
    },
    raw_payload: candidate.rawPayload ?? {},
    updated_at: new Date().toISOString(),
  };
}

async function upsertCandidates(supabase, candidates) {
  if (candidates.length === 0) {
    return 0;
  }

  const rows = candidates.map((candidate) => toCandidateRow(candidate));
  const { error } = await supabase
    .from('news_candidates')
    .upsert(rows, {
      onConflict: 'source_type,source_name,external_id',
      ignoreDuplicates: false,
    });

  if (error) {
    if (error.code === 'PGRST205') {
      console.warn('news_candidates table is missing in Supabase. Apply migration 006_news_candidates.sql first.');
      return 0;
    }
    throw error;
  }

  return rows.length;
}

async function replaceRecentXCandidates(supabase, trackedAccounts, sinceIso, xCandidates) {
  const { error: deleteError } = await supabase
    .from('news_candidates')
    .delete()
    .eq('source_type', 'x')
    .in('author_handle', trackedAccounts)
    .gte('published_at', sinceIso);

  if (deleteError) {
    if (deleteError.code === 'PGRST205') {
      console.warn('news_candidates table is missing in Supabase. Apply migration 006_news_candidates.sql first.');
      return 0;
    }
    throw deleteError;
  }

  if (xCandidates.length === 0) {
    return 0;
  }

  const rows = xCandidates.map((candidate) => toCandidateRow(candidate));
  const { error } = await supabase
    .from('news_candidates')
    .insert(rows);

  if (error) {
    throw error;
  }

  return rows.length;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await loadEnvFile(path.join(ROOT_DIR, '.env.local'));
  await loadEnvFile(path.join(ROOT_DIR, 'python', '.env'));

  const sinceIso = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  const supabase = createSupabaseClient();
  const storageStatePath = getXSessionStatePath(ROOT_DIR);

  const rssCandidates = await fetchRssCandidates({ sinceIso, limit: 40 });

  let xCandidates = [];
  let xFetchSucceeded = false;
  try {
    xCandidates = await fetchXCandidates({
      storageStatePath,
      accounts: getTrackedXAccounts(),
      sinceIso,
      limitPerAccount: 6,
    });
    xFetchSucceeded = true;
  } catch (error) {
    console.warn('X ingest skipped:', error instanceof Error ? error.message : String(error));
  }

  const mergedCandidates = [...rssCandidates, ...xCandidates];
  let total = mergedCandidates.length;

  if (!options.dryRun) {
    const rssCount = await upsertCandidates(supabase, rssCandidates);
    const xCount = xFetchSucceeded
      ? await replaceRecentXCandidates(supabase, getTrackedXAccounts(), sinceIso, xCandidates)
      : 0;
    total = rssCount + xCount;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        insertedOrUpdated: total,
        rssCandidates: rssCandidates.length,
        xCandidates: xCandidates.length,
        trackedAccounts: getTrackedXAccounts().map((account) => `@${account}`),
        dryRun: options.dryRun,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('ingest-news-candidates failed:', error);
  process.exitCode = 1;
});
