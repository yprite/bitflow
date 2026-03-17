import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdminRequest } from '@/lib/admin-auth';
import { fetchOnchainSummary } from '@/lib/onchain';
import { getBitflowPgPool, hasBitflowPgDsn } from '@/lib/postgres';
import { createServiceClient, hasSupabaseServiceConfig } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

type NodeRuntimeState = 'ok' | 'rpc_error';
type IndexerRuntimeState = 'ok' | 'dsn_missing' | 'empty' | 'query_error';
type PublishedRuntimeState = 'ok' | 'empty' | 'local_only' | 'fallback';
type PublishedPipelineMetricRow = {
  collected_at: string;
  metadata?: Record<string, unknown> | null;
};

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isMissingSupabaseRelation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'PGRST205'
  );
}

async function readNodeStatus(): Promise<{
  state: NodeRuntimeState;
  nodeTipHeight: number | null;
  headerHeight: number | null;
  initialBlockDownload: boolean | null;
  pruned: boolean | null;
  pruneHeight: number | null;
}> {
  try {
    const { stdout } = await execFileAsync('bitcoin-cli', ['getblockchaininfo']);
    const payload = JSON.parse(stdout) as {
      blocks?: number;
      headers?: number;
      initialblockdownload?: boolean;
      pruned?: boolean;
      pruneheight?: number;
    };
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

async function readIndexedStatus(): Promise<{
  state: IndexerRuntimeState;
  indexedHeight: number | null;
  latestIndexedDay: string | null;
}> {
  if (!hasBitflowPgDsn()) {
    return {
      state: 'dsn_missing',
      indexedHeight: null,
      latestIndexedDay: null,
    };
  }

  try {
    const pool = getBitflowPgPool();
    const result = await pool.query<{
      indexed_height: string | number | null;
      latest_indexed_day: string | null;
    }>(
      `
        SELECT
          MAX(height) AS indexed_height,
          MAX(block_time::date)::text AS latest_indexed_day
        FROM btc_blocks
      `
    );

    const indexedHeight =
      result.rows[0]?.indexed_height === null || result.rows[0]?.indexed_height === undefined
        ? null
        : Number(result.rows[0].indexed_height);
    const latestIndexedDay = result.rows[0]?.latest_indexed_day ?? null;

    return {
      state: indexedHeight === null ? 'empty' : 'ok',
      indexedHeight:
        indexedHeight,
      latestIndexedDay,
    };
  } catch {
    return {
      state: 'query_error',
      indexedHeight: null,
      latestIndexedDay: null,
    };
  }
}

function derivePublishedState(
  source: 'supabase' | 'local-postgres' | 'fallback',
  status: 'available' | 'unavailable'
): PublishedRuntimeState {
  if (source === 'fallback') return 'fallback';
  if (source === 'local-postgres') return 'local_only';
  if (status === 'available') return 'ok';
  return 'empty';
}

async function readPublishedPipelineStatus(): Promise<{
  states: {
    node: NodeRuntimeState;
    indexer: IndexerRuntimeState;
    published: PublishedRuntimeState;
  };
  nodeTipHeight: number | null;
  headerHeight: number | null;
  indexedHeight: number | null;
  lagBlocks: number | null;
  syncPercent: number | null;
  latestIndexedDay: string | null;
  publishedSource: 'supabase' | 'local-postgres' | 'fallback';
  publishedLatestDay: string | null;
  alertTotal: number;
  initialBlockDownload: boolean | null;
  pruned: boolean | null;
  pruneHeight: number | null;
  updatedAt: string;
} | null> {
  if (!hasSupabaseServiceConfig()) {
    return null;
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('onchain_metrics')
      .select('collected_at,metadata')
      .eq('metric_name', 'pipeline_status')
      .eq('resolution', 'status')
      .order('collected_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isMissingSupabaseRelation(error)) {
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    const row = data as PublishedPipelineMetricRow;
    const metadata =
      row.metadata && typeof row.metadata === 'object'
        ? row.metadata
        : {};

    return {
      states: {
        node:
          metadata.node_state === 'ok' || metadata.node_state === 'rpc_error'
            ? (metadata.node_state as NodeRuntimeState)
            : 'rpc_error',
        indexer:
          metadata.indexer_state === 'ok' ||
          metadata.indexer_state === 'dsn_missing' ||
          metadata.indexer_state === 'empty' ||
          metadata.indexer_state === 'query_error'
            ? (metadata.indexer_state as IndexerRuntimeState)
            : 'empty',
        published:
          metadata.published_state === 'ok' ||
          metadata.published_state === 'empty' ||
          metadata.published_state === 'local_only' ||
          metadata.published_state === 'fallback'
            ? (metadata.published_state as PublishedRuntimeState)
            : 'empty',
      },
      nodeTipHeight: toNumber(metadata.node_tip_height as number | string | null | undefined),
      headerHeight: toNumber(metadata.header_height as number | string | null | undefined),
      indexedHeight: toNumber(metadata.indexed_height as number | string | null | undefined),
      lagBlocks: toNumber(metadata.lag_blocks as number | string | null | undefined),
      syncPercent: toNumber(metadata.sync_percent as number | string | null | undefined),
      latestIndexedDay:
        typeof metadata.latest_indexed_day === 'string' ? metadata.latest_indexed_day : null,
      publishedSource:
        metadata.published_source === 'local-postgres' || metadata.published_source === 'fallback'
          ? (metadata.published_source as 'local-postgres' | 'fallback')
          : 'supabase',
      publishedLatestDay:
        typeof metadata.published_latest_day === 'string' ? metadata.published_latest_day : null,
      alertTotal: toNumber(metadata.alert_total as number | string | null | undefined) ?? 0,
      initialBlockDownload:
        typeof metadata.initial_block_download === 'boolean'
          ? metadata.initial_block_download
          : null,
      pruned: typeof metadata.pruned === 'boolean' ? metadata.pruned : null,
      pruneHeight: toNumber(metadata.prune_height as number | string | null | undefined),
      updatedAt: row.collected_at,
    };
  } catch (error) {
    console.error('Published on-chain pipeline status read failed:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [summary, publishedPipelineStatus] = await Promise.all([
      fetchOnchainSummary({
        metricLookbackDays: 2,
        alertLimit: 12,
        entityLimit: 1,
      }),
      readPublishedPipelineStatus(),
    ]);

    if (publishedPipelineStatus) {
      return NextResponse.json({
        summary,
        pipeline: {
          states: publishedPipelineStatus.states,
          nodeTipHeight: publishedPipelineStatus.nodeTipHeight,
          headerHeight: publishedPipelineStatus.headerHeight,
          indexedHeight: publishedPipelineStatus.indexedHeight,
          lagBlocks: publishedPipelineStatus.lagBlocks,
          syncPercent: publishedPipelineStatus.syncPercent,
          latestIndexedDay: publishedPipelineStatus.latestIndexedDay,
          publishedSource: publishedPipelineStatus.publishedSource,
          publishedLatestDay: publishedPipelineStatus.publishedLatestDay,
          alertTotal: publishedPipelineStatus.alertTotal,
          initialBlockDownload: publishedPipelineStatus.initialBlockDownload,
          pruned: publishedPipelineStatus.pruned,
          pruneHeight: publishedPipelineStatus.pruneHeight,
          updatedAt: publishedPipelineStatus.updatedAt,
        },
      });
    }

    const [nodeStatus, indexedStatus] = await Promise.all([readNodeStatus(), readIndexedStatus()]);
    const publishedState = derivePublishedState(summary.source, summary.status);

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
        ? Math.min((indexedStatus.indexedHeight / nodeStatus.nodeTipHeight) * 100, 100)
        : null;

    return NextResponse.json({
      summary,
      pipeline: {
        states: {
          node: nodeStatus.state,
          indexer: indexedStatus.state,
          published: publishedState,
        },
        nodeTipHeight: nodeStatus.nodeTipHeight,
        headerHeight: nodeStatus.headerHeight,
        indexedHeight: indexedStatus.indexedHeight,
        lagBlocks,
        syncPercent,
        latestIndexedDay: indexedStatus.latestIndexedDay,
        publishedSource: summary.source,
        publishedLatestDay: publishedState === 'ok' ? summary.latestDay : null,
        alertTotal: summary.alertStats.total,
        initialBlockDownload: nodeStatus.initialBlockDownload,
        pruned: nodeStatus.pruned,
        pruneHeight: nodeStatus.pruneHeight,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin on-chain API error:', error);
    return NextResponse.json(
      { error: '관리자 온체인 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
