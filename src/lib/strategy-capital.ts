import type {
  StrategyCapitalConfirmation,
  StrategyCapitalData,
  StrategyCapitalEstimateDay,
  StrategyCapitalStatus,
} from './types';

const STRC_TICKER = 'STRC';
const STRC_ATM_THRESHOLD = 99.98;
const ATM_ESTIMATED_VOLUME_SHARE = 0.4;
const ATM_BROKER_FEE_RATE = 0.025;

interface StrcIntradayBar {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  session: string;
}

interface StrcIntradayDay {
  totalVolume: number;
  regularVolume: number;
  extendedVolume: number;
  bars: StrcIntradayBar[];
}

interface StrcHistoryEntry {
  date: string;
  close: number;
  high: number;
  low: number;
  volume: number;
  source: string;
}

interface StrcTickerData {
  history: StrcHistoryEntry[];
  intraday: Record<string, StrcIntradayDay>;
  summary: {
    annualizedDividend?: number;
    currentYield?: number;
    exDividendDate?: string;
  };
}

interface StrcTickerDataResponse {
  updated: string;
  btcHistory: Record<string, number>;
  tickers: Record<string, StrcTickerData>;
  marketStatus?: {
    market?: string;
    afterHours?: boolean;
    earlyHours?: boolean;
  };
}

interface StrcFilingResponse {
  success: boolean;
  filings: Array<{
    ticker: string;
    filedDate: string;
    url: string;
    period: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    sharesSold: number;
    netProceeds: number;
    btcPurchased: number | null;
    avgBtcPrice: number;
    offeringType: string;
  }>;
}

function parseDateKey(value: string): Date {
  return new Date(`${value}T12:00:00Z`);
}

function formatDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getWeekStartKey(value: string): string {
  const date = parseDateKey(value);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return formatDateKey(date);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function getStatus(currentPrice: number): StrategyCapitalStatus {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return 'unavailable';
  return currentPrice >= STRC_ATM_THRESHOLD ? 'active' : 'standby';
}

function estimateEligibleVolume(day: StrcIntradayDay, thresholdPrice: number) {
  const eligibleBars = day.bars.filter((bar) => bar.close >= thresholdPrice);
  const eligibleVolume = sum(eligibleBars.map((bar) => bar.volume));
  const regularEligibleVolume = sum(
    eligibleBars
      .filter((bar) => bar.session === 'regular')
      .map((bar) => bar.volume)
  );

  return {
    eligibleVolume,
    regularEligibleVolume,
    extendedEligibleVolume: eligibleVolume - regularEligibleVolume,
  };
}

export function estimateStrategyCapitalDay(input: {
  date: string;
  day: StrcIntradayDay;
  closePrice: number;
  btcPrice: number;
  thresholdPrice?: number;
}): StrategyCapitalEstimateDay {
  const thresholdPrice = input.thresholdPrice ?? STRC_ATM_THRESHOLD;
  const { eligibleVolume, regularEligibleVolume, extendedEligibleVolume } = estimateEligibleVolume(
    input.day,
    thresholdPrice
  );
  const estimatedAtmVolume = eligibleVolume * ATM_ESTIMATED_VOLUME_SHARE;
  const estimatedNetProceedsUsd = estimatedAtmVolume * input.closePrice * (1 - ATM_BROKER_FEE_RATE);
  const estimatedBtc = input.btcPrice > 0
    ? estimatedNetProceedsUsd / input.btcPrice
    : 0;

  return {
    date: input.date,
    closePrice: input.closePrice,
    btcPrice: input.btcPrice,
    totalVolume: input.day.totalVolume,
    eligibleVolume,
    regularEligibleVolume,
    extendedEligibleVolume,
    eligibleRatio: input.day.totalVolume > 0 ? eligibleVolume / input.day.totalVolume : 0,
    estimatedAtmVolume,
    estimatedNetProceedsUsd,
    estimatedBtc,
  };
}

function toConfirmation(filing: StrcFilingResponse['filings'][number]): StrategyCapitalConfirmation {
  const estimatedBtc = filing.avgBtcPrice > 0
    ? filing.netProceeds / filing.avgBtcPrice
    : 0;

  return {
    filedDate: filing.filedDate,
    period: filing.period,
    periodStart: filing.periodStart,
    periodEnd: filing.periodEnd,
    sharesSold: filing.sharesSold,
    netProceedsUsd: filing.netProceeds,
    avgBtcPrice: filing.avgBtcPrice,
    estimatedBtc,
    secUrl: filing.url,
  };
}

export function buildStrategyCapitalData(
  tickerData: StrcTickerDataResponse,
  filingsData: StrcFilingResponse
): StrategyCapitalData {
  const ticker = tickerData.tickers[STRC_TICKER];
  if (!ticker) {
    throw new Error('STRC ticker data not found');
  }

  const historyByDate = new Map(
    ticker.history.map((entry) => [entry.date.slice(0, 10), entry])
  );
  const intradayDates = Object.keys(ticker.intraday).sort();
  const estimateDays = intradayDates
    .map((date) => {
      const day = ticker.intraday[date];
      const closePrice =
        historyByDate.get(date)?.close ??
        day.bars.at(-1)?.close ??
        0;
      const btcPrice = tickerData.btcHistory[date] ?? 0;

      return estimateStrategyCapitalDay({
        date,
        day,
        closePrice,
        btcPrice,
      });
    })
    .filter((entry) => entry.closePrice > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  const currentDay = estimateDays[0] ?? null;
  const currentWeekKey = currentDay ? getWeekStartKey(currentDay.date) : null;
  const currentWeekDays = currentWeekKey
    ? estimateDays.filter((day) => getWeekStartKey(day.date) === currentWeekKey)
    : [];
  const latestIntradayBars = currentDay ? ticker.intraday[currentDay.date]?.bars : [];
  const currentPrice =
    latestIntradayBars?.at(-1)?.close ??
    currentDay?.closePrice ??
    ticker.history.at(-1)?.close ??
    0;

  const strcFilings = filingsData.filings
    .filter((filing) => filing.ticker === STRC_TICKER)
    .map(toConfirmation)
    .sort((a, b) => b.filedDate.localeCompare(a.filedDate));
  const latestConfirmed = strcFilings[0] ?? null;

  return {
    ticker: STRC_TICKER,
    status: getStatus(currentPrice),
    thresholdPrice: STRC_ATM_THRESHOLD,
    currentPrice,
    distanceToThreshold: currentPrice - STRC_ATM_THRESHOLD,
    currentYield: ticker.summary.currentYield ?? 0,
    annualizedDividend: ticker.summary.annualizedDividend ?? 0,
    exDividendDate: ticker.summary.exDividendDate ?? null,
    marketOpen: tickerData.marketStatus?.market === 'open',
    currentDay,
    currentWeekEstimatedBtc: sum(currentWeekDays.map((day) => day.estimatedBtc)),
    currentWeekEstimatedNetProceedsUsd: sum(currentWeekDays.map((day) => day.estimatedNetProceedsUsd)),
    recentDays: estimateDays.slice(0, 5),
    latestConfirmed,
    confirmedTotalEstimatedBtc: sum(strcFilings.map((filing) => filing.estimatedBtc)),
    confirmedTotalNetProceedsUsd: sum(strcFilings.map((filing) => filing.netProceedsUsd)),
    confirmedTotalSharesSold: sum(strcFilings.map((filing) => filing.sharesSold)),
    timestamp: tickerData.updated,
  };
}

export async function fetchStrategyCapital(): Promise<StrategyCapitalData> {
  const [tickerRes, filingsRes] = await Promise.all([
    fetch('https://strc.live/api/ticker-data', {
      next: { revalidate: 60 },
      headers: { 'User-Agent': 'bitflow/1.0' },
    }),
    fetch('https://strc.live/api/sec-filings', {
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'bitflow/1.0' },
    }),
  ]);

  if (!tickerRes.ok) {
    throw new Error(`STRC ticker API error: ${tickerRes.status}`);
  }

  if (!filingsRes.ok) {
    throw new Error(`STRC filings API error: ${filingsRes.status}`);
  }

  const tickerData = await tickerRes.json() as StrcTickerDataResponse;
  const filingsData = await filingsRes.json() as StrcFilingResponse;

  return buildStrategyCapitalData(tickerData, filingsData);
}

export {
  ATM_BROKER_FEE_RATE,
  ATM_ESTIMATED_VOLUME_SHARE,
  STRC_ATM_THRESHOLD,
};
