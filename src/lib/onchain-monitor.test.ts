import {
  deriveFeeRegimeHistory,
  deriveOnchainBriefing,
  deriveOnchainDormancyPulse,
  deriveOnchainFlowPressure,
  deriveOnchainRegime,
  deriveOnchainWhaleSummary,
  getOnchainAlertAmountBtc,
} from './onchain-monitor';
import type { OnchainAlertEvent, OnchainMetricSummary } from './types';

function makeMetric(
  id: OnchainMetricSummary['id'],
  latestValue: number,
  previousValue: number,
  unit: string = 'count',
  series: OnchainMetricSummary['series'] = []
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
    series,
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
    expect(summary.slices).toHaveLength(3);
    expect(summary.buckets).toHaveLength(8);
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
    expect(regime?.factors.length).toBeGreaterThan(0);
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
    expect(regime?.factors.some((factor) => factor.contribution < 0)).toBe(true);
  });
});

describe('deriveOnchainDormancyPulse', () => {
  it('flags a spike when dormant supply sharply exceeds recent average', () => {
    const dormant = makeMetric(
      'dormant_reactivated_btc',
      320,
      140,
      'btc',
      [
        { day: '2026-03-11', value: 120, unit: 'btc' },
        { day: '2026-03-12', value: 135, unit: 'btc' },
        { day: '2026-03-13', value: 128, unit: 'btc' },
        { day: '2026-03-14', value: 142, unit: 'btc' },
        { day: '2026-03-15', value: 136, unit: 'btc' },
        { day: '2026-03-16', value: 140, unit: 'btc' },
        { day: '2026-03-17', value: 320, unit: 'btc' },
      ]
    );

    const pulse = deriveOnchainDormancyPulse([
      dormant,
      makeMetric('active_supply_ratio_30d', 14.3, 13.8, 'percent'),
      makeMetric('active_supply_ratio_90d', 24.2, 23.9, 'percent'),
    ]);

    expect(pulse?.tone).toBe('spike');
    expect(pulse?.label).toBe('급증');
    expect(pulse?.series).toHaveLength(7);
    expect(pulse?.ratio).toBeGreaterThan(2);
  });
});

describe('deriveOnchainFlowPressure', () => {
  it('labels inflow when tracked entities receive more than they send', () => {
    const flow = deriveOnchainFlowPressure([
      {
        day: '2026-03-17',
        entitySlug: 'binance',
        receivedSats: 90_000_000_000,
        sentSats: 15_000_000_000,
        netflowSats: 75_000_000_000,
        txCount: 12,
      },
      {
        day: '2026-03-17',
        entitySlug: 'coinbase',
        receivedSats: 40_000_000_000,
        sentSats: 25_000_000_000,
        netflowSats: 15_000_000_000,
        txCount: 9,
      },
    ]);

    expect(flow?.tone).toBe('inflow');
    expect(flow?.label).toBe('순유입 우세');
    expect(flow?.leaders[0]?.entitySlug).toBe('binance');
    expect(flow?.netflowBtc).toBeCloseTo(900);
  });
});

describe('deriveFeeRegimeHistory', () => {
  it('captures recent fee trend from block history', () => {
    const history = deriveFeeRegimeHistory([
      { height: 103, timestamp: 1700001800, tx_count: 2800, extras: { medianFee: 6.8, avgFeeRate: 7.1, totalFees: 300_000_000 } },
      { height: 102, timestamp: 1700001200, tx_count: 2700, extras: { medianFee: 4.6, avgFeeRate: 5.2, totalFees: 260_000_000 } },
      { height: 101, timestamp: 1700000600, tx_count: 2600, extras: { medianFee: 1.8, avgFeeRate: 2.1, totalFees: 140_000_000 } },
      { height: 100, timestamp: 1700000000, tx_count: 2500, extras: { medianFee: 1.2, avgFeeRate: 1.4, totalFees: 100_000_000 } },
    ]);

    expect(history.label).toBe('혼잡');
    expect(history.trend).toBe('상승');
    expect(history.points).toHaveLength(4);
    expect(history.latestMedianFee).toBeCloseTo(6.8);
  });
});

describe('deriveOnchainBriefing', () => {
  it('combines regime, dormancy, and fee state into plain-language bullets', () => {
    const briefing = deriveOnchainBriefing({
      regime: deriveOnchainRegime(
        [
          makeMetric('active_supply_ratio_30d', 13.5, 12.8, 'percent'),
          makeMetric('active_supply_ratio_90d', 24.1, 23.7, 'percent'),
          makeMetric('spent_btc', 210_000, 180_000, 'btc'),
          makeMetric('created_utxo_count', 480_000, 430_000, 'count'),
          makeMetric('dormant_reactivated_btc', 120, 110, 'btc'),
        ],
        { total: 3, high: 1, medium: 1, info: 1 }
      ),
      whaleSummary: deriveOnchainWhaleSummary(
        [
          makeAlert({
            alertType: 'large_confirmed_spend',
            detectedAt: '2026-03-17T01:00:00.000Z',
            context: { amount_btc: 1_200 },
          }),
        ],
        new Date('2026-03-17T04:00:00.000Z')
      ),
      feePressure: {
        pressure: '혼잡',
        fastestFee: 12,
        halfHourFee: 8,
        hourFee: 4,
        economyFee: 2,
        minimumFee: 1,
        mempoolTxCount: 123_000,
        mempoolVsize: 65_000_000,
        totalFeeBtc: 2.1,
        projectedBlocks: [],
      },
      dormancyPulse: {
        tone: 'watch',
        label: '주의',
        summary: 'summary',
        latestDay: '2026-03-17',
        latestValue: 180,
        baselineValue: 120,
        ratio: 1.5,
        changePercent: 50,
        active30dRatio: 13.2,
        active90dRatio: 23.1,
        series: [],
      },
      flowPressure: {
        tone: 'balanced',
        label: '균형',
        summary: 'summary',
        latestDay: '2026-03-17',
        trackedEntityCount: 4,
        totalReceivedBtc: 500,
        totalSentBtc: 480,
        netflowBtc: 20,
        leaders: [],
      },
    });

    expect(briefing).not.toBeNull();
    expect(briefing?.bullets.length).toBeGreaterThan(2);
    expect(briefing?.headline).toContain('활동');
  });
});
