import { deriveOnchainRegime, deriveOnchainWhaleSummary, getOnchainAlertAmountBtc } from './onchain-monitor';
import type { OnchainAlertEvent, OnchainMetricSummary } from './types';

function makeMetric(
  id: OnchainMetricSummary['id'],
  latestValue: number,
  previousValue: number,
  unit: string = 'count'
): OnchainMetricSummary {
  return {
    id,
    label: id,
    description: id,
    metricName: id,
    dimensionKey: 'all',
    unit,
    latestDay: '2026-03-17',
    latestValue,
    previousValue,
    changeValue: latestValue - previousValue,
    changePercent: previousValue === 0 ? null : ((latestValue - previousValue) / Math.abs(previousValue)) * 100,
    series: [],
  };
}

function makeAlert(input: Partial<OnchainAlertEvent>): OnchainAlertEvent {
  return {
    detectedAt: '2026-03-17T00:00:00.000Z',
    alertType: 'large_confirmed_spend',
    severity: 'high',
    title: 'alert',
    body: 'body',
    relatedTxid: 'abc',
    relatedEntitySlug: null,
    context: {},
    ...input,
  };
}

describe('getOnchainAlertAmountBtc', () => {
  it('extracts btc amount from different alert context shapes', () => {
    expect(getOnchainAlertAmountBtc(makeAlert({ context: { amount_btc: 42 } }))).toBe(42);
    expect(getOnchainAlertAmountBtc(makeAlert({ context: { amount_btc: '3.5' } }))).toBe(3.5);
    expect(getOnchainAlertAmountBtc(makeAlert({ context: { total_output_sats: 250_000_000 } }))).toBe(2.5);
  });
});

describe('deriveOnchainWhaleSummary', () => {
  it('builds a 24h whale summary by alert type', () => {
    const summary = deriveOnchainWhaleSummary(
      [
        makeAlert({
          alertType: 'large_confirmed_spend',
          detectedAt: '2026-03-17T01:00:00.000Z',
          context: { amount_btc: 500 },
        }),
        makeAlert({
          alertType: 'mempool_large_tx',
          severity: 'medium',
          detectedAt: '2026-03-17T02:00:00.000Z',
          context: { amount_btc: 250 },
        }),
        makeAlert({
          alertType: 'dormant_reactivation',
          detectedAt: '2026-03-17T03:00:00.000Z',
          context: { amount_btc: 100 },
        }),
      ],
      new Date('2026-03-17T04:00:00.000Z')
    );

    expect(summary.totalAlerts).toBe(3);
    expect(summary.totalMovedBtc).toBe(850);
    expect(summary.confirmedCount).toBe(1);
    expect(summary.pendingCount).toBe(1);
    expect(summary.dormantCount).toBe(1);
    expect(summary.dominantAlertType).toBe('large_confirmed_spend');
  });
});

describe('deriveOnchainRegime', () => {
  it('labels expansion when active supply and spending rise together', () => {
    const regime = deriveOnchainRegime(
      [
        makeMetric('active_supply_ratio_30d', 13.5, 12.8, 'percent'),
        makeMetric('active_supply_ratio_90d', 24.1, 23.7, 'percent'),
        makeMetric('spent_btc', 210_000, 180_000, 'btc'),
        makeMetric('created_utxo_count', 480_000, 430_000, 'count'),
        makeMetric('dormant_reactivated_btc', 120, 110, 'btc'),
      ],
      { total: 3, high: 1, medium: 1, info: 1 }
    );

    expect(regime?.label).toBe('확장');
    expect(regime?.tone).toBe('expansion');
    expect(regime?.drivers.length).toBeGreaterThan(0);
  });

  it('labels contraction when long-term activity slows and dormant supply spikes', () => {
    const regime = deriveOnchainRegime(
      [
        makeMetric('active_supply_ratio_30d', 11.2, 11.8, 'percent'),
        makeMetric('active_supply_ratio_90d', 21.3, 21.7, 'percent'),
        makeMetric('spent_btc', 150_000, 190_000, 'btc'),
        makeMetric('created_utxo_count', 380_000, 430_000, 'count'),
        makeMetric('dormant_reactivated_btc', 220, 120, 'btc'),
      ],
      { total: 7, high: 5, medium: 1, info: 1 }
    );

    expect(regime?.label).toBe('위축');
    expect(regime?.tone).toBe('contraction');
  });
});
