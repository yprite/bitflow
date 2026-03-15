import {
  buildOnchainMetricSummaries,
  buildOnchainSummary,
  getOnchainMetricById,
} from './onchain';

describe('buildOnchainMetricSummaries', () => {
  it('summarizes latest value and day-over-day change per metric', () => {
    const metrics = buildOnchainMetricSummaries([
      {
        day: '2026-03-13',
        metricName: 'spent_btc',
        metricValue: 1250.5,
        unit: 'btc',
        dimensionKey: 'all',
      },
      {
        day: '2026-03-14',
        metricName: 'spent_btc',
        metricValue: 1500.75,
        unit: 'btc',
        dimensionKey: 'all',
      },
      {
        day: '2026-03-13',
        metricName: 'active_supply_ratio',
        metricValue: 12.5,
        unit: 'percent',
        dimensionKey: '30d',
      },
      {
        day: '2026-03-14',
        metricName: 'active_supply_ratio',
        metricValue: 13.25,
        unit: 'percent',
        dimensionKey: '30d',
      },
    ]);

    const spentBtc = getOnchainMetricById(metrics, 'spent_btc');
    const active30d = getOnchainMetricById(metrics, 'active_supply_ratio_30d');

    expect(spentBtc.latestDay).toBe('2026-03-14');
    expect(spentBtc.latestValue).toBe(1500.75);
    expect(spentBtc.changeValue).toBeCloseTo(250.25, 6);
    expect(active30d.latestValue).toBe(13.25);
    expect(active30d.changePercent).toBeCloseTo(6, 0);
  });
});

describe('buildOnchainSummary', () => {
  it('marks the summary available when any serving data exists', () => {
    const summary = buildOnchainSummary({
      metricRows: [
        {
          day: '2026-03-14',
          metricName: 'created_utxo_count',
          metricValue: 420_000,
          unit: 'count',
          dimensionKey: 'all',
        },
      ],
      entityFlows: [
        {
          day: '2026-03-14',
          entitySlug: 'binance',
          receivedSats: 500_000_000,
          sentSats: 200_000_000,
          netflowSats: 300_000_000,
          txCount: 12,
        },
      ],
      alerts: [
        {
          detectedAt: '2026-03-14T03:00:00.000Z',
          alertType: 'large_confirmed_spend',
          severity: 'high',
          title: 'Large confirmed spend',
          body: '10k BTC moved',
          relatedTxid: 'abc',
          relatedEntitySlug: null,
          context: {},
        },
      ],
    });

    expect(summary.status).toBe('available');
    expect(summary.latestDay).toBe('2026-03-14');
    expect(summary.alertStats.high).toBe(1);
  });

  it('keeps the summary unavailable when no serving data exists', () => {
    const summary = buildOnchainSummary({
      message: 'backfill pending',
    });

    expect(summary.status).toBe('unavailable');
    expect(summary.metrics.every((metric) => metric.latestValue === null)).toBe(true);
    expect(summary.message).toBe('backfill pending');
  });
});
