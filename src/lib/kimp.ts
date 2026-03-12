import { KimpData, FundingRateData, FearGreedData, CompositeSignal, CoinPremium, MultiCoinKimpData, ArbitrageResult } from './types';

interface BybitTickerResponse<T> {
  retCode: number;
  retMsg: string;
  result?: {
    list?: T[];
  };
}

function assertBybitOk<T>(payload: BybitTickerResponse<T>, label: string): T[] {
  if (payload.retCode !== 0) {
    throw new Error(`${label} error: ${payload.retCode} ${payload.retMsg}`);
  }

  return payload.result?.list ?? [];
}

export async function fetchUpbitPrice(): Promise<number> {
  const res = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC', {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Upbit API error: ${res.status}`);
  const data = await res.json();
  return data[0].trade_price;
}

export async function fetchGlobalPrice(): Promise<number> {
  const res = await fetch('https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT', {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Bybit spot API error: ${res.status}`);

  const data = await res.json() as BybitTickerResponse<{ lastPrice: string }>;
  const [ticker] = assertBybitOk(data, 'Bybit spot API');

  if (!ticker?.lastPrice) {
    throw new Error('Bybit spot API returned no price');
  }

  return parseFloat(ticker.lastPrice);
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
  const res = await fetch('https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT', {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Bybit funding API error: ${res.status}`);

  const data = await res.json() as BybitTickerResponse<{
    symbol: string;
    fundingRate: string;
    nextFundingTime: string;
  }>;
  const [ticker] = assertBybitOk(data, 'Bybit funding API');

  if (!ticker?.fundingRate || !ticker.nextFundingTime) {
    throw new Error('Bybit funding API returned incomplete data');
  }

  return {
    symbol: ticker.symbol,
    fundingRate: parseFloat(ticker.fundingRate),
    nextFundingTime: Number(ticker.nextFundingTime),
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
  const [upbitPrice, globalPrice, usdKrw] = await Promise.all([
    fetchUpbitPrice(),
    fetchGlobalPrice(),
    fetchUsdKrw(),
  ]);

  const kimchiPremium = calculateKimchiPremium(upbitPrice, globalPrice, usdKrw);

  return {
    upbitPrice,
    globalPrice,
    usdKrw,
    kimchiPremium,
    timestamp: new Date().toISOString(),
  };
}

// 멀티코인 김프 데이터
const TRACKED_COINS = [
  { symbol: 'BTC', upbit: 'KRW-BTC', global: 'BTCUSDT', name: '비트코인' },
  { symbol: 'ETH', upbit: 'KRW-ETH', global: 'ETHUSDT', name: '이더리움' },
  { symbol: 'XRP', upbit: 'KRW-XRP', global: 'XRPUSDT', name: '리플' },
  { symbol: 'SOL', upbit: 'KRW-SOL', global: 'SOLUSDT', name: '솔라나' },
  { symbol: 'DOGE', upbit: 'KRW-DOGE', global: 'DOGEUSDT', name: '도지코인' },
  { symbol: 'ADA', upbit: 'KRW-ADA', global: 'ADAUSDT', name: '에이다' },
  { symbol: 'AVAX', upbit: 'KRW-AVAX', global: 'AVAXUSDT', name: '아발란체' },
  { symbol: 'DOT', upbit: 'KRW-DOT', global: 'DOTUSDT', name: '폴카닷' },
  { symbol: 'LINK', upbit: 'KRW-LINK', global: 'LINKUSDT', name: '체인링크' },
  { symbol: 'POL', upbit: 'KRW-POL', global: 'POLUSDT', name: '폴리곤' },
];

export { TRACKED_COINS };

export async function fetchMultiCoinKimp(): Promise<MultiCoinKimpData> {
  const upbitMarkets = TRACKED_COINS.map(c => c.upbit).join(',');

  const [upbitRes, globalRes, usdKrw] = await Promise.all([
    fetch(`https://api.upbit.com/v1/ticker?markets=${upbitMarkets}`, {
      next: { revalidate: 0 },
    }),
    fetch('https://api.bybit.com/v5/market/tickers?category=spot', {
      next: { revalidate: 0 },
    }),
    fetchUsdKrw(),
  ]);

  if (!upbitRes.ok) throw new Error(`Upbit multi API error: ${upbitRes.status}`);
  if (!globalRes.ok) throw new Error(`Bybit multi API error: ${globalRes.status}`);

  const upbitData: Array<{ market: string; trade_price: number }> = await upbitRes.json();
  const bybitPayload = await globalRes.json() as BybitTickerResponse<{
    symbol: string;
    lastPrice: string;
  }>;
  const globalData = assertBybitOk(bybitPayload, 'Bybit multi API');

  const upbitMap = new Map(upbitData.map(d => [d.market, d.trade_price]));
  const globalMap = new Map(globalData.map(d => [d.symbol, parseFloat(d.lastPrice)]));

  const coins: CoinPremium[] = TRACKED_COINS
    .map(coin => {
      const upbitPrice = upbitMap.get(coin.upbit);
      const globalPrice = globalMap.get(coin.global);
      if (!upbitPrice || !globalPrice) return null;

      const premium = calculateKimchiPremium(upbitPrice, globalPrice, usdKrw);
      return {
        symbol: coin.symbol,
        name: coin.name,
        upbitPrice,
        globalPrice,
        premium,
      };
    })
    .filter((c): c is CoinPremium => c !== null);

  return {
    coins,
    usdKrw,
    timestamp: new Date().toISOString(),
  };
}

// 차익거래 계산기
const COIN_NETWORK_INFO: Record<string, { network: string; fee: number; feeUnit: string; timeMin: number }> = {
  BTC: { network: 'Bitcoin', fee: 0.0005, feeUnit: 'BTC', timeMin: 30 },
  ETH: { network: 'Ethereum', fee: 0.005, feeUnit: 'ETH', timeMin: 5 },
  XRP: { network: 'Ripple', fee: 1, feeUnit: 'XRP', timeMin: 1 },
  SOL: { network: 'Solana', fee: 0.01, feeUnit: 'SOL', timeMin: 1 },
  DOGE: { network: 'Dogecoin', fee: 5, feeUnit: 'DOGE', timeMin: 10 },
  ADA: { network: 'Cardano', fee: 1, feeUnit: 'ADA', timeMin: 5 },
  AVAX: { network: 'Avalanche', fee: 0.01, feeUnit: 'AVAX', timeMin: 1 },
  DOT: { network: 'Polkadot', fee: 0.1, feeUnit: 'DOT', timeMin: 5 },
  LINK: { network: 'Ethereum', fee: 0.3, feeUnit: 'LINK', timeMin: 5 },
  POL: { network: 'Polygon', fee: 0.1, feeUnit: 'POL', timeMin: 1 },
};

export function calculateArbitrage(
  coin: CoinPremium,
  investmentKrw: number,
  usdKrw: number,
  direction: 'buy-kr-sell-global' | 'buy-global-sell-kr'
): ArbitrageResult {
  const krFeeRate = 0.0005;    // 업비트 수수료 0.05%
  const globalFeeRate = 0.001; // 해외 거래소 수수료 0.1%
  const slippageRate = 0.001;  // 예상 슬리피지 0.1%

  const networkInfo = COIN_NETWORK_INFO[coin.symbol] || { network: 'Unknown', fee: 0, feeUnit: coin.symbol, timeMin: 10 };
  const networkFeeKrw = networkInfo.fee * (coin.upbitPrice / 1); // 대략적 원화 환산

  let grossProfit: number;
  let exchangeFeeKr: number;
  let exchangeFeeGlobal: number;

  if (direction === 'buy-global-sell-kr' && coin.premium > 0) {
    // 해외에서 싸게 사서 한국에서 비싸게 팔기 (양김프)
    const buyAmountUsd = investmentKrw / usdKrw;
    const coinAmount = buyAmountUsd / coin.globalPrice;
    const sellKrw = coinAmount * coin.upbitPrice;
    grossProfit = sellKrw - investmentKrw;
    exchangeFeeKr = sellKrw * krFeeRate;
    exchangeFeeGlobal = buyAmountUsd * globalFeeRate * usdKrw;
  } else if (direction === 'buy-kr-sell-global' && coin.premium < 0) {
    // 한국에서 싸게 사서 해외에서 비싸게 팔기 (역김프)
    const coinAmount = investmentKrw / coin.upbitPrice;
    const sellUsd = coinAmount * coin.globalPrice;
    const sellKrw = sellUsd * usdKrw;
    grossProfit = sellKrw - investmentKrw;
    exchangeFeeKr = investmentKrw * krFeeRate;
    exchangeFeeGlobal = sellUsd * globalFeeRate * usdKrw;
  } else {
    // 프리미엄 방향과 거래 방향이 맞지 않는 경우 (손해)
    grossProfit = -investmentKrw * Math.abs(coin.premium) / 100;
    exchangeFeeKr = investmentKrw * krFeeRate;
    exchangeFeeGlobal = investmentKrw * globalFeeRate;
  }

  const slippage = investmentKrw * slippageRate;
  const totalCost = exchangeFeeKr + exchangeFeeGlobal + networkFeeKrw + slippage;
  const netProfit = grossProfit - totalCost;
  const netProfitRate = (netProfit / investmentKrw) * 100;

  const timeMin = networkInfo.timeMin;
  const estimatedTime = timeMin < 5 ? `약 ${timeMin}분` : `약 ${timeMin}~${timeMin * 2}분`;

  return {
    coin: coin.symbol,
    direction: direction === 'buy-kr-sell-global' ? '한국 매수 → 해외 매도' : '해외 매수 → 한국 매도',
    investmentKrw,
    premium: coin.premium,
    grossProfit,
    exchangeFeeKr,
    exchangeFeeGlobal,
    withdrawalFee: 0,
    networkFee: networkFeeKrw,
    slippage,
    netProfit,
    netProfitRate,
    estimatedTime,
    viable: netProfit > 0,
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
