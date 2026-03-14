import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface CoinGeckoMarketChart {
  prices: [number, number][];
}

let cache: { data: { t: number; p: number }[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5분

export async function GET() {
  try {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily',
    );

    if (!res.ok) {
      // fallback: 캐시가 있으면 반환
      if (cache) return NextResponse.json(cache.data);
      return NextResponse.json([], { status: 502 });
    }

    const json: CoinGeckoMarketChart = await res.json();
    const points = json.prices.map(([t, p]) => ({ t, p: Math.round(p) }));

    cache = { data: points, fetchedAt: Date.now() };
    return NextResponse.json(points);
  } catch {
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json([], { status: 500 });
  }
}
