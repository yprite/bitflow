import { NextResponse } from 'next/server';
import { fetchMarketHomeDiagnostics, fetchMarketHomeSnapshot } from '@/lib/market-home-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (process.env.NODE_ENV !== 'production' && url.searchParams.get('debug') === '1') {
    const [snapshot, diagnostics] = await Promise.all([fetchMarketHomeSnapshot(), fetchMarketHomeDiagnostics()]);
    return NextResponse.json({ snapshot, diagnostics });
  }

  const snapshot = await fetchMarketHomeSnapshot();
  return NextResponse.json(snapshot);
}
