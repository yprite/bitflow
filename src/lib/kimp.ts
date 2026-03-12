import { KimpData, FundingRateData, FearGreedData, CompositeSignal } from './types';

export async function fetchUpbitPrice(): Promise<number> {
  const res = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC', {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Upbit API error: ${res.status}`);
  const data = await res.json();
  return data[0].trade_price;
}

export async function fetchBinancePrice(): Promise<number> {
  const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
  const data = await res.json();
  return parseFloat(data.price);
}

export async function fetchUsdKrw(): Promise<number> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);
  const data = await res.json();
  return data.rates.KRW;
}

export async function fetchFundingRate(): Promise<FundingRateData> {
  const res = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT', {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Binance Funding Rate API error: ${res.status}`);
  const data = await res.json();
  return {
    symbol: data.symbol,
    fundingRate: parseFloat(data.lastFundingRate),
    nextFundingTime: data.nextFundingTime,
  };
}

export async function fetchFearGreed(): Promise<FearGreedData> {
  const res = await fetch('https://api.alternative.me/fng/', {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Fear & Greed API error: ${res.status}`);
  const data = await res.json();
  const entry = data.data[0];
  return {
    value: parseInt(entry.value, 10),
    classification: entry.value_classification,
    timestamp: entry.timestamp,
  };
}

export function calculateKimchiPremium(
  upbitKrw: number,
  binanceUsdt: number,
  usdKrw: number
): number {
  return ((upbitKrw / (binanceUsdt * usdKrw)) - 1) * 100;
}

export async function getKimpData(): Promise<KimpData> {
  const [upbitPrice, binancePrice, usdKrw] = await Promise.all([
    fetchUpbitPrice(),
    fetchBinancePrice(),
    fetchUsdKrw(),
  ]);

  const kimchiPremium = calculateKimchiPremium(upbitPrice, binancePrice, usdKrw);

  return {
    upbitPrice,
    binancePrice,
    usdKrw,
    kimchiPremium,
    timestamp: new Date().toISOString(),
  };
}

export function getCompositeSignal(
  kimchiPremium: number,
  fundingRate: number,
  fearGreedValue: number
): CompositeSignal {
  let score = 0;

  // 김프 점수: 높으면 과열
  if (kimchiPremium > 5) score += 2;
  else if (kimchiPremium > 3) score += 1;
  else if (kimchiPremium < -1) score -= 2;
  else if (kimchiPremium < 1) score -= 1;

  // 펀딩비 점수: 높으면 과열
  if (fundingRate > 0.05) score += 2;
  else if (fundingRate > 0.01) score += 1;
  else if (fundingRate < -0.01) score -= 2;
  else if (fundingRate < 0) score -= 1;

  // 공포탐욕 점수: 높으면 과열
  if (fearGreedValue > 75) score += 2;
  else if (fearGreedValue > 55) score += 1;
  else if (fearGreedValue < 25) score -= 2;
  else if (fearGreedValue < 45) score -= 1;

  if (score >= 3) {
    return { level: '과열', color: 'text-red-400', description: '시장 과열 구간. 신규 진입 주의.' };
  } else if (score <= -3) {
    return { level: '침체', color: 'text-blue-400', description: '시장 침체 구간. 매수 기회 탐색.' };
  }
  return { level: '중립', color: 'text-gray-400', description: '시장 중립 구간.' };
}
