import { KimpData, FundingRateData, FearGreedData, UsdtPremiumData, BtcDominanceData, LongShortRatioData, OpenInterestData, LiquidationData, StablecoinMcapData, VolumeChangeData, CompositeSignal, SignalFactor, CoinPremium, MultiCoinKimpData, ArbitrageResult, FundingRateHistoryPoint, FearGreedHistoryPoint, TrendDirection } from './types';

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

// BTC 미결제약정 (OKX)
export async function fetchOpenInterest(): Promise<OpenInterestData> {
  try {
    const res = await fetch(
      'https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=BTC-USDT-SWAP',
      { next: { revalidate: 300 }, headers: { 'User-Agent': 'bitflow/1.0' } }
    );
    if (!res.ok) throw new Error(`OKX OI API error: ${res.status}`);

    const data = await res.json() as OkxResponse<{ oi: string; oiCcy: string; ts: string }>;
    if (data.code !== '0' || !data.data?.length) throw new Error('OKX OI no data');

    const entry = data.data[0];
    const oi = Number(entry.oi);         // 계약 수
    const oiCcy = Number(entry.oiCcy);   // BTC 기준

    // 24h 변화율은 단일 호출로 알 수 없으므로 0으로 초기화 (DayRange로 추적)
    return {
      oi,
      oiUsd: oiCcy, // BTC 단위 (카드에서 표시 변환)
      changeRate: 0,
      timestamp: new Date(Number(entry.ts)).toISOString(),
    };
  } catch (error) {
    console.error('Open interest fetch failed:', error);
    return { oi: 0, oiUsd: 0, changeRate: 0, timestamp: new Date().toISOString() };
  }
}

// BTC 청산량 (OKX - 최근 1시간)
export async function fetchLiquidation(): Promise<LiquidationData> {
  try {
    const res = await fetch(
      'https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio?instId=BTC&period=1H',
      { next: { revalidate: 300 }, headers: { 'User-Agent': 'bitflow/1.0' } }
    );

    // OKX 청산 전용 API가 인증 필요하므로 공개 API에서 추정
    // long-short ratio 변화로 간접 추정
    if (!res.ok) throw new Error(`OKX liquidation proxy error: ${res.status}`);

    const data = await res.json() as OkxResponse<[string, string, string]>;
    if (data.code !== '0' || !data.data?.length) throw new Error('no data');

    // 최근 2개 데이터로 변화 추정
    const latest = data.data[0];
    const longRatio = Number(latest[1]);
    const shortRatio = Number(latest[2]);

    // 비율 기반 추정 청산 압력
    const totalEstimate = Math.abs(longRatio - shortRatio) * 1000000; // 대략적 추정
    return {
      longLiqUsd: longRatio > shortRatio ? 0 : totalEstimate * 0.6,
      shortLiqUsd: shortRatio > longRatio ? 0 : totalEstimate * 0.6,
      totalLiqUsd: totalEstimate,
      ratio: longRatio,
      timestamp: new Date(Number(latest[0])).toISOString(),
    };
  } catch (error) {
    console.error('Liquidation fetch failed:', error);
    return { longLiqUsd: 0, shortLiqUsd: 0, totalLiqUsd: 0, ratio: 0.5, timestamp: new Date().toISOString() };
  }
}

// 스테이블코인 시가총액 (CoinGecko /global)
export async function fetchStablecoinMcap(): Promise<StablecoinMcapData> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/global', {
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'bitflow/1.0' },
    });
    if (!res.ok) throw new Error(`CoinGecko global API error: ${res.status}`);

    const json = await res.json();
    const totalMcap = json.data?.total_market_cap?.usd ?? 0;
    const mcapChange = json.data?.market_cap_change_percentage_24h_usd ?? 0;

    // 스테이블코인 = USDT + USDC 비중 추정 (전체의 ~8-10%)
    // CoinGecko global에서 직접 제공하지 않으므로 별도 호출
    const stableRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin&vs_currencies=usd&include_market_cap=true&include_24hr_change=true',
      { next: { revalidate: 300 }, headers: { 'User-Agent': 'bitflow/1.0' } }
    );

    if (!stableRes.ok) throw new Error(`CoinGecko stable API error: ${stableRes.status}`);
    const stableData = await stableRes.json() as Record<string, { usd_market_cap?: number; usd_24h_change?: number }>;

    const usdtMcap = stableData.tether?.usd_market_cap ?? 0;
    const usdcMcap = stableData['usd-coin']?.usd_market_cap ?? 0;
    const stableTotalMcap = usdtMcap + usdcMcap;

    // 가중 평균 변화율
    const usdtChange = stableData.tether?.usd_24h_change ?? 0;
    const usdcChange = stableData['usd-coin']?.usd_24h_change ?? 0;
    const weightedChange = stableTotalMcap > 0
      ? (usdtChange * usdtMcap + usdcChange * usdcMcap) / stableTotalMcap
      : 0;

    return {
      totalMcap: stableTotalMcap,
      change24h: weightedChange,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Stablecoin mcap fetch failed:', error);
    return { totalMcap: 0, change24h: 0, timestamp: new Date().toISOString() };
  }
}

// BTC 거래량 변화율 (Upbit 24h vs 7일 평균)
export async function fetchVolumeChange(): Promise<VolumeChangeData> {
  try {
    // Upbit 일봉 7일치
    const res = await fetch(
      'https://api.upbit.com/v1/candles/days?market=KRW-BTC&count=8',
      { next: { revalidate: 300 }, headers: { 'User-Agent': 'bitflow/1.0' } }
    );
    if (!res.ok) throw new Error(`Upbit candles API error: ${res.status}`);

    const candles = await res.json() as Array<{
      candle_acc_trade_volume: number;
      candle_date_time_kst: string;
    }>;

    if (candles.length < 2) throw new Error('Not enough candle data');

    const volume24h = candles[0].candle_acc_trade_volume;
    // 최근 7일 평균 (오늘 제외)
    const prev7 = candles.slice(1, 8);
    const volumeAvg7d = prev7.reduce((s, c) => s + c.candle_acc_trade_volume, 0) / prev7.length;
    const changeRate = volumeAvg7d > 0 ? ((volume24h / volumeAvg7d) - 1) * 100 : 0;

    return {
      volume24h,
      volumeAvg7d,
      changeRate,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Volume change fetch failed:', error);
    return { volume24h: 0, volumeAvg7d: 0, changeRate: 0, timestamp: new Date().toISOString() };
  }
}

// USDT 프리미엄 (Upbit USDT/KRW vs 실제 환율)
export async function fetchUsdtPremium(usdKrw?: number): Promise<UsdtPremiumData> {
  try {
    const [usdtRes, actualRate] = await Promise.all([
      fetch('https://api.upbit.com/v1/ticker?markets=KRW-USDT', {
        next: { revalidate: 15 },
        headers: { 'User-Agent': 'bitflow/1.0' },
      }),
      usdKrw ? Promise.resolve(usdKrw) : fetchUsdKrw(),
    ]);

    if (!usdtRes.ok) throw new Error(`Upbit USDT API error: ${usdtRes.status}`);
    const usdtData = await usdtRes.json();
    const usdtKrwPrice = usdtData[0].trade_price;

    const premium = ((usdtKrwPrice / actualRate) - 1) * 100;

    return {
      usdtKrwPrice,
      actualUsdKrw: actualRate,
      premium,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('USDT premium fetch failed:', error);
    return {
      usdtKrwPrice: 0,
      actualUsdKrw: 0,
      premium: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

// BTC 도미넌스 (CoinGecko /global)
export async function fetchBtcDominance(): Promise<BtcDominanceData> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/global', {
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'bitflow/1.0' },
    });

    if (!res.ok) throw new Error(`CoinGecko global API error: ${res.status}`);
    const json = await res.json();
    const data = json.data;

    return {
      dominance: data.market_cap_percentage?.btc ?? 0,
      totalMarketCap: data.total_market_cap?.usd ?? 0,
      btcMarketCap: (data.total_market_cap?.usd ?? 0) * ((data.market_cap_percentage?.btc ?? 0) / 100),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('BTC dominance fetch failed:', error);
    return {
      dominance: 0,
      totalMarketCap: 0,
      btcMarketCap: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

// 롱숏 비율 (OKX)
export async function fetchLongShortRatio(): Promise<LongShortRatioData> {
  try {
    const res = await fetch(
      'https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio?instId=BTC&period=1H',
      {
        next: { revalidate: 300 },
        headers: { 'User-Agent': 'bitflow/1.0' },
      }
    );

    if (!res.ok) throw new Error(`OKX long/short API error: ${res.status}`);

    const data = await res.json() as OkxResponse<[string, string, string]>;

    if (data.code !== '0' || !data.data || data.data.length === 0) {
      throw new Error('OKX long/short API returned no data');
    }

    // data.data[0] = [timestamp, longRatio, shortRatio]
    const [ts, longStr, shortStr] = data.data[0];
    const longRatio = Number(longStr);
    const shortRatio = Number(shortStr);

    return {
      longRatio: longRatio * 100,
      shortRatio: shortRatio * 100,
      longShortRatio: shortRatio > 0 ? longRatio / shortRatio : 1,
      timestamp: new Date(Number(ts)).toISOString(),
    };
  } catch (error) {
    console.error('Long/short ratio fetch failed:', error);
    return {
      longRatio: 50,
      shortRatio: 50,
      longShortRatio: 1,
      timestamp: new Date().toISOString(),
    };
  }
}

function getFactorDirection(factorScore: number): '과열' | '중립' | '침체' {
  if (factorScore > 0) return '과열';
  if (factorScore < 0) return '침체';
  return '중립';
}

function formatCompactBtc(value: number): string {
  if (value >= 1000) return `~${(value / 1000).toFixed(1)}k BTC`;
  if (value > 0) return `~${Math.round(value)} BTC`;
  return '~0 BTC';
}

function formatCompactUsdMillions(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toFixed(0)}`;
}

// 지표별 가중치: 시장 과열/침체 판단에 대한 영향력 차등
const FACTOR_WEIGHTS = {
  kimp: 1.5,        // 김프 - 한국 시장 고유 과열 지표로 중요
  funding: 2.0,     // 펀딩비 - 레버리지 시장의 핵심 온도계
  fearGreed: 1.5,   // 공포탐욕 - 시장 심리 대표 지표
  usdt: 1.0,        // USDT 프리미엄 - 보조 자금 흐름 지표
  dominance: 0.75,  // BTC 도미넌스 - 간접적 과열 지표
  longShort: 1.5,   // 롱숏 비율 - 포지션 편중도
  oi: 1.25,         // 미결제약정 - 레버리지 규모
  liquidation: 1.0, // 청산비율 - 후행 지표
  stablecoin: 0.75, // 스테이블코인 - 느린 자금 흐름
  volume: 0.75,     // 거래량 - 확인 지표
  strategy: 1.25,   // STRC 자본엔진 - Strategy 자금 조달 강도
} as const;

// 이전 점수를 저장하여 추세 계산에 사용
let previousScore: number | null = null;
let previousScoreTimestamp: number = 0;

export function getCompositeSignal(
  kimchiPremium: number,
  fundingRate: number,
  fearGreedValue: number,
  usdtPremium: number = 0,
  btcDominance: number = 0,
  longRatio: number = 50,
  oiChangeRate: number = 0,
  liqRatio: number = 0.5,
  stablecoinChange: number = 0,
  volumeChangeRate: number = 0,
  strategyWeeklyEstimatedBtc: number = 0,
  strategyLatestNetProceedsUsd: number = 0,
  strategyDistanceToThreshold: number = 0,
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

  // USDT 프리미엄 점수: 높으면 과열 (자금 유입 압력)
  let usdtScore = 0;
  if (usdtPremium > 1.5) usdtScore = 2;
  else if (usdtPremium > 0.5) usdtScore = 1;
  else if (usdtPremium < -0.5) usdtScore = -2;
  else if (usdtPremium < 0) usdtScore = -1;

  // BTC 도미넌스 점수: 낮으면 과열 (알트시즌 = 과열 신호)
  let domScore = 0;
  if (btcDominance > 0) {
    if (btcDominance < 52) domScore = 2;
    else if (btcDominance < 55) domScore = 1;
    else if (btcDominance > 62) domScore = -2;
    else if (btcDominance > 58) domScore = -1;
  }

  // 롱숏 비율 점수: 롱 과밀이면 과열
  let lsScore = 0;
  if (longRatio > 65) lsScore = 2;
  else if (longRatio > 55) lsScore = 1;
  else if (longRatio < 35) lsScore = -2;
  else if (longRatio < 45) lsScore = -1;

  // 미결제약정 변화율: 급증하면 과열 (레버리지 과다)
  let oiScore = 0;
  if (oiChangeRate > 15) oiScore = 2;
  else if (oiChangeRate > 5) oiScore = 1;
  else if (oiChangeRate < -15) oiScore = -2;
  else if (oiChangeRate < -5) oiScore = -1;

  // 청산 비율: 롱 청산 우세면 과열 후 조정
  let liqScore = 0;
  if (liqRatio > 0.65) liqScore = 2;
  else if (liqRatio > 0.55) liqScore = 1;
  else if (liqRatio < 0.35) liqScore = -2;
  else if (liqRatio < 0.45) liqScore = -1;

  // 스테이블코인 시총 변화: 증가하면 자금 유입 = 과열 방향
  let stableScore = 0;
  if (stablecoinChange > 1) stableScore = 2;
  else if (stablecoinChange > 0.3) stableScore = 1;
  else if (stablecoinChange < -1) stableScore = -2;
  else if (stablecoinChange < -0.3) stableScore = -1;

  // 거래량 변화율: 평균 대비 급증하면 과열
  let volScore = 0;
  if (volumeChangeRate > 100) volScore = 2;
  else if (volumeChangeRate > 30) volScore = 1;
  else if (volumeChangeRate < -50) volScore = -2;
  else if (volumeChangeRate < -20) volScore = -1;

  // STRC 자본엔진: 추정 ATM 발행량과 최신 확정 filing을 함께 반영
  let strategyScore = 0;
  if (strategyWeeklyEstimatedBtc >= 3000 || strategyLatestNetProceedsUsd >= 250_000_000) strategyScore = 2;
  else if (strategyWeeklyEstimatedBtc >= 500 || strategyLatestNetProceedsUsd >= 50_000_000) strategyScore = 1;
  else if (strategyDistanceToThreshold <= -1.5) strategyScore = -2;
  else if (strategyDistanceToThreshold < 0) strategyScore = -1;

  // 가중 점수 계산
  const rawScores = [kimpScore, fundingScore, fgScore, usdtScore, domScore, lsScore, oiScore, liqScore, stableScore, volScore, strategyScore];
  const weights = [
    FACTOR_WEIGHTS.kimp, FACTOR_WEIGHTS.funding, FACTOR_WEIGHTS.fearGreed,
    FACTOR_WEIGHTS.usdt, FACTOR_WEIGHTS.dominance, FACTOR_WEIGHTS.longShort,
    FACTOR_WEIGHTS.oi, FACTOR_WEIGHTS.liquidation, FACTOR_WEIGHTS.stablecoin,
    FACTOR_WEIGHTS.volume, FACTOR_WEIGHTS.strategy,
  ];

  const weightedScore = rawScores.reduce((sum, s, i) => sum + s * weights[i], 0);
  const maxPossibleScore = weights.reduce((sum, w) => sum + 2 * w, 0); // 각 지표 최대 ±2

  // -100 ~ +100 정규화
  const normalizedScore = Math.round((weightedScore / maxPossibleScore) * 100);

  // 추세 계산: 이전 점수와 비교
  const now = Date.now();
  const scoreChange = previousScore !== null ? normalizedScore - previousScore : 0;
  // 5분 이상 된 이전 점수는 무시
  const validPrevious = previousScore !== null && (now - previousScoreTimestamp) < 5 * 60 * 1000;
  const effectiveChange = validPrevious ? scoreChange : 0;

  let trend: TrendDirection = '보합';
  if (effectiveChange >= 15) trend = '급상승';
  else if (effectiveChange >= 5) trend = '상승';
  else if (effectiveChange <= -15) trend = '급하락';
  else if (effectiveChange <= -5) trend = '하락';

  // 현재 점수를 이전 점수로 저장
  previousScore = normalizedScore;
  previousScoreTimestamp = now;

  const factors: SignalFactor[] = [
    { label: '김프', value: `${kimchiPremium >= 0 ? '+' : ''}${kimchiPremium.toFixed(1)}%`, direction: getFactorDirection(kimpScore), weight: FACTOR_WEIGHTS.kimp, weightedScore: kimpScore * FACTOR_WEIGHTS.kimp },
    { label: '펀딩비', value: `${(fundingRate * 100).toFixed(3)}%`, direction: getFactorDirection(fundingScore), weight: FACTOR_WEIGHTS.funding, weightedScore: fundingScore * FACTOR_WEIGHTS.funding },
    { label: '공포탐욕', value: `${fearGreedValue}`, direction: getFactorDirection(fgScore), weight: FACTOR_WEIGHTS.fearGreed, weightedScore: fgScore * FACTOR_WEIGHTS.fearGreed },
    { label: 'USDT프리미엄', value: `${usdtPremium >= 0 ? '+' : ''}${usdtPremium.toFixed(2)}%`, direction: getFactorDirection(usdtScore), weight: FACTOR_WEIGHTS.usdt, weightedScore: usdtScore * FACTOR_WEIGHTS.usdt },
    { label: 'BTC도미넌스', value: `${btcDominance.toFixed(1)}%`, direction: getFactorDirection(domScore), weight: FACTOR_WEIGHTS.dominance, weightedScore: domScore * FACTOR_WEIGHTS.dominance },
    { label: '롱비율', value: `${longRatio.toFixed(1)}%`, direction: getFactorDirection(lsScore), weight: FACTOR_WEIGHTS.longShort, weightedScore: lsScore * FACTOR_WEIGHTS.longShort },
    { label: '미결제약정', value: `${oiChangeRate >= 0 ? '+' : ''}${oiChangeRate.toFixed(1)}%`, direction: getFactorDirection(oiScore), weight: FACTOR_WEIGHTS.oi, weightedScore: oiScore * FACTOR_WEIGHTS.oi },
    { label: '청산비율', value: `L${(liqRatio * 100).toFixed(0)}%`, direction: getFactorDirection(liqScore), weight: FACTOR_WEIGHTS.liquidation, weightedScore: liqScore * FACTOR_WEIGHTS.liquidation },
    { label: '스테이블', value: `${stablecoinChange >= 0 ? '+' : ''}${stablecoinChange.toFixed(2)}%`, direction: getFactorDirection(stableScore), weight: FACTOR_WEIGHTS.stablecoin, weightedScore: stableScore * FACTOR_WEIGHTS.stablecoin },
    { label: '거래량', value: `${volumeChangeRate >= 0 ? '+' : ''}${volumeChangeRate.toFixed(0)}%`, direction: getFactorDirection(volScore), weight: FACTOR_WEIGHTS.volume, weightedScore: volScore * FACTOR_WEIGHTS.volume },
    {
      label: 'STRC엔진',
      value: strategyWeeklyEstimatedBtc > 0
        ? formatCompactBtc(strategyWeeklyEstimatedBtc)
        : strategyLatestNetProceedsUsd > 0
          ? formatCompactUsdMillions(strategyLatestNetProceedsUsd)
          : `${strategyDistanceToThreshold >= 0 ? '+' : ''}${strategyDistanceToThreshold.toFixed(2)}$`,
      direction: getFactorDirection(strategyScore),
      weight: FACTOR_WEIGHTS.strategy,
      weightedScore: strategyScore * FACTOR_WEIGHTS.strategy,
    },
  ];

  // 가중치 기반으로 정렬: 영향력 큰 지표 먼저
  factors.sort((a, b) => Math.abs(b.weightedScore) - Math.abs(a.weightedScore));

  // 5단계 분류 (정규화 점수 기준)
  const base = { score: weightedScore, normalizedScore, maxPossibleScore, factors, trend, scoreChange: effectiveChange };

  if (normalizedScore >= 60) {
    return {
      ...base,
      level: '극과열',
      color: 'text-red-500',
      description: '거의 모든 지표가 극단적 과열을 나타냅니다. 고점 진입은 매우 위험하며, 포지션 축소를 강력히 권장합니다.',
    };
  } else if (normalizedScore >= 30) {
    return {
      ...base,
      level: '과열',
      color: 'text-red-400',
      description: '다수 지표가 과열을 가리키고 있어요. 신규 진입보다는 기존 포지션 관리에 집중하세요.',
    };
  } else if (normalizedScore <= -60) {
    return {
      ...base,
      level: '극침체',
      color: 'text-blue-500',
      description: '거의 모든 지표가 극단적 침체를 나타냅니다. 장기 투자 관점에서 분할 매수 적기일 수 있어요.',
    };
  } else if (normalizedScore <= -30) {
    return {
      ...base,
      level: '침체',
      color: 'text-blue-400',
      description: '다수 지표가 침체 신호입니다. 분할 매수를 고려해볼 타이밍이에요.',
    };
  }
  return {
    ...base,
    level: '중립',
    color: 'text-gray-400',
    description: '지표들의 방향이 엇갈려 뚜렷한 추세가 없습니다. 관망하며 변화를 지켜보세요.',
  };
}
