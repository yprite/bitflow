import { NextResponse } from 'next/server';
import {
  deriveBitcoinTxStatusSnapshot,
  type BitcoinTxStatusApiFees,
  type BitcoinTxStatusApiTx,
} from '@/lib/bitcoin-tx-status';

export const dynamic = 'force-dynamic';

const MEMPOOL_SPACE_API_BASE = 'https://mempool.space/api';
const TXID_PATTERN = /^[0-9a-f]{64}$/i;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${MEMPOOL_SPACE_API_BASE}${path}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`${path}:${response.status}`);
  }

  return (await response.json()) as T;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const txid = (searchParams.get('txid') ?? '').trim().toLowerCase();

  if (!TXID_PATTERN.test(txid)) {
    return NextResponse.json(
      { error: '64자리 txid를 입력해 주세요.' },
      { status: 400 }
    );
  }

  try {
    const [tx, tipHeight, fees] = await Promise.all([
      fetchJson<BitcoinTxStatusApiTx>(`/tx/${txid}`),
      fetch(`${MEMPOOL_SPACE_API_BASE}/blocks/tip/height`, { cache: 'no-store' }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`/blocks/tip/height:${response.status}`);
        }

        return Number(await response.text());
      }),
      fetchJson<BitcoinTxStatusApiFees>('/v1/fees/recommended'),
    ]);

    const snapshot = deriveBitcoinTxStatusSnapshot({
      tx,
      tipHeight: Number.isFinite(tipHeight) ? tipHeight : 0,
      fees,
    });

    return NextResponse.json({
      status: 'ok',
      snapshot,
      fees,
      tipHeight: Number.isFinite(tipHeight) ? tipHeight : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === `/tx/${txid}:404`) {
      return NextResponse.json({
        status: 'not_found',
        txid,
        message:
          '공개 mempool 인덱스에서 이 txid를 찾지 못했습니다. 잘못된 txid이거나 이미 dropped 되었을 수 있습니다.',
      });
    }

    console.error('TX status tracker error:', error);
    return NextResponse.json(
      { error: 'TX 상태를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
