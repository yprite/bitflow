import { createDecipheriv } from 'node:crypto';
import { gunzipSync, inflateRawSync, inflateSync } from 'node:zlib';
import type {
  BtcReturnsHistory,
  BtcReturnsPeriod,
  BtcReturnsRow,
  BtcReturnsSection,
} from './types';

const COINGLASS_TODAY_URL = 'https://www.coinglass.com/ko/today';
const COINGLASS_API_BASE_URL = 'https://capi.coinglass.com';
const COINGLASS_REVALIDATE_SECONDS = 60 * 60;

const SECTION_META: Record<
  BtcReturnsPeriod,
  { title: string; columns: string[] }
> = {
  monthly: {
    title: '비트코인 월간 수익률 (%)',
    columns: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  },
  quarterly: {
    title: '비트코인 분기 수익률(%)',
    columns: ['1분기', '2분기', '3분기', '4분기'],
  },
};

const COINGLASS_HISTORY_URLS: Record<BtcReturnsPeriod, string> = {
  monthly: `${COINGLASS_API_BASE_URL}/api/spot/priceChange/history?symbol=BTC&timeType=15`,
  quarterly: `${COINGLASS_API_BASE_URL}/api/spot/priceChange/history?symbol=BTC&timeType=18`,
};

interface CoinGlassEncryptedResponse {
  code?: string;
  data?: string;
  success?: boolean;
}

interface CoinGlassHistoryEntry {
  month?: number;
  quarterly?: number;
  priceChangePercent?: number | null;
}

type CoinGlassHistoryData = Record<string, CoinGlassHistoryEntry[]>;

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function inflateHexPayload(hex: string): string {
  const bytes = Buffer.from(
    Array.from(hex.matchAll(/[\da-f]{2}/gi), (match) => Number.parseInt(match[0], 16))
  );

  for (const inflate of [gunzipSync, inflateSync, inflateRawSync]) {
    try {
      return inflate(bytes).toString('utf8');
    } catch {
      // Try the next inflate strategy.
    }
  }

  throw new Error('CoinGlass payload inflate failed');
}

function stripWrappingQuotes(value: string): string {
  let normalized = value;

  if (normalized.startsWith('"')) {
    normalized = normalized.slice(1);
  }

  if (normalized.endsWith('"')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

export function extractCoinglassApiPath(url: string): string {
  const apiIndex = url.indexOf('/api');
  if (apiIndex < 0) return url;

  const queryIndex = url.indexOf('?');
  return queryIndex < 0 ? url.slice(apiIndex) : url.slice(apiIndex, queryIndex);
}

export function decryptCoinglassValue(ciphertext: string, key: string): string {
  const decipher = createDecipheriv('aes-128-ecb', Buffer.from(key, 'utf8'), null);
  decipher.setAutoPadding(true);

  const decryptedHex = Buffer.concat([
    decipher.update(ciphertext, 'base64'),
    decipher.final(),
  ]).toString('hex');

  return stripWrappingQuotes(inflateHexPayload(decryptedHex));
}

export function decryptCoinglassResponseData({
  url,
  encryptedData,
  userToken,
  cacheTs,
  responseTime,
  version,
}: {
  url: string;
  encryptedData: string;
  userToken: string;
  cacheTs: string;
  responseTime?: string | null;
  version: string;
}): string {
  const seedSource =
    version === '0'
      ? cacheTs
      : version === '2'
        ? String(responseTime ?? '')
        : extractCoinglassApiPath(url);

  const seedKey = Buffer.from(seedSource, 'utf8').toString('base64').slice(0, 16);
  const dataKey = decryptCoinglassValue(userToken, seedKey);

  return decryptCoinglassValue(encryptedData, dataKey);
}

function parseYearLabel(year: string): number | null {
  return /^\d{4}$/.test(year) ? Number.parseInt(year, 10) : null;
}

function computeMedian(values: number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return roundToTwo((sorted[middle - 1] + sorted[middle]) / 2);
}

function createYearValues(period: BtcReturnsPeriod, entries: CoinGlassHistoryEntry[]): Array<number | null> {
  const values = Array.from<number | null>({ length: SECTION_META[period].columns.length }).fill(null);

  entries.forEach((entry, index) => {
    const value = entry.priceChangePercent;
    if (typeof value !== 'number' || !Number.isFinite(value)) return;

    const resolvedIndex =
      period === 'monthly'
        ? (typeof entry.month === 'number' ? entry.month - 1 : index)
        : (typeof entry.quarterly === 'number' ? entry.quarterly - 1 : index);

    if (resolvedIndex >= 0 && resolvedIndex < values.length) {
      values[resolvedIndex] = value;
    }
  });

  return values;
}

function buildSummaryRows(rows: BtcReturnsRow[], columnCount: number): BtcReturnsRow[] {
  const averages: Array<number | null> = [];
  const medians: Array<number | null> = [];

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const numericValues = rows
      .map((row) => row.values[columnIndex])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

    if (numericValues.length === 0) {
      averages.push(null);
      medians.push(null);
      continue;
    }

    averages.push(roundToTwo(numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length));
    medians.push(computeMedian(numericValues));
  }

  return [
    { label: '평균', values: averages },
    { label: '중앙값', values: medians },
  ];
}

export function buildBtcReturnsSection(
  period: BtcReturnsPeriod,
  historyData: CoinGlassHistoryData
): BtcReturnsSection {
  const meta = SECTION_META[period];

  const rows = Object.entries(historyData)
    .map(([label, entries]) => ({ label, year: parseYearLabel(label), entries }))
    .filter(
      (entry): entry is { label: string; year: number; entries: CoinGlassHistoryEntry[] } =>
        entry.year != null && Array.isArray(entry.entries)
    )
    .sort((left, right) => right.year - left.year)
    .map<BtcReturnsRow>(({ label, entries }) => ({
      label,
      values: createYearValues(period, entries),
    }));

  return {
    period,
    title: meta.title,
    columns: meta.columns,
    rows: [...rows, ...buildSummaryRows(rows, meta.columns.length)],
  };
}

async function fetchCoinGlassJson<T>(url: string): Promise<T> {
  const cacheTs = Date.now().toString();

  const res = await fetch(url, {
    next: { revalidate: COINGLASS_REVALIDATE_SECONDS },
    headers: {
      accept: 'application/json',
      origin: 'https://www.coinglass.com',
      referer: 'https://www.coinglass.com/',
      language: 'ko',
      encryption: 'true',
      'cache-ts-v2': cacheTs,
    },
  });

  if (!res.ok) {
    throw new Error(`CoinGlass API error: ${res.status}`);
  }

  const payload = (await res.json()) as CoinGlassEncryptedResponse;
  const userToken = res.headers.get('user');

  if (typeof payload.data !== 'string' || !userToken) {
    throw new Error('CoinGlass encrypted payload is missing');
  }

  const decrypted = decryptCoinglassResponseData({
    url,
    encryptedData: payload.data,
    userToken,
    cacheTs,
    responseTime: res.headers.get('time'),
    version: res.headers.get('v') ?? '1',
  });

  return JSON.parse(decrypted) as T;
}

export async function fetchBtcReturnsHistory(): Promise<BtcReturnsHistory> {
  const [monthly, quarterly] = await Promise.all([
    fetchCoinGlassJson<CoinGlassHistoryData>(COINGLASS_HISTORY_URLS.monthly),
    fetchCoinGlassJson<CoinGlassHistoryData>(COINGLASS_HISTORY_URLS.quarterly),
  ]);

  return {
    sourceUrl: COINGLASS_TODAY_URL,
    fetchedAt: new Date().toISOString(),
    monthly: buildBtcReturnsSection('monthly', monthly),
    quarterly: buildBtcReturnsSection('quarterly', quarterly),
  };
}
