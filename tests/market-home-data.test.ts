import {
  buildLiveMarketHomeSnapshot,
  fetchMarketHomeSnapshot,
  fetchTrackedStockPageData,
  getFallbackMarketHomeSnapshot,
  getTrackedStockBySlug,
} from '@/lib/market-home-data';
import { afterEach, describe, expect, it, vi } from 'vitest';

function buildStoredZip(filename: string, contents: string): Uint8Array {
  const nameBuffer = Buffer.from(filename, 'utf8');
  const dataBuffer = Buffer.from(contents, 'utf8');

  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0, 6);
  localHeader.writeUInt16LE(0, 8);
  localHeader.writeUInt16LE(0, 10);
  localHeader.writeUInt16LE(0, 12);
  localHeader.writeUInt32LE(0, 14);
  localHeader.writeUInt32LE(dataBuffer.length, 18);
  localHeader.writeUInt32LE(dataBuffer.length, 22);
  localHeader.writeUInt16LE(nameBuffer.length, 26);
  localHeader.writeUInt16LE(0, 28);

  const centralHeader = Buffer.alloc(46);
  centralHeader.writeUInt32LE(0x02014b50, 0);
  centralHeader.writeUInt16LE(20, 4);
  centralHeader.writeUInt16LE(20, 6);
  centralHeader.writeUInt16LE(0, 8);
  centralHeader.writeUInt16LE(0, 10);
  centralHeader.writeUInt16LE(0, 12);
  centralHeader.writeUInt16LE(0, 14);
  centralHeader.writeUInt32LE(0, 16);
  centralHeader.writeUInt32LE(dataBuffer.length, 20);
  centralHeader.writeUInt32LE(dataBuffer.length, 24);
  centralHeader.writeUInt16LE(nameBuffer.length, 28);
  centralHeader.writeUInt16LE(0, 30);
  centralHeader.writeUInt16LE(0, 32);
  centralHeader.writeUInt16LE(0, 34);
  centralHeader.writeUInt16LE(0, 36);
  centralHeader.writeUInt32LE(0, 38);
  centralHeader.writeUInt32LE(0, 42);

  const centralOffset = localHeader.length + nameBuffer.length + dataBuffer.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(centralHeader.length + nameBuffer.length, 12);
  eocd.writeUInt32LE(centralOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([localHeader, nameBuffer, dataBuffer, centralHeader, nameBuffer, eocd]);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('market-home-data', () => {
  it('builds a live snapshot from quote payloads', () => {
    const fallback = getFallbackMarketHomeSnapshot().content;
    const snapshot = buildLiveMarketHomeSnapshot({
      content: fallback,
      indexQuotes: {
        '^KS11': {
          symbol: '^KS11',
          name: 'KOSPI',
          price: 2742.18,
          changePercent: 0.84,
          volume: 0,
          averageVolume: 0,
          marketTime: '2026-03-08T00:12:00.000Z',
        },
        '^KQ11': {
          symbol: '^KQ11',
          name: 'KOSDAQ',
          price: 878.64,
          changePercent: 1.37,
          volume: 0,
          averageVolume: 0,
          marketTime: '2026-03-08T00:12:00.000Z',
        },
        'KRW=X': {
          symbol: 'KRW=X',
          name: 'USD/KRW',
          price: 1318.4,
          changePercent: -0.22,
          volume: 0,
          averageVolume: 0,
          marketTime: '2026-03-08T00:12:00.000Z',
        },
      },
      indexCharts: {
        KOSPI: [
          { collectedAt: '2026-03-08T00:00:00.000Z', value: 2725 },
          { collectedAt: '2026-03-08T00:15:00.000Z', value: 2742.18 },
        ],
        KOSDAQ: [
          { collectedAt: '2026-03-08T00:00:00.000Z', value: 868 },
          { collectedAt: '2026-03-08T00:15:00.000Z', value: 878.64 },
        ],
        'USD/KRW': [
          { collectedAt: '2026-03-08T00:00:00.000Z', value: 1320.1 },
          { collectedAt: '2026-03-08T00:15:00.000Z', value: 1318.4 },
        ],
      },
      stockQuotes: {
        '000660.KS': {
          symbol: '000660.KS',
          name: 'SK하이닉스',
          price: 214000,
          changePercent: 5.8,
          volume: 2200000,
          averageVolume: 1800000,
          marketTime: '2026-03-08T00:12:00.000Z',
        },
        '005930.KS': {
          symbol: '005930.KS',
          name: '삼성전자',
          price: 82500,
          changePercent: 2.2,
          volume: 15400000,
          averageVolume: 12100000,
          marketTime: '2026-03-08T00:12:00.000Z',
        },
        '042700.KS': {
          symbol: '042700.KS',
          name: '한미반도체',
          price: 127800,
          changePercent: 14.2,
          volume: 1800000,
          averageVolume: 900000,
          marketTime: '2026-03-08T00:12:00.000Z',
        },
        '012450.KS': {
          symbol: '012450.KS',
          name: '한화에어로',
          price: 298500,
          changePercent: 11.8,
          volume: 860000,
          averageVolume: 500000,
          marketTime: '2026-03-08T00:12:00.000Z',
        },
        '034020.KS': {
          symbol: '034020.KS',
          name: '두산에너빌리티',
          price: 24850,
          changePercent: 10.5,
          volume: 9000000,
          averageVolume: 6000000,
          marketTime: '2026-03-08T00:12:00.000Z',
        },
      },
    });

    expect(snapshot.meta.source).toBe('live');
    expect(snapshot.content.rankingTabs.find((tab) => tab.label === '왜 오름')?.items[0]?.name).toBe('한미반도체');
    expect(snapshot.content.rankingTabs.find((tab) => tab.label === '왜 오름')?.items[0]?.href).toBe('/stocks/hanmi-semiconductor');
    expect(snapshot.content.rankingTabs).toHaveLength(3);
    expect(snapshot.content.indices[0].level).toContain('2,742.18');
    expect(snapshot.content.pulse.title).toContain('조선 · 방산');
    expect(snapshot.content.pulse.stats[0]?.href).toBe('/stocks/hanmi-semiconductor');
    expect(snapshot.content.pulse.stats[1]?.value).toContain('삼성전자');
    expect(snapshot.content.pulse.stats[2]?.href).toBe('#schedule');
    expect(snapshot.content.spotlightThemes[0].title).toBe('조선 · 방산');
  });

  it('falls back safely when quote fetching fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    const snapshot = await fetchMarketHomeSnapshot(fetchMock);

    expect(snapshot.meta.source).toBe('fallback');
    expect(snapshot.meta.liveSections).toEqual([]);
    expect(snapshot.content.rankingTabs.find((tab) => tab.label === '왜 오름')?.items).toHaveLength(5);
  });

  it('falls back to Naver market data when Yahoo is unavailable', async () => {
    const naverStocks: Record<string, Record<string, unknown>> = {
      '000660': {
        closePrice: '214,000',
        fluctuationsRatio: '5.80',
        compareToPreviousPrice: { code: '2', name: 'RISING' },
        dealTrendInfos: [
          { bizdate: '20260308', accumulatedTradingVolume: '2200000' },
          { bizdate: '20260307', accumulatedTradingVolume: '1800000' },
        ],
      },
      '005930': {
        closePrice: '82,500',
        fluctuationsRatio: '2.20',
        compareToPreviousPrice: { code: '2', name: 'RISING' },
        dealTrendInfos: [
          { bizdate: '20260308', accumulatedTradingVolume: '15400000' },
          { bizdate: '20260307', accumulatedTradingVolume: '12100000' },
        ],
      },
      '042700': {
        closePrice: '127,800',
        fluctuationsRatio: '14.20',
        compareToPreviousPrice: { code: '2', name: 'RISING' },
        dealTrendInfos: [
          { bizdate: '20260308', accumulatedTradingVolume: '1800000' },
          { bizdate: '20260307', accumulatedTradingVolume: '900000' },
        ],
      },
      '012450': {
        closePrice: '298,500',
        fluctuationsRatio: '11.80',
        compareToPreviousPrice: { code: '2', name: 'RISING' },
        dealTrendInfos: [
          { bizdate: '20260308', accumulatedTradingVolume: '860000' },
          { bizdate: '20260307', accumulatedTradingVolume: '500000' },
        ],
      },
      '034020': {
        closePrice: '24,850',
        fluctuationsRatio: '10.50',
        compareToPreviousPrice: { code: '2', name: 'RISING' },
        dealTrendInfos: [
          { bizdate: '20260308', accumulatedTradingVolume: '9000000' },
          { bizdate: '20260307', accumulatedTradingVolume: '6000000' },
        ],
      },
    };

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.includes('/v7/finance/quote')) {
        throw new Error('yahoo rate limited');
      }

      if (url.includes('/v8/finance/chart/')) {
        throw new Error('yahoo chart unavailable');
      }

      if (url.includes('/api/index/KOSPI/basic')) {
        return new Response(
          JSON.stringify({
            closePrice: '2742.18',
            fluctuationsRatio: '0.84',
            compareToPreviousPrice: { code: '2', name: 'RISING' },
            localTradedAt: '2026-03-08T15:30:00+09:00',
          })
        );
      }

      if (url.includes('/api/index/KOSDAQ/basic')) {
        return new Response(
          JSON.stringify({
            closePrice: '878.64',
            fluctuationsRatio: '1.37',
            compareToPreviousPrice: { code: '2', name: 'RISING' },
            localTradedAt: '2026-03-08T15:30:00+09:00',
          })
        );
      }

      if (url.includes('/api/index/KOSPI/price')) {
        return new Response(
          JSON.stringify([
            { localTradedAt: '2026-03-07', closePrice: '2725.00' },
            { localTradedAt: '2026-03-08', closePrice: '2742.18' },
          ])
        );
      }

      if (url.includes('/api/index/KOSDAQ/price')) {
        return new Response(
          JSON.stringify([
            { localTradedAt: '2026-03-07', closePrice: '868.00' },
            { localTradedAt: '2026-03-08', closePrice: '878.64' },
          ])
        );
      }

      const stockMatch = url.match(/\/api\/stock\/(\d{6})\/integration/);
      if (stockMatch) {
        const payload = naverStocks[stockMatch[1]];
        if (!payload) {
          throw new Error('stock not mocked');
        }
        return new Response(JSON.stringify(payload));
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    const snapshot = await fetchMarketHomeSnapshot(fetchMock as typeof fetch);

    expect(snapshot.meta.source).toBe('live');
    expect(snapshot.content.indices[0].level).toContain('2,742.18');
    expect(snapshot.content.rankingTabs.find((tab) => tab.label === '왜 오름')?.items[0]?.name).toBe('한미반도체');
  });

  it('returns tracked stock definitions and detail fallback data', async () => {
    expect(getTrackedStockBySlug('sk-hynix')?.symbol).toBe('000660.KS');

    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    const detail = await fetchTrackedStockPageData('sk-hynix', fetchMock);

    expect(detail?.slug).toBe('sk-hynix');
    expect(detail?.source).toBe('fallback');
    expect(detail?.timeline.length).toBeGreaterThan(0);
    expect(detail?.peers[0]?.href).toContain('/stocks/');
  });

  it('hydrates stock detail timeline from live rss responses', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.includes('/v7/finance/quote')) {
        return new Response(
          JSON.stringify({
            quoteResponse: {
              result: [
                {
                  symbol: '000660.KS',
                  shortName: 'SK하이닉스',
                  regularMarketPrice: 214000,
                  regularMarketChangePercent: 5.8,
                  regularMarketVolume: 2200000,
                  averageDailyVolume3Month: 1800000,
                  regularMarketTime: 1772928720,
                },
                {
                  symbol: '005930.KS',
                  shortName: '삼성전자',
                  regularMarketPrice: 82500,
                  regularMarketChangePercent: 2.2,
                  regularMarketVolume: 15400000,
                  averageDailyVolume3Month: 12100000,
                  regularMarketTime: 1772928720,
                },
                {
                  symbol: '042700.KS',
                  shortName: '한미반도체',
                  regularMarketPrice: 127800,
                  regularMarketChangePercent: 14.2,
                  regularMarketVolume: 1800000,
                  averageDailyVolume3Month: 900000,
                  regularMarketTime: 1772928720,
                },
                {
                  symbol: '095340.KQ',
                  shortName: 'ISC',
                  regularMarketPrice: 91200,
                  regularMarketChangePercent: 6.8,
                  regularMarketVolume: 400000,
                  averageDailyVolume3Month: 280000,
                  regularMarketTime: 1772928720,
                },
              ],
            },
          })
        );
      }

      if (url.includes('/v8/finance/chart/000660.KS')) {
        return new Response(
          JSON.stringify({
            chart: {
              result: [
                {
                  timestamp: [1772928000, 1772929800],
                  indicators: {
                    quote: [
                      {
                        close: [210000, 214000],
                      },
                    ],
                  },
                },
              ],
            },
          })
        );
      }

      if (url.includes('news.google.com/rss/search')) {
        return new Response(`<?xml version="1.0" encoding="UTF-8"?>
          <rss><channel>
            <item>
              <title><![CDATA[SK하이닉스 HBM 공급 확대 뉴스]]></title>
              <link>https://example.com/news-1</link>
              <pubDate>Sun, 08 Mar 2026 09:00:00 GMT</pubDate>
              <description><![CDATA[SK하이닉스 관련 기사 요약]]></description>
            </item>
          </channel></rss>`);
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    const detail = await fetchTrackedStockPageData('sk-hynix', fetchMock as typeof fetch);

    expect(detail?.source).toBe('live');
    expect(detail?.timeline[0]?.label).toBe('NEWS');
    expect(detail?.timeline[0]?.href).toBe('https://example.com/news-1');
  });

  it('prefers official DART disclosures when api key is configured', async () => {
    vi.stubEnv('DART_API_KEY', 'dart-test-key');

    const corpCodeArchive = buildStoredZip(
      'CORPCODE.xml',
      `<?xml version="1.0" encoding="UTF-8"?>
      <result>
        <list>
          <corp_code>00126380</corp_code>
          <corp_name>SK하이닉스</corp_name>
          <stock_code>000660</stock_code>
        </list>
      </result>`
    );

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.includes('/v7/finance/quote')) {
        return new Response(
          JSON.stringify({
            quoteResponse: {
              result: [
                {
                  symbol: '000660.KS',
                  shortName: 'SK하이닉스',
                  regularMarketPrice: 214000,
                  regularMarketChangePercent: 5.8,
                  regularMarketVolume: 2200000,
                  averageDailyVolume3Month: 1800000,
                  regularMarketTime: 1772928720,
                },
                {
                  symbol: '005930.KS',
                  shortName: '삼성전자',
                  regularMarketPrice: 82500,
                  regularMarketChangePercent: 2.2,
                  regularMarketVolume: 15400000,
                  averageDailyVolume3Month: 12100000,
                  regularMarketTime: 1772928720,
                },
                {
                  symbol: '042700.KS',
                  shortName: '한미반도체',
                  regularMarketPrice: 127800,
                  regularMarketChangePercent: 14.2,
                  regularMarketVolume: 1800000,
                  averageDailyVolume3Month: 900000,
                  regularMarketTime: 1772928720,
                },
                {
                  symbol: '095340.KQ',
                  shortName: 'ISC',
                  regularMarketPrice: 91200,
                  regularMarketChangePercent: 6.8,
                  regularMarketVolume: 400000,
                  averageDailyVolume3Month: 280000,
                  regularMarketTime: 1772928720,
                },
              ],
            },
          })
        );
      }

      if (url.includes('/v8/finance/chart/000660.KS')) {
        return new Response(
          JSON.stringify({
            chart: {
              result: [
                {
                  timestamp: [1772928000, 1772929800],
                  indicators: {
                    quote: [
                      {
                        close: [210000, 214000],
                      },
                    ],
                  },
                },
              ],
            },
          })
        );
      }

      if (url.includes('/api/corpCode.xml')) {
        return new Response(corpCodeArchive);
      }

      if (url.includes('/api/list.json')) {
        return new Response(
          JSON.stringify({
            status: '000',
            list: [
              {
                corp_name: 'SK하이닉스',
                report_nm: '주요사항보고서(시설투자)',
                flr_nm: 'SK하이닉스',
                rcept_no: '20260308000123',
                rcept_dt: '20260308',
              },
            ],
          })
        );
      }

      if (url.includes('news.google.com/rss/search')) {
        return new Response(`<?xml version="1.0" encoding="UTF-8"?>
          <rss><channel>
            <item>
              <title><![CDATA[SK하이닉스 HBM 공급 확대 뉴스]]></title>
              <link>https://example.com/news-1</link>
              <pubDate>Sat, 07 Mar 2026 09:00:00 GMT</pubDate>
              <description><![CDATA[SK하이닉스 관련 기사 요약]]></description>
            </item>
          </channel></rss>`);
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    const detail = await fetchTrackedStockPageData('sk-hynix', fetchMock as typeof fetch);

    expect(detail?.source).toBe('live');
    expect(detail?.timeline[0]?.label).toBe('DART');
    expect(detail?.timeline[0]?.displayTime).toBe('03.08');
    expect(detail?.timeline[0]?.href).toContain('rcpNo=20260308000123');
  });
});
