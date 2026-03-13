import { KimpData, FundingRateData, FearGreedData, CompositeSignal, SignalFactor, CoinPremium, MultiCoinKimpData, ArbitrageResult, FundingRateHistoryPoint, FearGreedHistoryPoint } from './types';

interface OkxResponse<T> {
  code: string;
  msg: string;
  data?: T[];
}

type CoinGeckoSimplePriceResponse = Record<string, { usd?: number }>;
type CoinGeckoMarketsResponse = Array<{
  id: string;
  current_price: number;
  market_cap: number | null;
  market_cap_rank: number | null;
}>;

function assertOkxOk<T>(payload: OkxResponse<T>, label: string): T[] {
  if (payload.code !== '0') {
    throw new Error(`${label} error: ${payload.code} ${payload.msg}`);
  }

  return payload.data ?? [];
}

async function fetchCoinGeckoUsdPrices(ids: string[]): Promise<Record<string, number>> {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`,
    {
      next: { revalidate: 30 },
      headers: { 'User-Agent': 'bitflow/1.0' },
    }
  );

  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status}`);
  }

  const data = await res.json() as CoinGeckoSimplePriceResponse;
  const prices = Object.fromEntries(
    ids
      .map((id) => [id, data[id]?.usd])
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
  );

  if (Object.keys(prices).length === 0) {
    throw new Error('CoinGecko API returned no prices');
  }

  return prices;
}

async function fetchCoinGeckoMarkets(ids: string[]) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&per_page=${ids.length}&page=1&sparkline=false`,
    {
      next: { revalidate: 30 },
      headers: { 'User-Agent': 'bitflow/1.0' },
    }
  );

  if (!res.ok) {
    throw new Error(`CoinGecko markets API error: ${res.status}`);
  }

  const data = await res.json() as CoinGeckoMarketsResponse;
  if (data.length === 0) {
    throw new Error('CoinGecko markets API returned no data');
  }

  return new Map(
    data.map((entry) => [
      entry.id,
      {
        price: entry.current_price,
        marketCap: entry.market_cap,
        marketCapRank: entry.market_cap_rank,
      },
    ])
  );
}

async function fetchCoinbaseBtcPrice(): Promise<number> {
  const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', {
    next: { revalidate: 30 },
    headers: { 'User-Agent': 'bitflow/1.0' },
  });

  if (!res.ok) {
    throw new Error(`Coinbase API error: ${res.status}`);
  }

  const data = await res.json() as { data?: { amount?: string } };
  const amount = Number(data.data?.amount);
  if (!Number.isFinite(amount)) {
    throw new Error('Coinbase API returned invalid BTC price');
  }

  return amount;
}

async function fetchOkxSpotPrice(instId: string): Promise<number> {
  const res = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${instId}`, {
    next: { revalidate: 30 },
    headers: { 'User-Agent': 'bitflow/1.0' },
  });

  if (!res.ok) {
    throw new Error(`OKX spot API error: ${res.status}`);
  }

  const data = await res.json() as OkxResponse<{ last: string }>;
  const [ticker] = assertOkxOk(data, 'OKX spot API');
  const price = Number(ticker?.last);

  if (!Number.isFinite(price)) {
    throw new Error('OKX spot API returned invalid price');
  }

  return price;
}

async function fetchOkxFundingRate(): Promise<FundingRateData> {
  const res = await fetch('https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP', {
    next: { revalidate: 30 },
    headers: { 'User-Agent': 'bitflow/1.0' },
  });

  if (!res.ok) {
    throw new Error(`OKX funding API error: ${res.status}`);
  }

  const data = await res.json() as OkxResponse<{
    fundingRate: string;
    fundingTime: string;
    instId: string;
  }>;
  const [ticker] = assertOkxOk(data, 'OKX funding API');

  const fundingRate = Number(ticker?.fundingRate);
  const fundingTime = Number(ticker?.fundingTime);
  if (!Number.isFinite(fundingRate) || !Number.isFinite(fundingTime)) {
    throw new Error('OKX funding API returned invalid data');
  }

  return {
    symbol: ticker.instId.replace(/-/g, ''),
    fundingRate,
    nextFundingTime: fundingTime,
  };
}

export async function fetchUpbitPrice(): Promise<number> {
  const res = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC', {
    next: { revalidate: 15 },
    headers: { 'User-Agent': 'bitflow/1.0' },
  });
  if (!res.ok) throw new Error(`Upbit API error: ${res.status}`);
  const data = await res.json();
  return data[0].trade_price;
}

export async function fetchGlobalPrice(): Promise<number> {
  try {
    const prices = await fetchCoinGeckoUsdPrices(['bitcoin']);
    if (prices.bitcoin) {
      return prices.bitcoin;
    }
  } catch (error) {
    console.error('CoinGecko BTC price failed:', error);
  }

  try {
    return await fetchOkxSpotPrice('BTC-USDT');
  } catch (error) {
    console.error('OKX BTC price failed:', error);
  }

  return fetchCoinbaseBtcPrice();
}

export async function fetchUsdKrw(): Promise<number> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', {
    next: { revalidate: 300 },
    headers: { 'User-Agent': 'bitflow/1.0' },
  });
  if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);
  const data = await res.json();
  return data.rates.KRW;
}

export async function fetchFundingRate(): Promise<FundingRateData> {
  try {
    return await fetchOkxFundingRate();
  } catch (error) {
    console.error('Funding rate source failed:', error);
    return {
      symbol: 'BTCUSDT',
      fundingRate: 0,
      nextFundingTime: Date.now() + 8 * 60 * 60 * 1000,
    };
  }
}

export async function fetchFearGreed(): Promise<FearGreedData> {
  const res = await fetch('https://api.alternative.me/fng/', {
    next: { revalidate: 300 },
    headers: { 'User-Agent': 'bitflow/1.0' },
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
  globalUsdt: number,
  usdKrw: number
): number {
  return ((upbitKrw / (globalUsdt * usdKrw)) - 1) * 100;
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

// 펀딩비 히스토리 (OKX)
export async function fetchFundingRateHistory(limit = 100): Promise<FundingRateHistoryPoint[]> {
  try {
    const res = await fetch(
      `https://www.okx.com/api/v5/public/funding-rate-history?instId=BTC-USDT-SWAP&limit=${limit}`,
      {
        next: { revalidate: 300 },
        headers: { 'User-Agent': 'bitflow/1.0' },
      }
    );

    if (!res.ok) return [];

    const data = await res.json() as OkxResponse<{
      fundingRate: string;
      fundingTime: string;
    }>;

    if (data.code !== '0' || !data.data) return [];

    return data.data
      .map((d) => ({
        timestamp: new Date(Number(d.fundingTime)).toISOString(),
        rate: Number(d.fundingRate),
      }))
      .filter((d) => Number.isFinite(d.rate))
      .reverse();
  } catch {
    return [];
  }
}

// 공포탐욕지수 히스토리
export async function fetchFearGreedHistory(limit = 30): Promise<FearGreedHistoryPoint[]> {
  try {
    const res = await fetch(`https://api.alternative.me/fng/?limit=${limit}`, {
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'bitflow/1.0' },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.data) return [];

    return (data.data as Array<{ value: string; value_classification: string; timestamp: string }>)
      .map((d) => ({
        timestamp: new Date(Number(d.timestamp) * 1000).toISOString(),
        value: parseInt(d.value, 10),
        classification: d.value_classification,
      }))
      .filter((d) => Number.isFinite(d.value))
      .reverse();
  } catch {
    return [];
  }
}

// 멀티코인 김프 데이터
const TRACKED_COINS = [
  { symbol: 'BTC', upbit: 'KRW-BTC', global: 'BTC-USDT', gecko: 'bitcoin', name: '비트코인', marketCapRank: 1 },
  { symbol: 'ETH', upbit: 'KRW-ETH', global: 'ETH-USDT', gecko: 'ethereum', name: '이더리움', marketCapRank: 2 },
  { symbol: 'XRP', upbit: 'KRW-XRP', global: 'XRP-USDT', gecko: 'ripple', name: '리플', marketCapRank: 5 },
  { symbol: 'SOL', upbit: 'KRW-SOL', global: 'SOL-USDT', gecko: 'solana', name: '솔라나', marketCapRank: 7 },
  { symbol: 'DOGE', upbit: 'KRW-DOGE', global: 'DOGE-USDT', gecko: 'dogecoin', name: '도지코인', marketCapRank: 10 },
  { symbol: 'ADA', upbit: 'KRW-ADA', global: 'ADA-USDT', gecko: 'cardano', name: '에이다', marketCapRank: 13 },
  { symbol: 'AVAX', upbit: 'KRW-AVAX', global: 'AVAX-USDT', gecko: 'avalanche-2', name: '아발란체', marketCapRank: 26 },
  { symbol: 'DOT', upbit: 'KRW-DOT', global: 'DOT-USDT', gecko: 'polkadot', name: '폴카닷', marketCapRank: 38 },
  { symbol: 'LINK', upbit: 'KRW-LINK', global: 'LINK-USDT', gecko: 'chainlink', name: '체인링크', marketCapRank: 18 },
];

export { TRACKED_COINS };

export async function fetchMultiCoinKimp(): Promise<MultiCoinKimpData> {
  const upbitMarkets = TRACKED_COINS.map(c => c.upbit).join(',');
  const coinIds = TRACKED_COINS.map(c => c.gecko);

  const [upbitRes, usdKrw] = await Promise.all([
    fetch(`https://api.upbit.com/v1/ticker?markets=${upbitMarkets}`, {
      next: { revalidate: 15 },
      headers: { 'User-Agent': 'bitflow/1.0' },
    }),
    fetchUsdKrw(),
  ]);

  if (!upbitRes.ok) throw new Error(`Upbit multi API error: ${upbitRes.status}`);

  const upbitData: Array<{ market: string; trade_price: number }> = await upbitRes.json();
  const upbitMap = new Map(upbitData.map(d => [d.market, d.trade_price]));

  let globalMap = new Map<string, number>();
  let marketDataMap = new Map<string, { price: number; marketCap: number | null; marketCapRank: number | null }>();
  try {
    marketDataMap = await fetchCoinGeckoMarkets(coinIds);
    globalMap = new Map(
      TRACKED_COINS
        .map((coin) => [coin.global, marketDataMap.get(coin.gecko)?.price])
        .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
    );
  } catch (error) {
    console.error('CoinGecko markets failed:', error);

    try {
      const prices = await fetchCoinGeckoUsdPrices(coinIds);
      globalMap = new Map(
        TRACKED_COINS
          .map((coin) => [coin.global, prices[coin.gecko]])
          .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
      );
    } catch (priceError) {
      console.error('CoinGecko multi price failed:', priceError);

      const okxRes = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT', {
        next: { revalidate: 30 },
        headers: { 'User-Agent': 'bitflow/1.0' },
      });
      if (!okxRes.ok) throw new Error(`OKX multi API error: ${okxRes.status}`);

      const okxPayload = await okxRes.json() as OkxResponse<{ instId: string; last: string }>;
      const okxData = assertOkxOk(okxPayload, 'OKX multi API');
      globalMap = new Map(okxData.map((d) => [d.instId, parseFloat(d.last)]));
    }
  }

  const coins: CoinPremium[] = TRACKED_COINS
    .map(coin => {
      const upbitPrice = upbitMap.get(coin.upbit);
      const globalPrice = globalMap.get(coin.global);
      if (!upbitPrice || !globalPrice) return null;

      const premium = calculateKimchiPremium(upbitPrice, globalPrice, usdKrw);
      const marketData = marketDataMap.get(coin.gecko);
      return {
        symbol: coin.symbol,
        name: coin.name,
        upbitPrice,
        globalPrice,
        premium,
        marketCap: marketData?.marketCap ?? null,
        marketCapRank: marketData?.marketCapRank ?? coin.marketCapRank,
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

function getFactorDirection(factorScore: number): '과열' | '중립' | '침체' {
  if (factorScore > 0) return '과열';
  if (factorScore < 0) return '침체';
  return '중립';
}

export function getCompositeSignal(
  kimchiPremium: number,
  fundingRate: number,
  fearGreedValue: number
): CompositeSignal {
  // 김프 점수: 높으면 과열
  let kimpScore = 0;
  if (kimchiPremium > 5) kimpScore = 2;
  else if (kimchiPremium > 3) kimpScore = 1;
  else if (kimchiPremium < -1) kimpScore = -2;
  else if (kimchiPremium < 1) kimpScore = -1;

  // 펀딩비 점수: 높으면 과열
  let fundingScore = 0;
  if (fundingRate > 0.05) fundingScore = 2;
  else if (fundingRate > 0.01) fundingScore = 1;
  else if (fundingRate < -0.01) fundingScore = -2;
  else if (fundingRate < 0) fundingScore = -1;

  // 공포탐욕 점수: 높으면 과열
  let fgScore = 0;
  if (fearGreedValue > 75) fgScore = 2;
  else if (fearGreedValue > 55) fgScore = 1;
  else if (fearGreedValue < 25) fgScore = -2;
  else if (fearGreedValue < 45) fgScore = -1;

  const score = kimpScore + fundingScore + fgScore;

  const factors: SignalFactor[] = [
    { label: '김프', value: `${kimchiPremium >= 0 ? '+' : ''}${kimchiPremium.toFixed(1)}%`, direction: getFactorDirection(kimpScore) },
    { label: '펀딩비', value: `${(fundingRate * 100).toFixed(3)}%`, direction: getFactorDirection(fundingScore) },
    { label: '공포탐욕', value: `${fearGreedValue}`, direction: getFactorDirection(fgScore) },
  ];

  if (score >= 3) {
    return {
      level: '과열',
      color: 'text-red-400',
      description: '3개 지표가 동시에 과열을 가리키고 있어요. 지금 진입하면 고점 물림 위험이 있습니다.',
      score,
      factors,
    };
  } else if (score <= -3) {
    return {
      level: '침체',
      color: 'text-blue-400',
      description: '3개 지표 모두 침체 신호입니다. 분할 매수를 고려해볼 타이밍이에요.',
      score,
      factors,
    };
  }
  return {
    level: '중립',
    color: 'text-gray-400',
    description: '지표들의 방향이 엇갈려 뚜렷한 추세가 없습니다. 관망하며 변화를 지켜보세요.',
    score,
    factors,
  };
}
