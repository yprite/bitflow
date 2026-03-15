import {
  buildStrategyCapitalData,
  estimateStrategyCapitalDay,
  STRC_ATM_THRESHOLD,
} from './strategy-capital';

describe('estimateStrategyCapitalDay', () => {
  it('matches the STRC.live estimation formula for threshold-eligible volume', () => {
    const day = estimateStrategyCapitalDay({
      date: '2026-03-12',
      closePrice: 100.01,
      btcPrice: 70227,
      day: {
        totalVolume: 7_446_847.804849001,
        regularVolume: 0,
        extendedVolume: 0,
        bars: [
          { open: 100.01, high: 100.02, low: 99.99, close: 100.01, volume: 6_506_978.804849, timestamp: 1, session: 'regular' },
          { open: 100.00, high: 100.01, low: 99.97, close: 99.97, volume: 45_966, timestamp: 2, session: 'regular' },
          { open: 100.02, high: 100.03, low: 100.00, close: 100.02, volume: 893_903, timestamp: 3, session: 'after-hours' },
        ],
      },
    });

    expect(day.eligibleVolume).toBeCloseTo(7_400_881.804849001, 6);
    expect(day.regularEligibleVolume).toBeCloseTo(6_506_978.804849, 6);
    expect(day.extendedEligibleVolume).toBeCloseTo(893_903, 6);
    expect(day.estimatedBtc).toBeCloseTo(4110.43122770658, 6);
  });
});

describe('buildStrategyCapitalData', () => {
  it('builds current-week estimates and latest confirmed STRC filing data', () => {
    const data = buildStrategyCapitalData(
      {
        updated: '2026-03-14T23:47:15.973Z',
        btcHistory: {
          '2026-03-10': 68459,
          '2026-03-11': 69883,
        },
        marketStatus: {
          market: 'closed',
          afterHours: false,
          earlyHours: false,
        },
        tickers: {
          STRC: {
            history: [
              { date: '2026-03-10T20:00:00.000Z', close: 100.02, high: 100.02, low: 100.02, volume: 4_387_867.139552997, source: 'daily' },
              { date: '2026-03-11T20:00:00.000Z', close: 99.75, high: 99.75, low: 99.75, volume: 3_026_887, source: 'daily' },
            ],
            intraday: {
              '2026-03-10': {
                totalVolume: 4_387_867.139552997,
                regularVolume: 0,
                extendedVolume: 0,
                bars: [
                  { open: 100.02, high: 100.02, low: 100.02, close: 100.02, volume: 4_387_867.139552997, timestamp: 1, session: 'regular' },
                ],
              },
              '2026-03-11': {
                totalVolume: 3_026_887,
                regularVolume: 0,
                extendedVolume: 0,
                bars: [
                  { open: 99.75, high: 99.75, low: 99.75, close: 99.75, volume: 3_026_887, timestamp: 2, session: 'regular' },
                ],
              },
            },
            summary: {
              currentYield: 11.53,
              annualizedDividend: 11.5,
              exDividendDate: '3/13/2026',
            },
          },
        },
      },
      {
        success: true,
        filings: [
          {
            ticker: 'STRC',
            filedDate: '2026-03-09',
            url: 'https://www.sec.gov/example',
            period: 'Mar 1 - Mar 7',
            periodStart: '2026-03-02',
            periodEnd: '2026-03-08',
            sharesSold: 3_776_205,
            netProceeds: 377_100_000,
            btcPurchased: null,
            avgBtcPrice: 70_946,
            offeringType: 'atm',
          },
          {
            ticker: 'SATA',
            filedDate: '2026-03-09',
            url: 'https://www.sec.gov/ignore',
            period: null,
            periodStart: null,
            periodEnd: null,
            sharesSold: 100,
            netProceeds: 100,
            btcPurchased: null,
            avgBtcPrice: 1,
            offeringType: 'follow_on',
          },
        ],
      }
    );

    expect(data.ticker).toBe('STRC');
    expect(data.status).toBe('standby');
    expect(data.currentPrice).toBe(99.75);
    expect(data.distanceToThreshold).toBeCloseTo(99.75 - STRC_ATM_THRESHOLD, 6);
    expect(data.currentWeekEstimatedBtc).toBeCloseTo(2500.197838213462, 6);
    expect(data.currentWeekEstimatedNetProceedsUsd).toBeCloseTo(171_161_043.8062554, 4);
    expect(data.latestConfirmed?.netProceedsUsd).toBe(377_100_000);
    expect(data.latestConfirmed?.estimatedBtc).toBeCloseTo(5315.310235954106, 6);
    expect(data.confirmedTotalEstimatedBtc).toBeCloseTo(5315.310235954106, 6);
    expect(data.recentDays).toHaveLength(2);
    expect(data.recentDays[0].date).toBe('2026-03-11');
    expect(data.recentDays[1].date).toBe('2026-03-10');
  });
});
