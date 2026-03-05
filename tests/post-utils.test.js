import { describe, expect, it } from 'vitest';
import { buildTweetText, evaluateStale, toKstDateString } from '../scripts/lib/post-utils.js';

describe('post-utils', () => {
  it('formats KST date string', () => {
    const date = new Date('2026-03-03T00:30:00.000Z'); // 09:30 KST
    expect(toKstDateString(date)).toBe('2026-03-03');
  });

  it('marks fresh metrics as not stale', () => {
    const now = new Date('2026-03-03T10:00:00.000Z');
    const twoHoursAgo = Math.floor((now.getTime() - 2 * 60 * 60 * 1000) / 1000);
    const ninetyMinsAgo = Math.floor((now.getTime() - 90 * 60 * 1000) / 1000);
    const rows = {
      exchange_netflow: {
        collected_at: '2026-03-03T08:00:00.000Z',
        metadata: { source_timestamp: twoHoursAgo },
      },
      mempool_fees: {
        collected_at: '2026-03-03T08:30:00.000Z',
        metadata: { source_timestamp: ninetyMinsAgo },
      },
      fear_greed: {
        collected_at: '2026-03-03T00:00:00.000Z',
        metadata: { source_date: '2026-03-03' },
      },
      utxo_age_1y: {
        collected_at: '2026-03-03T00:00:00.000Z',
        metadata: { source_date: '2026-03-02' },
      },
    };

    const result = evaluateStale(rows, now);
    expect(result.shouldSkip).toBe(false);
    expect(result.reason).toBe('fresh');
  });

  it('skips when hourly metric is stale', () => {
    const now = new Date('2026-03-03T10:00:00.000Z');
    const eightHoursAgo = Math.floor((now.getTime() - 8 * 60 * 60 * 1000) / 1000);
    const oneHourAgo = Math.floor((now.getTime() - 1 * 60 * 60 * 1000) / 1000);
    const rows = {
      exchange_netflow: {
        collected_at: '2026-03-03T02:00:00.000Z',
        metadata: { source_timestamp: eightHoursAgo },
      },
      mempool_fees: {
        collected_at: '2026-03-03T09:00:00.000Z',
        metadata: { source_timestamp: oneHourAgo },
      },
      fear_greed: {
        collected_at: '2026-03-03T00:00:00.000Z',
        metadata: { source_date: '2026-03-03' },
      },
      utxo_age_1y: {
        collected_at: '2026-03-03T00:00:00.000Z',
        metadata: { source_date: '2026-03-03' },
      },
    };

    const result = evaluateStale(rows, now);
    expect(result.shouldSkip).toBe(true);
    expect(result.hourlyStale.length).toBeGreaterThan(0);
  });

  it('builds tweet text under 280 chars', () => {
    const text = buildTweetText({
      emoji: '🟢',
      label: '축적 국면',
      summary: '요약 문장입니다.',
      netflow: -2340,
      mempoolFee: 12,
      fearGreed: 45,
    });

    expect(text.length).toBeLessThanOrEqual(280);
    expect(text).toContain('축적 국면');
    expect(text).toContain('#Bitcoin');
  });
});
