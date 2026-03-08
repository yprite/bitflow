import { inflateRawSync } from 'node:zlib';
import { getTagsForTheme } from '@/lib/home-preferences';
import {
  marketHomeContent,
  type MarketDirection,
  type MarketHomeContent,
  type MarketIndexCard,
  type RankingTab,
  type SparklinePoint,
  type SpotlightTheme,
  type ThemeCard,
} from '@/lib/market-home-content';

type FetchLike = typeof fetch;

type MarketHomeSection = 'indices' | 'ranking' | 'themes';

interface LiveQuote {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  averageVolume: number;
  marketTime: string | null;
}

interface IndexDefinition {
  symbol: string;
  name: string;
  tone: string;
  fallbackNote: string;
}

export interface TrackedStockDefinition {
  symbol: string;
  slug: string;
  name: string;
  theme: string;
  thesis: string;
  catalysts: string[];
}

interface ThemeDefinition {
  name: string;
  badge: string;
  accent: SpotlightTheme['accent'];
  members: string[];
  nextCatalyst: string;
  liveSummary: string;
  spotlightCta: string;
}

interface ThemeMetric {
  theme: ThemeDefinition;
  averageChange: number;
  turnover: number;
  members: LiveQuote[];
}

export interface MarketHomeSnapshotMeta {
  source: 'live' | 'fallback';
  updatedAt: string;
  liveSections: MarketHomeSection[];
  note: string;
}

export interface MarketHomeSnapshot {
  content: MarketHomeContent;
  meta: MarketHomeSnapshotMeta;
}

export interface MarketHomeDiagnostics {
  error?: string;
  indexCount: number;
  indexSymbols: string[];
  stockCount: number;
  stockSymbols: string[];
}

export interface StockPeer {
  name: string;
  slug: string;
  href: string;
  change: string;
  direction: MarketDirection;
}

export interface MarketStockPageData {
  slug: string;
  symbol: string;
  name: string;
  theme: string;
  liveStamp: string;
  source: 'live' | 'fallback';
  price: string;
  change: string;
  direction: MarketDirection;
  turnover: string;
  volumeSignal: string;
  summary: string;
  whyNow: string[];
  catalysts: string[];
  timeline: StockTimelineItem[];
  peers: StockPeer[];
  points: SparklinePoint[];
  tone: string;
}

export interface StockTimelineItem {
  id: string;
  publishedAt: string;
  displayTime?: string;
  label: string;
  title: string;
  summary: string;
  href?: string;
}

const YAHOO_QUOTE_URL = 'https://query1.finance.yahoo.com/v7/finance/quote';
const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const GOOGLE_NEWS_RSS_URL = 'https://news.google.com/rss/search';
const NAVER_STOCK_API_URL = 'https://m.stock.naver.com/api/stock';
const NAVER_INDEX_API_URL = 'https://m.stock.naver.com/api/index';
const DART_CORP_CODE_URL = 'https://opendart.fss.or.kr/api/corpCode.xml';
const DART_DISCLOSURE_LIST_URL = 'https://opendart.fss.or.kr/api/list.json';
const FETCH_TIMEOUT_MS = 4_000;
const STOCK_TIMELINE_LIMIT = 6;
const DART_LOOKBACK_DAYS = 30;

let dartCorpCodeCache: Map<string, string> | null = null;
let dartCorpCodeCachePromise: Promise<Map<string, string>> | null = null;
let dartCorpCodeCacheKey: string | null = null;

const NAVER_INDEX_SYMBOL_MAP: Record<string, string> = {
  '^KS11': 'KOSPI',
  '^KQ11': 'KOSDAQ',
};

const INDEX_DEFS: IndexDefinition[] = [
  { symbol: '^KS11', name: 'KOSPI', tone: '#F97316', fallbackNote: '대형주 수급이 장 방향을 결정합니다.' },
  { symbol: '^KQ11', name: 'KOSDAQ', tone: '#14B8A6', fallbackNote: '코스닥 변동성이 개인 심리를 자극하는 구간입니다.' },
  { symbol: 'KRW=X', name: 'USD/KRW', tone: '#60A5FA', fallbackNote: '환율 안정 여부가 외국인 수급 체감에 직접 연결됩니다.' },
];

const WATCHLIST: TrackedStockDefinition[] = [
  {
    symbol: '000660.KS',
    slug: 'sk-hynix',
    name: 'SK하이닉스',
    theme: 'HBM',
    thesis: 'HBM 리더십과 외국인 수급이 같이 붙을 때 가장 강한 시그널이 나오는 종목입니다.',
    catalysts: ['HBM 공급 계약 코멘트', 'AI 메모리 증설 뉴스'],
  },
  {
    symbol: '005930.KS',
    slug: 'samsung-electronics',
    name: '삼성전자',
    theme: 'HBM',
    thesis: '국장 전체 수급의 방향성을 보여주는 대표 대장주입니다.',
    catalysts: ['메모리 업황 코멘트', '파운드리 / HBM 업데이트'],
  },
  {
    symbol: '042700.KS',
    slug: 'hanmi-semiconductor',
    name: '한미반도체',
    theme: 'HBM',
    thesis: 'HBM 후공정 장비 기대가 붙는 날에 가장 빠르게 움직이는 장비주입니다.',
    catalysts: ['후공정 장비 수주', 'CAPEX 확대 뉴스'],
  },
  {
    symbol: '095340.KQ',
    slug: 'isc',
    name: 'ISC',
    theme: 'HBM',
    thesis: '반도체 테스트 / 소켓 수혜 스토리가 붙을 때 탄력이 큰 편입니다.',
    catalysts: ['고객사 증설', '메모리 테스트 수요 확대'],
  },
  {
    symbol: '012450.KS',
    slug: 'hanwha-aerospace',
    name: '한화에어로',
    theme: '조선 · 방산',
    thesis: '방산 수주 뉴스가 붙을 때 섹터 전체를 당기는 주도주 역할을 합니다.',
    catalysts: ['유럽 / 중동 수주', '실적 가이던스 상향'],
  },
  {
    symbol: '329180.KS',
    slug: 'hd-hyundai-heavy-industries',
    name: 'HD현대중공업',
    theme: '조선 · 방산',
    thesis: '조선 슈퍼사이클 기대가 강할 때 거래대금이 크게 몰리는 종목입니다.',
    catalysts: ['LNG선 수주', '조선업황 코멘트'],
  },
  {
    symbol: '079550.KS',
    slug: 'lig-nex1',
    name: 'LIG넥스원',
    theme: '조선 · 방산',
    thesis: '미사일 / 방공 체계 뉴스에 민감하게 반응하는 방산 모멘텀 종목입니다.',
    catalysts: ['방공 수주', '국방 예산 확대'],
  },
  {
    symbol: '042660.KS',
    slug: 'hanwha-ocean',
    name: '한화오션',
    theme: '조선 · 방산',
    thesis: '조선 사이클과 그룹 시너지 기대가 겹칠 때 강한 추세가 나옵니다.',
    catalysts: ['선박 수주', '그룹 시너지 발표'],
  },
  {
    symbol: '028260.KS',
    slug: 'samsung-ct',
    name: '삼성물산',
    theme: '자사주 소각',
    thesis: '주주환원과 지배구조 기대가 붙을 때 검색량이 크게 늘어나는 종목입니다.',
    catalysts: ['주주환원 계획', '주총 안건 공시'],
  },
  {
    symbol: '105560.KS',
    slug: 'kb-financial',
    name: 'KB금융',
    theme: '배당 · 금융',
    thesis: '밸류업과 배당 기대를 동시에 받는 대표 금융 대형주입니다.',
    catalysts: ['주총', '배당 / 자사주 발표'],
  },
  {
    symbol: '086790.KS',
    slug: 'hana-financial',
    name: '하나금융지주',
    theme: '배당 · 금융',
    thesis: '배당 및 자본정책 코멘트에 민감하게 반응하는 금융주입니다.',
    catalysts: ['배당 확대', '밸류업 공시'],
  },
  {
    symbol: '055550.KS',
    slug: 'shinhan-financial',
    name: '신한지주',
    theme: '배당 · 금융',
    thesis: '방어적인 금융 대형주로, 배당 시즌에 체류시간을 만드는 종목입니다.',
    catalysts: ['배당 기준일', '자본정책 업데이트'],
  },
  {
    symbol: '034020.KS',
    slug: 'doosan-enerbility',
    name: '두산에너빌리티',
    theme: '전력 인프라',
    thesis: '원전과 전력 인프라 스토리가 합쳐질 때 빠르게 거래가 붙습니다.',
    catalysts: ['원전 정책', '전력망 투자 발표'],
  },
  {
    symbol: '298040.KS',
    slug: 'hyosung-heavy-industries',
    name: '효성중공업',
    theme: '전력 인프라',
    thesis: '전력기기 수출 스토리로 기관 수급이 붙을 때 강세가 두드러집니다.',
    catalysts: ['변압기 수주', '전력망 투자 확대'],
  },
  {
    symbol: '010120.KS',
    slug: 'ls-electric',
    name: 'LS ELECTRIC',
    theme: '전력 인프라',
    thesis: '스마트 전력망과 자동화 설비 기대를 같이 받는 대표 수혜주입니다.',
    catalysts: ['전력망 프로젝트', '자동화 수주'],
  },
  {
    symbol: '247540.KQ',
    slug: 'ecopro-bm',
    name: '에코프로비엠',
    theme: '코스닥 레버리지',
    thesis: '코스닥 고베타 심리가 붙는 날에 가장 빠르게 변동성이 커지는 종목입니다.',
    catalysts: ['2차전지 반등', '개인 수급 집중'],
  },
];

const THEME_DEFS: ThemeDefinition[] = [
  {
    name: 'HBM',
    badge: '실시간',
    accent: 'signal',
    members: ['000660.KS', '005930.KS', '042700.KS', '095340.KQ'],
    nextCatalyst: '메모리 / AI CAPEX 코멘트',
    liveSummary: '반도체 대형주와 장비주가 함께 움직이면 장 전체 주도주 프레임이 강해집니다.',
    spotlightCta: '관련주 보기',
  },
  {
    name: '조선 · 방산',
    badge: '토론 폭발',
    accent: 'heat',
    members: ['012450.KS', '329180.KS', '079550.KS', '042660.KS'],
    nextCatalyst: '수주 공시 / 지정학 이벤트',
    liveSummary: '수주 기대가 붙는 날에는 하루 이상 이어질 가능성이 높은 대표 도파민 섹터입니다.',
    spotlightCta: '강한 종목 보기',
  },
  {
    name: '자사주 소각',
    badge: 'D-2',
    accent: 'calendar',
    members: ['028260.KS', '105560.KS', '086790.KS'],
    nextCatalyst: '주총 안건 / 자사주 공시',
    liveSummary: '3월 주총 시즌에는 기대감이 먼저 움직이고 실제 공시가 뒤따르는 경우가 많습니다.',
    spotlightCta: '일정 체크하기',
  },
  {
    name: '코스닥 레버리지',
    badge: '개인 집중',
    accent: 'heat',
    members: ['247540.KQ'],
    nextCatalyst: '장중 변동성 확대',
    liveSummary: '코스닥 고베타 종목으로 자금이 쏠리면 클릭과 토론이 동시에 커집니다.',
    spotlightCta: '변동성 보기',
  },
  {
    name: '전력 인프라',
    badge: '기관 추적',
    accent: 'signal',
    members: ['034020.KS', '298040.KS', '010120.KS'],
    nextCatalyst: '전력망 / 원전 투자 발표',
    liveSummary: '원전과 전력기기가 같은 서사로 묶일 때 중장기 성장 스토리가 강해집니다.',
    spotlightCta: '수혜주 보기',
  },
  {
    name: '배당 · 금융',
    badge: '캘린더',
    accent: 'calendar',
    members: ['105560.KS', '086790.KS', '055550.KS'],
    nextCatalyst: '배당 / 밸류업 공시',
    liveSummary: '배당과 자사주 기대는 자극은 약해도 체류시간과 신뢰를 동시에 확보하는 축입니다.',
    spotlightCta: '배당 캘린더',
  },
];

function cloneContent(): MarketHomeContent {
  const content = JSON.parse(JSON.stringify(marketHomeContent)) as MarketHomeContent;

  content.rankingTabs = content.rankingTabs.map((tab) => ({
    ...tab,
    items: tab.items.map((item) => {
      const match = WATCHLIST.find((stock) => stock.name === item.name);
      return match ? { ...item, href: item.href ?? `/stocks/${match.slug}` } : item;
    }),
  }));

  return content;
}

function toDirection(value: number): MarketDirection {
  if (value > 0.05) return 'up';
  if (value < -0.05) return 'down';
  return 'flat';
}

function formatSignedPercent(value: number): string {
  const digits = Math.abs(value) >= 10 ? 1 : 2;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

function formatNumber(value: number, digits = 2): string {
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatIndexLevel(value: number, name: string): string {
  const digits = name === 'USD/KRW' ? 2 : 2;
  return formatNumber(value, digits);
}

function formatPrice(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function formatTurnover(value: number): string {
  if (value >= 1_0000_0000_0000) {
    return `${(value / 1_0000_0000_0000).toFixed(1)}조`;
  }
  if (value >= 1_0000_0000) {
    return `${Math.round(value / 1_0000_0000).toLocaleString('ko-KR')}억`;
  }
  if (value >= 1_0000) {
    return `${Math.round(value / 1_0000).toLocaleString('ko-KR')}만`;
  }
  return Math.round(value).toLocaleString('ko-KR');
}

function formatVolumeRatio(volume: number, averageVolume: number): string {
  if (!averageVolume || averageVolume <= 0) {
    return 'LIVE';
  }

  const ratio = volume / averageVolume;
  if (!Number.isFinite(ratio)) {
    return 'LIVE';
  }

  return `거래량 ${(ratio * 100).toFixed(0)}%`;
}

function formatKst(timestamp: string): string {
  return `${new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))} KST`;
}

function formatMonthDay(timestamp: string): string {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp));

  const month = parts.find((part) => part.type === 'month')?.value ?? '--';
  const day = parts.find((part) => part.type === 'day')?.value ?? '--';
  return `${month}.${day}`;
}

function pickLatestTimestamp(quotes: LiveQuote[]): string {
  const latest = quotes
    .map((quote) => quote.marketTime)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  return latest ?? new Date().toISOString();
}

function getWatchlistDefinition(symbol: string): TrackedStockDefinition | undefined {
  return WATCHLIST.find((item) => item.symbol === symbol);
}

function getTrackedStockHref(symbol: string): string | undefined {
  const definition = getWatchlistDefinition(symbol);
  return definition ? `/stocks/${definition.slug}` : undefined;
}

export function getTrackedStockSlugs(): string[] {
  return WATCHLIST.map((item) => item.slug);
}

export function getTrackedStockBySlug(slug: string): TrackedStockDefinition | null {
  return WATCHLIST.find((item) => item.slug === slug) ?? null;
}

async function fetchJson(url: string, fetchImpl: FetchLike): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'BitFlowRadar/1.0',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url: string, fetchImpl: FetchLike): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'BitFlowRadar/1.0',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBuffer(url: string, fetchImpl: FetchLike): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'BitFlowRadar/1.0',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

function parseQuoteResponse(payload: unknown, definitions: Array<{ symbol: string; name: string }>): Record<string, LiveQuote> {
  const result = (payload as { quoteResponse?: { result?: Array<Record<string, unknown>> } })?.quoteResponse?.result ?? [];
  const nameMap = new Map(definitions.map((item) => [item.symbol, item.name]));

  return result.reduce<Record<string, LiveQuote>>((accumulator, item) => {
    const symbol = typeof item.symbol === 'string' ? item.symbol : null;
    const price = typeof item.regularMarketPrice === 'number' ? item.regularMarketPrice : null;
    const changePercent =
      typeof item.regularMarketChangePercent === 'number' ? item.regularMarketChangePercent : null;

    if (!symbol || price === null || changePercent === null) {
      return accumulator;
    }

    accumulator[symbol] = {
      symbol,
      name: nameMap.get(symbol) ?? (typeof item.shortName === 'string' ? item.shortName : symbol),
      price,
      changePercent,
      volume: typeof item.regularMarketVolume === 'number' ? item.regularMarketVolume : 0,
      averageVolume:
        typeof item.averageDailyVolume3Month === 'number'
          ? item.averageDailyVolume3Month
          : typeof item.averageDailyVolume10Day === 'number'
            ? item.averageDailyVolume10Day
            : 0,
      marketTime:
        typeof item.regularMarketTime === 'number'
          ? new Date(item.regularMarketTime * 1000).toISOString()
          : null,
    };

    return accumulator;
  }, {});
}

function parseChartResponse(payload: unknown): SparklinePoint[] {
  const result = (payload as {
    chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> };
  })?.chart?.result?.[0];

  if (!result?.timestamp?.length) {
    return [];
  }

  const closeSeries = result.indicators?.quote?.[0]?.close ?? [];

  return result.timestamp
    .map((timestamp, index) => {
      const close = closeSeries[index];
      if (typeof close !== 'number' || !Number.isFinite(close)) {
        return null;
      }

      return {
        collectedAt: new Date(timestamp * 1000).toISOString(),
        value: close,
      };
    })
    .filter((point): point is SparklinePoint => Boolean(point));
}

function extractXmlTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match?.[1]) return null;
  return match[1]
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNewsRss(xml: string, label: string): StockTimelineItem[] {
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  return itemBlocks.reduce<StockTimelineItem[]>((items, block, index) => {
      const title = extractXmlTag(block, 'title');
      const link = extractXmlTag(block, 'link');
      const description = extractXmlTag(block, 'description');
      const pubDate = extractXmlTag(block, 'pubDate');
      const parsedDate = pubDate ? Date.parse(pubDate) : Number.NaN;

      if (!title || !pubDate || Number.isNaN(parsedDate)) {
        return items;
      }

      items.push({
        id: `${label}-${index}-${decodeEntities(title)}`,
        publishedAt: new Date(parsedDate).toISOString(),
        label,
        title: decodeEntities(title),
        summary: decodeEntities(description ?? title),
        href: link ?? undefined,
      });

      return items;
    }, []);
}

function parseNumberLike(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function getDirectionSignal(source: unknown): number {
  if (typeof source === 'string') {
    if (source === '2' || source.toUpperCase() === 'RISING' || source === '상승') {
      return 1;
    }

    if (source === '5' || source.toUpperCase() === 'FALLING' || source === '하락') {
      return -1;
    }

    return 0;
  }

  if (source && typeof source === 'object') {
    if ('code' in source) {
      const codeSignal = getDirectionSignal(source.code);
      if (codeSignal !== 0) {
        return codeSignal;
      }
    }

    if ('name' in source) {
      const nameSignal = getDirectionSignal(source.name);
      if (nameSignal !== 0) {
        return nameSignal;
      }
    }

    if ('text' in source) {
      return getDirectionSignal(source.text);
    }
  }

  return 0;
}

function applyDirectionSignal(value: number | null, source: unknown): number | null {
  if (value === null) {
    return null;
  }

  const signal = getDirectionSignal(source);
  if (signal === 0) {
    return value;
  }

  return Math.abs(value) * signal;
}

function extractStockCode(symbol: string): string | null {
  const match = symbol.match(/^(\d{6})\.(?:KS|KQ)$/i);
  return match?.[1] ?? null;
}

function getNaverIndexCode(symbol: string): string | null {
  return NAVER_INDEX_SYMBOL_MAP[symbol] ?? null;
}

function parseBizDateToIso(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{8}$/.test(value)) {
    return null;
  }

  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  return new Date(`${year}-${month}-${day}T15:30:00+09:00`).toISOString();
}

function parseLocalDateToIso(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T15:30:00+09:00`).toISOString();
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function parseNaverPriceSeries(payload: unknown): SparklinePoint[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((row) => {
      if (!row || typeof row !== 'object') {
        return null;
      }

      const dateSource = 'localTradedAt' in row ? row.localTradedAt : null;
      const closeSource = 'closePrice' in row ? row.closePrice : null;
      const collectedAt = parseLocalDateToIso(dateSource);
      const value = parseNumberLike(closeSource);

      if (!collectedAt || value === null) {
        return null;
      }

      return {
        collectedAt,
        value,
      };
    })
    .filter((point): point is SparklinePoint => Boolean(point))
    .reverse();
}

async function fetchNaverStockQuote(
  definition: { symbol: string; name: string },
  fetchImpl: FetchLike
): Promise<LiveQuote | null> {
  const stockCode = extractStockCode(definition.symbol);
  if (!stockCode) {
    return null;
  }

  try {
    const payload = (await fetchJson(`${NAVER_STOCK_API_URL}/${stockCode}/integration`, fetchImpl)) as {
      closePrice?: string;
      compareToPreviousClosePrice?: string;
      fluctuationsRatio?: string;
      compareToPreviousPrice?: unknown;
      dealTrendInfos?: Array<Record<string, unknown>>;
    };
    const latestTrend = payload.dealTrendInfos?.[0];
    const price = parseNumberLike(payload.closePrice ?? latestTrend?.closePrice);
    const compareSignal = payload.compareToPreviousPrice ?? latestTrend?.compareToPreviousPrice;
    const compareAmount = applyDirectionSignal(
      parseNumberLike(payload.compareToPreviousClosePrice ?? latestTrend?.compareToPreviousClosePrice),
      compareSignal
    );
    const changePercentFromRatio = applyDirectionSignal(
      parseNumberLike(payload.fluctuationsRatio ?? latestTrend?.fluctuationsRatio),
      compareSignal
    );
    const previousClose =
      price !== null && compareAmount !== null ? price - compareAmount : null;
    const changePercent =
      changePercentFromRatio ??
      (price !== null && compareAmount !== null && previousClose && previousClose !== 0
        ? (compareAmount / previousClose) * 100
        : null);
    const volumes = (payload.dealTrendInfos ?? [])
      .map((item) => parseNumberLike(item.accumulatedTradingVolume))
      .filter((value): value is number => value !== null && value > 0);

    if (price === null || changePercent === null) {
      return null;
    }

    const volume = volumes[0] ?? 0;
    const averageVolume =
      volumes.length > 1
        ? volumes.slice(1).reduce((sum, item) => sum + item, 0) / (volumes.length - 1)
        : volume;

    return {
      symbol: definition.symbol,
      name: definition.name,
      price,
      changePercent,
      volume,
      averageVolume,
      marketTime: parseBizDateToIso(latestTrend?.bizdate) ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function fetchNaverIndexQuote(
  definition: { symbol: string; name: string },
  fetchImpl: FetchLike
): Promise<LiveQuote | null> {
  const indexCode = getNaverIndexCode(definition.symbol);
  if (!indexCode) {
    return null;
  }

  try {
    const payload = (await fetchJson(`${NAVER_INDEX_API_URL}/${indexCode}/basic`, fetchImpl)) as {
      closePrice?: string;
      fluctuationsRatio?: string;
      compareToPreviousPrice?: unknown;
      localTradedAt?: string;
    };

    const price = parseNumberLike(payload.closePrice);
    const changePercent = applyDirectionSignal(parseNumberLike(payload.fluctuationsRatio), payload.compareToPreviousPrice);

    if (price === null || changePercent === null) {
      return null;
    }

    return {
      symbol: definition.symbol,
      name: definition.name,
      price,
      changePercent,
      volume: 0,
      averageVolume: 0,
      marketTime: parseLocalDateToIso(payload.localTradedAt) ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function fetchNaverPriceSeries(
  symbol: string,
  fetchImpl: FetchLike,
  options: { pageSize: number }
): Promise<SparklinePoint[]> {
  const stockCode = extractStockCode(symbol);
  if (stockCode) {
    try {
      const payload = await fetchJson(`${NAVER_STOCK_API_URL}/${stockCode}/price?pageSize=${options.pageSize}`, fetchImpl);
      return parseNaverPriceSeries(payload);
    } catch {
      return [];
    }
  }

  const indexCode = getNaverIndexCode(symbol);
  if (!indexCode) {
    return [];
  }

  try {
    const payload = await fetchJson(`${NAVER_INDEX_API_URL}/${indexCode}/price?pageSize=${options.pageSize}`, fetchImpl);
    return parseNaverPriceSeries(payload);
  } catch {
    return [];
  }
}

function formatDartQueryDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
}

function parseDartPublishedAt(dateText: string): string | null {
  if (!/^\d{8}$/.test(dateText)) {
    return null;
  }

  const year = dateText.slice(0, 4);
  const month = dateText.slice(4, 6);
  const day = dateText.slice(6, 8);
  return new Date(`${year}-${month}-${day}T09:00:00+09:00`).toISOString();
}

function findEndOfCentralDirectoryOffset(buffer: Buffer): number {
  const minimumOffset = Math.max(0, buffer.length - 0xffff - 22);

  for (let index = buffer.length - 22; index >= minimumOffset; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      return index;
    }
  }

  return -1;
}

function unzipFirstFile(buffer: Buffer): Buffer {
  if (buffer.length < 4 || buffer.readUInt32LE(0) !== 0x04034b50) {
    return buffer;
  }

  const eocdOffset = findEndOfCentralDirectoryOffset(buffer);
  if (eocdOffset < 0) {
    throw new Error('Invalid ZIP payload');
  }

  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  if (buffer.readUInt32LE(centralDirectoryOffset) !== 0x02014b50) {
    throw new Error('Missing ZIP central directory');
  }

  const compressionMethod = buffer.readUInt16LE(centralDirectoryOffset + 10);
  const compressedSize = buffer.readUInt32LE(centralDirectoryOffset + 20);
  const localHeaderOffset = buffer.readUInt32LE(centralDirectoryOffset + 42);

  if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
    throw new Error('Missing ZIP local header');
  }

  const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const payloadStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
  const compressed = buffer.subarray(payloadStart, payloadStart + compressedSize);

  if (compressionMethod === 0) {
    return Buffer.from(compressed);
  }

  if (compressionMethod === 8) {
    return inflateRawSync(compressed);
  }

  throw new Error(`Unsupported ZIP compression: ${compressionMethod}`);
}

function parseDartCorpCodeXml(xml: string): Map<string, string> {
  const entries = new Map<string, string>();
  const listBlocks = xml.match(/<list>[\s\S]*?<\/list>/gi) ?? [];

  for (const block of listBlocks) {
    const stockCode = extractXmlTag(block, 'stock_code');
    const corpCode = extractXmlTag(block, 'corp_code');

    if (!stockCode || !corpCode || !/^\d{6}$/.test(stockCode)) {
      continue;
    }

    entries.set(stockCode, corpCode);
  }

  return entries;
}

async function fetchDartCorpCodeMap(fetchImpl: FetchLike): Promise<Map<string, string>> {
  const apiKey = process.env.DART_API_KEY?.trim();
  if (!apiKey) {
    return new Map();
  }

  const useCache = fetchImpl === fetch;
  if (useCache && dartCorpCodeCache && dartCorpCodeCacheKey === apiKey) {
    return dartCorpCodeCache;
  }

  const load = async () => {
    const archive = await fetchBuffer(`${DART_CORP_CODE_URL}?crtfc_key=${encodeURIComponent(apiKey)}`, fetchImpl);
    const xml = unzipFirstFile(archive).toString('utf8');
    const entries = parseDartCorpCodeXml(xml);

    if (!entries.size) {
      throw new Error('Empty DART corp code payload');
    }

    return entries;
  };

  if (!useCache) {
    return load();
  }

  if (!dartCorpCodeCachePromise || dartCorpCodeCacheKey !== apiKey) {
    dartCorpCodeCacheKey = apiKey;
    dartCorpCodeCachePromise = load()
      .then((entries) => {
        dartCorpCodeCache = entries;
        return entries;
      })
      .catch((error) => {
        dartCorpCodeCache = null;
        dartCorpCodeCacheKey = null;
        throw error;
      })
      .finally(() => {
        dartCorpCodeCachePromise = null;
      });
  }

  return dartCorpCodeCachePromise;
}

function parseDartDisclosureList(payload: unknown, definition: TrackedStockDefinition): StockTimelineItem[] {
  const response = payload as {
    status?: string;
    message?: string;
    list?: Array<Record<string, unknown>>;
  };

  if (response.status === '013') {
    return [];
  }

  if (response.status !== '000') {
    throw new Error(response.message ?? `Unexpected DART status: ${response.status ?? 'unknown'}`);
  }

  return (response.list ?? []).reduce<StockTimelineItem[]>((items, row, index) => {
    const reportName = typeof row.report_nm === 'string' ? row.report_nm.trim() : null;
    const receiptNo = typeof row.rcept_no === 'string' ? row.rcept_no.trim() : null;
    const receiptDate = typeof row.rcept_dt === 'string' ? row.rcept_dt.trim() : null;
    const filerName = typeof row.flr_nm === 'string' ? row.flr_nm.trim() : null;
    const publishedAt = receiptDate ? parseDartPublishedAt(receiptDate) : null;

    if (!reportName || !receiptNo || !publishedAt) {
      return items;
    }

    items.push({
      id: `dart-${receiptNo}-${index}`,
      publishedAt,
      displayTime: formatMonthDay(publishedAt),
      label: 'DART',
      title: reportName.startsWith(definition.name) ? reportName : `${definition.name} ${reportName}`,
      summary: filerName
        ? `${filerName}가 제출한 공식 공시입니다.`
        : `${definition.name} 관련 공식 공시입니다.`,
      href: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${receiptNo}`,
    });

    return items;
  }, []);
}

function timelinePriority(label: string): number {
  switch (label) {
    case 'DART':
      return 0;
    case 'NEWS':
      return 1;
    case 'DISCLOSURE':
      return 2;
    default:
      return 3;
  }
}

function mergeTimelineItems(items: StockTimelineItem[]): StockTimelineItem[] {
  const deduped = items.filter(
    (item, index, array) =>
      array.findIndex(
        (candidate) => candidate.id === item.id || (candidate.title === item.title && candidate.label === item.label)
      ) === index
  );

  return deduped.sort((left, right) => {
    const timeDelta = Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
    if (timeDelta !== 0) {
      return timeDelta;
    }

    return timelinePriority(left.label) - timelinePriority(right.label);
  });
}

async function fetchGoogleTimeline(
  definition: TrackedStockDefinition,
  label: string,
  query: string,
  fetchImpl: FetchLike
): Promise<StockTimelineItem[]> {
  try {
    const xml = await fetchText(
      `${GOOGLE_NEWS_RSS_URL}?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`,
      fetchImpl
    );

    return parseNewsRss(xml, label)
      .filter((item) => item.title.includes(definition.name))
      .slice(0, STOCK_TIMELINE_LIMIT);
  } catch {
    return [];
  }
}

async function fetchDartDisclosureTimeline(
  definition: TrackedStockDefinition,
  fetchImpl: FetchLike
): Promise<StockTimelineItem[]> {
  const apiKey = process.env.DART_API_KEY?.trim();
  const stockCode = extractStockCode(definition.symbol);

  if (!apiKey || !stockCode) {
    return [];
  }

  try {
    const corpCodeMap = await fetchDartCorpCodeMap(fetchImpl);
    const corpCode = corpCodeMap.get(stockCode);

    if (!corpCode) {
      return [];
    }

    const endDate = new Date();
    const beginDate = new Date(endDate.getTime() - DART_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const payload = await fetchJson(
      `${DART_DISCLOSURE_LIST_URL}?crtfc_key=${encodeURIComponent(apiKey)}&corp_code=${encodeURIComponent(
        corpCode
      )}&bgn_de=${formatDartQueryDate(beginDate)}&end_de=${formatDartQueryDate(endDate)}&page_count=${STOCK_TIMELINE_LIMIT}&sort=date&sort_mth=desc`,
      fetchImpl
    );

    return parseDartDisclosureList(payload, definition).slice(0, STOCK_TIMELINE_LIMIT);
  } catch {
    return [];
  }
}

async function fetchStockTimeline(definition: TrackedStockDefinition, fetchImpl: FetchLike): Promise<StockTimelineItem[]> {
  const [newsTimeline, dartTimeline] = await Promise.all([
    fetchGoogleTimeline(definition, 'NEWS', `${definition.name} 주식`, fetchImpl),
    fetchDartDisclosureTimeline(definition, fetchImpl),
  ]);

  const fallbackDisclosureTimeline =
    dartTimeline.length === 0
      ? await fetchGoogleTimeline(definition, 'DISCLOSURE', `${definition.name} 공시`, fetchImpl)
      : [];

  return mergeTimelineItems([...dartTimeline, ...fallbackDisclosureTimeline, ...newsTimeline]).slice(0, STOCK_TIMELINE_LIMIT);
}

async function fetchQuotes(definitions: Array<{ symbol: string; name: string }>, fetchImpl: FetchLike): Promise<Record<string, LiveQuote>> {
  const symbols = definitions.map((item) => item.symbol).join(',');
  const yahooQuotes: Record<string, LiveQuote> = await fetchJson(`${YAHOO_QUOTE_URL}?symbols=${encodeURIComponent(symbols)}`, fetchImpl)
    .then((payload) => parseQuoteResponse(payload, definitions))
    .catch(() => ({} as Record<string, LiveQuote>));
  const missingDefinitions = definitions.filter((definition) => !yahooQuotes[definition.symbol]);

  if (!missingDefinitions.length) {
    return yahooQuotes;
  }

  const naverQuotes = await Promise.all(
    missingDefinitions.map(async (definition) => {
      const quote =
        (await fetchNaverStockQuote(definition, fetchImpl)) ??
        (await fetchNaverIndexQuote(definition, fetchImpl));

      return quote ? [definition.symbol, quote] as const : null;
    })
  );

  return {
    ...yahooQuotes,
    ...Object.fromEntries(naverQuotes.filter((entry): entry is readonly [string, LiveQuote] => Boolean(entry))),
  };
}

async function fetchCharts(definitions: IndexDefinition[], fetchImpl: FetchLike): Promise<Record<string, SparklinePoint[]>> {
  const entries = await Promise.all(
    definitions.map(async (definition) => {
      try {
        const payload = await fetchJson(
          `${YAHOO_CHART_URL}/${encodeURIComponent(definition.symbol)}?interval=15m&range=1d&includePrePost=false`,
          fetchImpl
        );
        return [definition.name, parseChartResponse(payload)] as const;
      } catch {
        return [definition.name, await fetchNaverPriceSeries(definition.symbol, fetchImpl, { pageSize: 20 })] as const;
      }
    })
  );

  return Object.fromEntries(entries);
}

function buildThemeMetrics(stockQuotes: Record<string, LiveQuote>): ThemeMetric[] {
  return THEME_DEFS.map((theme) => {
    const members = theme.members
      .map((symbol) => stockQuotes[symbol])
      .filter((quote): quote is LiveQuote => Boolean(quote));

    const averageChange =
      members.length > 0 ? members.reduce((sum, quote) => sum + quote.changePercent, 0) / members.length : 0;
    const turnover = members.reduce((sum, quote) => sum + quote.price * quote.volume, 0);

    return {
      theme,
      averageChange,
      turnover,
      members: members.sort((left, right) => right.changePercent - left.changePercent),
    };
  });
}

function buildIndices(
  fallback: MarketHomeContent,
  indexQuotes: Record<string, LiveQuote>,
  charts: Record<string, SparklinePoint[]>
): MarketIndexCard[] {
  return INDEX_DEFS.map((definition) => {
    const quote = indexQuotes[definition.symbol];
    const fallbackCard = fallback.indices.find((item) => item.name === definition.name);

    if (!quote || !fallbackCard) {
      return fallbackCard ?? {
        name: definition.name,
        level: '-',
        change: '0.00%',
        direction: 'flat',
        note: definition.fallbackNote,
        tone: definition.tone,
        points: [],
      };
    }

    const topTheme = getWatchlistDefinition(
      Object.values(indexQuotes)
        .filter((item) => item.symbol !== definition.symbol)
        .sort((left, right) => right.changePercent - left.changePercent)[0]?.symbol ?? ''
    );

    return {
      name: definition.name,
      level: formatIndexLevel(quote.price, definition.name),
      change: formatSignedPercent(quote.changePercent),
      direction: toDirection(quote.changePercent),
      note: topTheme ? `${topTheme.theme} 흐름이 반영되는 장세` : definition.fallbackNote,
      tone: definition.tone,
      points: charts[definition.name]?.length ? charts[definition.name] : fallbackCard.points,
    };
  });
}

function buildDynamicRankingTabs(
  fallback: RankingTab[],
  stockQuotes: Record<string, LiveQuote>
): RankingTab[] {
  const quotes = Object.values(stockQuotes).filter((quote) => Number.isFinite(quote.changePercent));

  if (!quotes.length) {
    return fallback;
  }

  const topGainers = quotes
    .slice()
    .sort((left, right) => right.changePercent - left.changePercent)
    .slice(0, 5)
    .map((quote, index) => ({
      rank: index + 1,
      name: quote.name,
      price: formatPrice(quote.price),
      change: formatSignedPercent(quote.changePercent),
      direction: toDirection(quote.changePercent),
      reason: `${getWatchlistDefinition(quote.symbol)?.theme ?? '관심 섹터'} 강세`,
      signal: formatVolumeRatio(quote.volume, quote.averageVolume),
      href: `/stocks/${getWatchlistDefinition(quote.symbol)?.slug ?? ''}`,
      tags: getTagsForTheme(getWatchlistDefinition(quote.symbol)?.theme ?? ''),
    }));

  const topTurnover = quotes
    .slice()
    .sort((left, right) => right.price * right.volume - left.price * left.volume)
    .slice(0, 5)
    .map((quote, index) => ({
      rank: index + 1,
      name: quote.name,
      price: formatPrice(quote.price),
      change: formatSignedPercent(quote.changePercent),
      direction: toDirection(quote.changePercent),
      reason: `${getWatchlistDefinition(quote.symbol)?.theme ?? '관심 섹터'}에서 자금 집중`,
      signal: formatTurnover(quote.price * quote.volume),
      href: `/stocks/${getWatchlistDefinition(quote.symbol)?.slug ?? ''}`,
      tags: getTagsForTheme(getWatchlistDefinition(quote.symbol)?.theme ?? ''),
    }));

  const eventWatchlist = fallback
    .find((tab) => tab.label === '내일도 볼 이유')
    ?.items.map((item, index) => {
      const match = WATCHLIST.find((stock) => stock.name === item.name);
      const quote = match ? stockQuotes[match.symbol] : null;

      if (!quote || !match) {
        return {
          ...item,
          rank: index + 1,
        };
      }

      return {
        ...item,
        rank: index + 1,
        price: formatPrice(quote.price),
        change: formatSignedPercent(quote.changePercent),
        direction: toDirection(quote.changePercent),
        href: item.href ?? `/stocks/${match.slug}`,
      };
    });

  return fallback.map((tab) => {
    if (tab.label === '왜 오름') {
      return {
        ...tab,
        items: topGainers,
      };
    }

    if (tab.label === '돈 붙는 곳') {
      return {
        ...tab,
        items: topTurnover,
      };
    }

    if (tab.label === '내일도 볼 이유' && eventWatchlist?.length) {
      return {
        ...tab,
        items: eventWatchlist,
      };
    }

    return tab;
  });
}

function buildThemes(fallback: ThemeCard[], themeMetrics: ThemeMetric[]): ThemeCard[] {
  return fallback.map((card) => {
    const metric = themeMetrics.find((item) => item.theme.name === card.name);

    if (!metric || metric.members.length === 0) {
      return card;
    }

    const leaders = metric.members.slice(0, 3).map((item) => item.name);
    const leader = metric.members[0];

    return {
      ...card,
      badge: metric.theme.badge,
      averageReturn: formatSignedPercent(metric.averageChange),
      turnover: formatTurnover(metric.turnover),
      summary: `${metric.theme.liveSummary} 현재 선두는 ${leader.name} ${formatSignedPercent(leader.changePercent)}입니다.`,
      nextCatalyst: metric.theme.nextCatalyst,
      tickers: leaders.length > 0 ? leaders : card.tickers,
      direction: toDirection(metric.averageChange),
      tags: getTagsForTheme(metric.theme.name),
    };
  });
}

function buildSpotlightThemes(themeMetrics: ThemeMetric[], fallback: SpotlightTheme[]): SpotlightTheme[] {
  const liveThemes = themeMetrics
    .filter((metric) => metric.members.length > 0)
    .sort((left, right) => right.averageChange - left.averageChange)
    .slice(0, 3)
    .map((metric) => ({
      badge: 'LIVE',
      title: metric.theme.name,
      summary: `${metric.theme.liveSummary} 현재 가장 강한 종목은 ${metric.members[0].name}입니다.`,
      momentum: `평균 ${formatSignedPercent(metric.averageChange)}`,
      flow: `거래대금 ${formatTurnover(metric.turnover)}`,
      relatedTickers: metric.members.slice(0, 3).map((item) => item.name),
      cta: metric.theme.spotlightCta,
      accent: metric.theme.accent,
      tags: getTagsForTheme(metric.theme.name),
    }));

  return liveThemes.length === 3 ? liveThemes : fallback;
}

function findRankingReason(content: MarketHomeContent, name: string): string | null {
  for (const tab of content.rankingTabs) {
    const match = tab.items.find((item) => item.name === name);
    if (match?.reason) {
      return match.reason;
    }
  }

  return null;
}

function buildPulse(content: MarketHomeContent, stockQuotes: Record<string, LiveQuote>, themeMetrics: ThemeMetric[]): MarketHomeContent['pulse'] {
  const topGainer = Object.values(stockQuotes).sort((left, right) => right.changePercent - left.changePercent)[0];
  const topTurnover = Object.values(stockQuotes).sort((left, right) => right.price * right.volume - left.price * left.volume)[0];
  const liveThemes = themeMetrics
    .filter((metric) => metric.members.length > 0)
    .sort((left, right) => right.averageChange - left.averageChange);
  const nextSchedule = content.schedule[0];

  const primaryTheme = liveThemes[0]?.theme.name ?? 'HBM';
  const secondaryTheme = liveThemes[1]?.theme.name ?? '조선 · 방산';
  const topGainerReason = topGainer ? findRankingReason(content, topGainer.name) : null;
  const topTurnoverReason = topTurnover ? findRankingReason(content, topTurnover.name) : null;

  return {
    eyebrow: '30-SECOND MARKET RADAR',
    title: `${primaryTheme}가 장을 주도하고 ${secondaryTheme}가 추격하는 장`,
    summary:
      '실시간 시세와 편집 데이터를 섞어 지금 붙는 종목, 왜 붙는지, 내일까지 이어질 이벤트를 한 화면에서 정리합니다.',
    stats: [
      {
        label: '지금 가장 센 종목',
        value: topGainer ? `${topGainer.name} ${formatSignedPercent(topGainer.changePercent)}` : content.pulse.stats[0]?.value ?? '-',
        caption:
          topGainerReason ??
          content.pulse.stats[0]?.caption ??
          '상승 이유가 바로 읽히는 종목부터 보는 것이 첫 클릭 전환에 유리합니다.',
        cta: content.pulse.stats[0]?.cta ?? '왜 오르는지 보기',
        href: topGainer ? getTrackedStockHref(topGainer.symbol) ?? content.pulse.stats[0]?.href : content.pulse.stats[0]?.href,
      },
      {
        label: '지금 돈이 붙는 종목',
        value: topTurnover
          ? `${topTurnover.name} ${formatTurnover(topTurnover.price * topTurnover.volume)}`
          : content.pulse.stats[1]?.value ?? '-',
        caption:
          topTurnoverReason ??
          content.pulse.stats[1]?.caption ??
          '거래대금이 붙는 종목은 장중 내내 다시 확인할 이유를 만듭니다.',
        cta: content.pulse.stats[1]?.cta ?? '수급 포인트 보기',
        href: topTurnover ? getTrackedStockHref(topTurnover.symbol) ?? content.pulse.stats[1]?.href : content.pulse.stats[1]?.href,
      },
      {
        label: '내일까지 볼 이벤트',
        value: nextSchedule ? `${nextSchedule.title} ${nextSchedule.time}` : content.pulse.stats[2]?.value ?? '-',
        caption:
          nextSchedule?.summary ??
          content.pulse.stats[2]?.caption ??
          '내일 일정은 오늘 강한 테마가 이어질지 끊길지 판단하는 가장 빠른 힌트입니다.',
        cta: content.pulse.stats[2]?.cta ?? '일정 먼저 보기',
        href: content.pulse.stats[2]?.href ?? '#schedule',
      },
    ],
    tickers: Object.values(stockQuotes)
      .sort((left, right) => right.changePercent - left.changePercent)
      .slice(0, 6)
      .map((quote) => quote.name),
  };
}

function buildBriefing(indices: MarketIndexCard[], themeMetrics: ThemeMetric[], stockQuotes: Record<string, LiveQuote>, fallback: string): string {
  if (!indices.length || !themeMetrics.length || !Object.keys(stockQuotes).length) {
    return fallback;
  }

  const kospi = indices.find((item) => item.name === 'KOSPI');
  const kosdaq = indices.find((item) => item.name === 'KOSDAQ');
  const topTheme = themeMetrics
    .filter((metric) => metric.members.length > 0)
    .sort((left, right) => right.averageChange - left.averageChange)[0];
  const topTurnover = Object.values(stockQuotes).sort((left, right) => right.price * right.volume - left.price * left.volume)[0];

  if (!topTheme || !topTurnover) {
    return fallback;
  }

  return `${kospi?.name ?? 'KOSPI'} ${kospi?.change ?? ''}, ${kosdaq?.name ?? 'KOSDAQ'} ${kosdaq?.change ?? ''}. 현재는 ${topTheme.theme.name}가 평균 ${formatSignedPercent(
    topTheme.averageChange
  )}로 가장 강하고, 거래대금은 ${topTurnover.name}에 집중되고 있습니다.`;
}

export function getFallbackMarketHomeSnapshot(): MarketHomeSnapshot {
  const updatedAt = new Date().toISOString();

  return {
    content: {
      ...cloneContent(),
      liveStamp: formatKst(updatedAt),
    },
    meta: {
      source: 'fallback',
      updatedAt,
      liveSections: [],
      note: '편집 데이터만 표시 중입니다. 실시간 시세 연결에 실패하면 이 상태로 안전하게 동작합니다.',
    },
  };
}

export function buildLiveMarketHomeSnapshot(params: {
  content: MarketHomeContent;
  indexQuotes: Record<string, LiveQuote>;
  indexCharts: Record<string, SparklinePoint[]>;
  stockQuotes: Record<string, LiveQuote>;
}): MarketHomeSnapshot {
  const themeMetrics = buildThemeMetrics(params.stockQuotes);
  const liveTimestamp = pickLatestTimestamp([
    ...Object.values(params.indexQuotes),
    ...Object.values(params.stockQuotes),
  ]);
  const content: MarketHomeContent = {
    ...params.content,
    liveStamp: formatKst(liveTimestamp),
    indices: buildIndices(params.content, params.indexQuotes, params.indexCharts),
    rankingTabs: buildDynamicRankingTabs(params.content.rankingTabs, params.stockQuotes),
    themes: buildThemes(params.content.themes, themeMetrics),
    spotlightThemes: buildSpotlightThemes(themeMetrics, params.content.spotlightThemes),
  };

  content.pulse = buildPulse(content, params.stockQuotes, themeMetrics);
  content.briefing = buildBriefing(content.indices, themeMetrics, params.stockQuotes, params.content.briefing);

  return {
    content,
    meta: {
      source: 'live',
      updatedAt: liveTimestamp,
      liveSections: ['indices', 'ranking', 'themes'],
      note: '실시간 반영: 지수, 왜 오름, 돈 붙는 곳, 테마. 편집 유지: 내일도 볼 이유, 일정, 분석.',
    },
  };
}

export async function fetchMarketHomeSnapshot(fetchImpl: FetchLike = fetch): Promise<MarketHomeSnapshot> {
  const fallback = cloneContent();

  try {
    const [indexQuotes, stockQuotes, indexCharts] = await Promise.all([
      fetchQuotes(INDEX_DEFS, fetchImpl),
      fetchQuotes(WATCHLIST, fetchImpl),
      fetchCharts(INDEX_DEFS, fetchImpl),
    ]);

    if (Object.keys(indexQuotes).length < 2 || Object.keys(stockQuotes).length < 5) {
      return getFallbackMarketHomeSnapshot();
    }

    return buildLiveMarketHomeSnapshot({
      content: fallback,
      indexQuotes,
      indexCharts,
      stockQuotes,
    });
  } catch {
    return getFallbackMarketHomeSnapshot();
  }
}

export async function fetchMarketHomeDiagnostics(fetchImpl: FetchLike = fetch): Promise<MarketHomeDiagnostics> {
  try {
    const [indexQuotes, stockQuotes] = await Promise.all([
      fetchQuotes(INDEX_DEFS, fetchImpl),
      fetchQuotes(WATCHLIST, fetchImpl),
    ]);

    return {
      indexCount: Object.keys(indexQuotes).length,
      indexSymbols: Object.keys(indexQuotes),
      stockCount: Object.keys(stockQuotes).length,
      stockSymbols: Object.keys(stockQuotes),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'unknown error',
      indexCount: 0,
      indexSymbols: [],
      stockCount: 0,
      stockSymbols: [],
    };
  }
}

async function fetchChartSeries(
  symbol: string,
  fetchImpl: FetchLike,
  options: { interval: string; range: string }
): Promise<SparklinePoint[]> {
  try {
    const payload = await fetchJson(
      `${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}?interval=${encodeURIComponent(options.interval)}&range=${encodeURIComponent(
        options.range
      )}&includePrePost=false`,
      fetchImpl
    );
    return parseChartResponse(payload);
  } catch {
    return fetchNaverPriceSeries(symbol, fetchImpl, { pageSize: 5 });
  }
}

function buildFallbackTimeline(definition: TrackedStockDefinition): StockTimelineItem[] {
  const now = Date.now();

  return [
    {
      id: `${definition.slug}-watch-now`,
      publishedAt: new Date(now).toISOString(),
      label: 'WATCH',
      title: `${definition.name} 현재 체크 포인트`,
      summary: `${definition.theme} 안에서 거래대금과 강도를 같이 보면서 진입 타이밍을 구분해야 합니다.`,
    },
    {
      id: `${definition.slug}-catalyst-1`,
      publishedAt: new Date(now - 60 * 60 * 1000).toISOString(),
      label: 'CHECK',
      title: definition.catalysts[0] ?? `${definition.theme} 이벤트`,
      summary: `${definition.name}는 ${definition.catalysts[0] ?? '다음 이벤트'}가 붙을 때 움직임이 커질 수 있습니다.`,
    },
    {
      id: `${definition.slug}-catalyst-2`,
      publishedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      label: 'CHECK',
      title: definition.catalysts[1] ?? `${definition.theme} 수급 점검`,
      summary: `뉴스나 공시가 없어도 ${definition.theme} 강도와 거래량 비율은 계속 추적할 가치가 있습니다.`,
    },
  ];
}

async function fetchNewsTimeline(definition: TrackedStockDefinition, fetchImpl: FetchLike): Promise<StockTimelineItem[]> {
  return fetchStockTimeline(definition, fetchImpl);
}

export async function fetchTrackedStockPageData(
  slug: string,
  fetchImpl: FetchLike = fetch
): Promise<MarketStockPageData | null> {
  const definition = getTrackedStockBySlug(slug);
  if (!definition) return null;

  try {
    const sameTheme = WATCHLIST.filter((item) => item.theme === definition.theme);
    const [quotes, points, timeline] = await Promise.all([
      fetchQuotes(sameTheme, fetchImpl),
      fetchChartSeries(definition.symbol, fetchImpl, { interval: '30m', range: '5d' }).catch(() => []),
      fetchNewsTimeline(definition, fetchImpl),
    ]);

    const current = quotes[definition.symbol];
    if (!current) {
      throw new Error('Missing live quote');
    }

    const peers = Object.values(quotes)
      .filter((quote) => quote.symbol !== definition.symbol)
      .sort((left, right) => right.changePercent - left.changePercent)
      .slice(0, 4)
      .map((quote) => {
        const peer = getWatchlistDefinition(quote.symbol);

        return {
          name: quote.name,
          slug: peer?.slug ?? quote.symbol.toLowerCase(),
          href: `/stocks/${peer?.slug ?? quote.symbol.toLowerCase()}`,
          change: formatSignedPercent(quote.changePercent),
          direction: toDirection(quote.changePercent),
        };
      });

    const sortedThemeQuotes = Object.values(quotes).sort((left, right) => right.changePercent - left.changePercent);
    const rankInTheme = sortedThemeQuotes.findIndex((quote) => quote.symbol === definition.symbol) + 1;
    const themeLeader = sortedThemeQuotes[0];

    return {
      slug: definition.slug,
      symbol: definition.symbol,
      name: definition.name,
      theme: definition.theme,
      liveStamp: formatKst(current.marketTime ?? new Date().toISOString()),
      source: 'live',
      price: formatPrice(current.price),
      change: formatSignedPercent(current.changePercent),
      direction: toDirection(current.changePercent),
      turnover: formatTurnover(current.price * current.volume),
      volumeSignal: formatVolumeRatio(current.volume, current.averageVolume),
      summary: `${definition.thesis} 현재 ${definition.theme} 내 강도 ${rankInTheme}위이며, 가장 강한 종목은 ${themeLeader?.name ?? definition.name}입니다.`,
      whyNow: [
        `${definition.theme} 테마 안에서 ${rankInTheme}위 강도입니다.`,
        `${formatVolumeRatio(current.volume, current.averageVolume)} 수준으로 거래가 붙고 있습니다.`,
        `추정 거래대금은 ${formatTurnover(current.price * current.volume)}입니다.`,
      ],
      catalysts: definition.catalysts,
      timeline: timeline.length > 0 ? timeline : buildFallbackTimeline(definition),
      peers,
      points,
      tone: current.changePercent >= 0 ? '#F97316' : '#60A5FA',
    };
  } catch {
    return {
      slug: definition.slug,
      symbol: definition.symbol,
      name: definition.name,
      theme: definition.theme,
      liveStamp: formatKst(new Date().toISOString()),
      source: 'fallback',
      price: '-',
      change: '0.00%',
      direction: 'flat',
      turnover: '-',
      volumeSignal: 'LIVE 미연결',
      summary: definition.thesis,
      whyNow: [
        `${definition.theme} 테마 핵심 종목으로 추적 중입니다.`,
        '실시간 시세 연결에 실패해 편집 설명으로 대체했습니다.',
        '공식 DART와 뉴스 타임라인을 불러오지 못해 체크포인트 카드로 대체했습니다.',
      ],
      catalysts: definition.catalysts,
      timeline: buildFallbackTimeline(definition),
      peers: WATCHLIST.filter((item) => item.theme === definition.theme && item.slug !== definition.slug)
        .slice(0, 4)
        .map((item) => ({
          name: item.name,
          slug: item.slug,
          href: `/stocks/${item.slug}`,
          change: '0.00%',
          direction: 'flat',
        })),
      points: [],
      tone: '#94A3B8',
    };
  }
}
