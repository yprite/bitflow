import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdminRequest } from '@/lib/admin-auth';
import { fetchOnchainSummary } from '@/lib/onchain';
import { getBitflowPgPool, hasBitflowPgDsn } from '@/lib/postgres';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

type NodeRuntimeState = 'ok' | 'rpc_error';
type IndexerRuntimeState = 'ok' | 'dsn_missing' | 'empty' | 'query_error';
type PublishedRuntimeState = 'ok' | 'empty' | 'local_only' | 'fallback';

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

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [summary, nodeStatus, indexedStatus] = await Promise.all([
      fetchOnchainSummary({
        metricLookbackDays: 2,
        alertLimit: 12,
        entityLimit: 1,
      }),
      readNodeStatus(),
      readIndexedStatus(),
    ]);
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
