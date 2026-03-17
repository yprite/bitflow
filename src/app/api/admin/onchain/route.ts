import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdminRequest } from '@/lib/admin-auth';
import { fetchOnchainSummary } from '@/lib/onchain';
import { getBitflowPgPool, hasBitflowPgDsn } from '@/lib/postgres';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

async function readNodeTipHeight(): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync('bitcoin-cli', ['getblockchaininfo']);
    const payload = JSON.parse(stdout) as { blocks?: number };
    return typeof payload.blocks === 'number' ? payload.blocks : null;
  } catch {
    return null;
  }
}

async function readIndexedStatus(): Promise<{
  indexedHeight: number | null;
  latestIndexedDay: string | null;
}> {
  if (!hasBitflowPgDsn()) {
    return {
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

    return {
      indexedHeight:
        result.rows[0]?.indexed_height === null || result.rows[0]?.indexed_height === undefined
          ? null
          : Number(result.rows[0].indexed_height),
      latestIndexedDay: result.rows[0]?.latest_indexed_day ?? null,
    };
  } catch {
    return {
      indexedHeight: null,
      latestIndexedDay: null,
    };
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [summary, nodeTipHeight, indexedStatus] = await Promise.all([
      fetchOnchainSummary({
        metricLookbackDays: 30,
        alertLimit: 20,
        entityLimit: 10,
      }),
      readNodeTipHeight(),
      readIndexedStatus(),
    ]);

    const lagBlocks =
      nodeTipHeight !== null && indexedStatus.indexedHeight !== null
        ? Math.max(nodeTipHeight - indexedStatus.indexedHeight, 0)
        : null;
    const syncPercent =
      nodeTipHeight !== null &&
      indexedStatus.indexedHeight !== null &&
      nodeTipHeight > 0
        ? Math.min((indexedStatus.indexedHeight / nodeTipHeight) * 100, 100)
        : null;

    return NextResponse.json({
      summary,
      pipeline: {
        nodeTipHeight,
        indexedHeight: indexedStatus.indexedHeight,
        lagBlocks,
        syncPercent,
        latestIndexedDay: indexedStatus.latestIndexedDay,
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
