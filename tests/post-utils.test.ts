import { describe, it, expect } from 'vitest';

// Import the CommonJS module
const { evaluateStale, buildTweetText, getDailyDate, toKstDateString } = require('../scripts/lib/post-utils');

function makeRow(metricName: string, collectedAt: string, metadata: Record<string, unknown> = {}) {
  return {
    metric_name: metricName,
    collected_at: collectedAt,
    value: 50,
    metadata,
  };
}

describe('toKstDateString', () => {
  it('converts UTC to KST date string', () => {
    // 2026-03-02 15:00 UTC = 2026-03-03 00:00 KST
    const date = new Date('2026-03-02T15:00:00Z');
    expect(toKstDateString(date)).toBe('2026-03-03');
  });

  it('handles midnight UTC', () => {
    const date = new Date('2026-03-03T00:00:00Z');
    // 00:00 UTC = 09:00 KST → same day
    expect(toKstDateString(date)).toBe('2026-03-03');
  });
});

describe('getDailyDate', () => {
  it('uses source_date when available', () => {
    const row = makeRow('fear_greed', '2026-03-03T00:00:00Z', { source_date: '2026-03-03' });
    expect(getDailyDate(row)).toBe('2026-03-03');
  });

  it('falls back to source_timestamp', () => {
    // 2026-03-03 00:00 KST = 1740924000 (unix)
    const row = makeRow('fear_greed', '2026-03-02T15:00:00Z', { source_timestamp: 1740924000 });
    const result = getDailyDate(row);
    expect(result).toBeTruthy();
  });

  it('falls back to collected_at', () => {
    const row = makeRow('fear_greed', '2026-03-03T08:00:00Z', {});
    const result = getDailyDate(row);
    expect(result).toBe('2026-03-03');
  });

  it('returns null for missing row', () => {
    expect(getDailyDate(null)).toBeNull();
  });
});

describe('evaluateStale', () => {
  it('returns fresh when all data is recent', () => {
    const now = new Date('2026-03-03T09:00:00Z'); // 18:00 KST
    const rows = {
      exchange_netflow: makeRow('exchange_netflow', '2026-03-03T08:00:00Z', {
        source_timestamp: Math.floor(now.getTime() / 1000) - 3600,
      }),
      mempool_fees: makeRow('mempool_fees', '2026-03-03T08:00:00Z', {
        source_timestamp: Math.floor(now.getTime() / 1000) - 1800,
      }),
      fear_greed: makeRow('fear_greed', '2026-03-02T15:00:00Z', {
        source_date: '2026-03-03',
      }),
      utxo_age_1y: makeRow('utxo_age_1y', '2026-03-02T15:00:00Z', {
        source_date: '2026-03-03',
      }),
    };

    const result = evaluateStale(rows, now);
    expect(result.shouldSkip).toBe(false);
  });

  it('skips when hourly metric is stale', () => {
    const now = new Date('2026-03-03T09:00:00Z');
    const rows = {
      exchange_netflow: makeRow('exchange_netflow', '2026-03-03T04:00:00Z', {
        source_timestamp: Math.floor(new Date('2026-03-03T04:00:00Z').getTime() / 1000),
      }),
      mempool_fees: makeRow('mempool_fees', '2026-03-03T08:00:00Z', {
        source_timestamp: Math.floor(now.getTime() / 1000) - 1800,
      }),
      fear_greed: makeRow('fear_greed', '2026-03-02T15:00:00Z', { source_date: '2026-03-03' }),
      utxo_age_1y: makeRow('utxo_age_1y', '2026-03-02T15:00:00Z', { source_date: '2026-03-03' }),
    };

    const result = evaluateStale(rows, now);
    expect(result.shouldSkip).toBe(true);
    expect(result.hourlyStale.length).toBeGreaterThan(0);
  });

  it('skips when all daily metrics are stale', () => {
    const now = new Date('2026-03-05T09:00:00Z');
    const rows = {
      exchange_netflow: makeRow('exchange_netflow', '2026-03-05T08:00:00Z', {
        source_timestamp: Math.floor(now.getTime() / 1000) - 1800,
      }),
      mempool_fees: makeRow('mempool_fees', '2026-03-05T08:00:00Z', {
        source_timestamp: Math.floor(now.getTime() / 1000) - 1800,
      }),
      fear_greed: makeRow('fear_greed', '2026-03-02T15:00:00Z', { source_date: '2026-03-01' }),
      utxo_age_1y: makeRow('utxo_age_1y', '2026-03-02T15:00:00Z', { source_date: '2026-03-01' }),
    };

    const result = evaluateStale(rows, now);
    expect(result.shouldSkip).toBe(true);
    expect(result.dailyStale.length).toBe(2);
  });

  it('does not skip when only one daily is stale', () => {
    const now = new Date('2026-03-05T09:00:00Z');
    const todayKst = '2026-03-05';
    const rows = {
      exchange_netflow: makeRow('exchange_netflow', '2026-03-05T08:00:00Z', {
        source_timestamp: Math.floor(now.getTime() / 1000) - 1800,
      }),
      mempool_fees: makeRow('mempool_fees', '2026-03-05T08:00:00Z', {
        source_timestamp: Math.floor(now.getTime() / 1000) - 1800,
      }),
      fear_greed: makeRow('fear_greed', '2026-03-04T15:00:00Z', { source_date: todayKst }),
      utxo_age_1y: makeRow('utxo_age_1y', '2026-03-02T15:00:00Z', { source_date: '2026-03-01' }),
    };

    const result = evaluateStale(rows, now);
    expect(result.shouldSkip).toBe(false);
  });

  it('skips when metric is missing', () => {
    const now = new Date('2026-03-03T09:00:00Z');
    const rows = {
      exchange_netflow: null,
      mempool_fees: makeRow('mempool_fees', '2026-03-03T08:00:00Z', {
        source_timestamp: Math.floor(now.getTime() / 1000) - 1800,
      }),
      fear_greed: makeRow('fear_greed', '2026-03-02T15:00:00Z', { source_date: '2026-03-03' }),
      utxo_age_1y: makeRow('utxo_age_1y', '2026-03-02T15:00:00Z', { source_date: '2026-03-03' }),
    };

    const result = evaluateStale(rows, now);
    expect(result.shouldSkip).toBe(true);
  });
});

describe('buildTweetText', () => {
  it('builds tweet within 280 chars', () => {
    const summary = {
      emoji: '🟢',
      label: '축적 국면',
      summary: '거래소에서 BTC 순유출 중. 공포/탐욕 지수 45 (공포).',
      netflow: -3500,
      mempoolFee: 12,
      fearGreed: 45,
    };

    const text = buildTweetText(summary);
    expect(text.length).toBeLessThanOrEqual(280);
    expect(text).toContain('🟢');
    expect(text).toContain('축적 국면');
    expect(text).toContain('#Bitcoin');
  });

  it('handles null values gracefully', () => {
    const summary = {
      emoji: '⚪',
      label: '데이터 부족',
      summary: '데이터가 부족합니다.',
      netflow: null,
      mempoolFee: null,
      fearGreed: null,
    };

    const text = buildTweetText(summary);
    expect(text.length).toBeLessThanOrEqual(280);
    expect(text).not.toContain('NaN');
  });
});
