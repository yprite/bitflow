import { describe, it, expect } from 'vitest';
import {
  getCollectedAt,
  validateRange,
  detectSpike,
  scoreNetflow,
  scoreUtxoAge,
  scoreFearGreed,
  getMarketStatus,
} from '../src/lib/metrics';

describe('getCollectedAt', () => {
  it('truncates to hour boundary for hourly metrics', () => {
    const result = getCollectedAt('hour');
    const date = new Date(result);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });

  it('truncates to KST day boundary for daily metrics', () => {
    const result = getCollectedAt('day_kst');
    const date = new Date(result);
    // KST is UTC+9, so the UTC hour should be 15 (00:00 KST = 15:00 UTC previous day)
    // or 0 if KST date starts at midnight
    const kstDate = new Date(date.getTime() + 9 * 3600 * 1000);
    expect(kstDate.getHours()).toBe(0);
    expect(kstDate.getMinutes()).toBe(0);
  });
});

describe('validateRange', () => {
  it('accepts values within range', () => {
    expect(validateRange('fear_greed', 50)).toEqual({ valid: true });
    expect(validateRange('exchange_netflow', 0)).toEqual({ valid: true });
    expect(validateRange('btc_price', 50000)).toEqual({ valid: true });
  });

  it('rejects values outside range', () => {
    const result = validateRange('fear_greed', 150);
    expect(result.valid).toBe(false);

    const result2 = validateRange('exchange_netflow', 200000);
    expect(result2.valid).toBe(false);

    const result3 = validateRange('fear_greed', -10);
    expect(result3.valid).toBe(false);
  });

  it('accepts unknown metrics', () => {
    expect(validateRange('unknown_metric', 999999)).toEqual({ valid: true });
  });

  it('handles boundary values', () => {
    expect(validateRange('fear_greed', 0)).toEqual({ valid: true });
    expect(validateRange('fear_greed', 100)).toEqual({ valid: true });
  });
});

describe('detectSpike', () => {
  it('returns false for non-netflow metrics', () => {
    expect(detectSpike('fear_greed', 50, [40, 45, 42])).toBe(false);
  });

  it('returns false with insufficient recent values', () => {
    expect(detectSpike('exchange_netflow', 5000, [100, 200])).toBe(false);
  });

  it('detects spike when value far from median', () => {
    // Median of [100, 200, 300] = 200, threshold = max(2000, 500) = 2000
    // |50000 - 200| = 49800 > 2000
    expect(detectSpike('exchange_netflow', 50000, [100, 200, 300])).toBe(true);
  });

  it('does not flag normal variation', () => {
    // Median of [100, 200, 300] = 200, threshold = max(2000, 500) = 2000
    // |500 - 200| = 300 < 2000
    expect(detectSpike('exchange_netflow', 500, [100, 200, 300])).toBe(false);
  });

  it('uses absolute minimum threshold near zero', () => {
    // Median of [0, 0, 0] = 0, threshold = max(0, 500) = 500
    // |100 - 0| = 100 < 500 → no spike
    expect(detectSpike('exchange_netflow', 100, [0, 0, 0])).toBe(false);
    // |600 - 0| = 600 > 500 → spike
    expect(detectSpike('exchange_netflow', 600, [0, 0, 0])).toBe(true);
  });
});

describe('scoreNetflow', () => {
  it('returns +1 for large outflow (accumulation)', () => {
    expect(scoreNetflow(-3000)).toBe(1);
  });

  it('returns -1 for large inflow (sell pressure)', () => {
    expect(scoreNetflow(3000)).toBe(-1);
  });

  it('returns 0 for neutral range', () => {
    expect(scoreNetflow(0)).toBe(0);
    expect(scoreNetflow(1999)).toBe(0);
    expect(scoreNetflow(-1999)).toBe(0);
  });

  it('handles boundary values', () => {
    expect(scoreNetflow(-2000)).toBe(0);
    expect(scoreNetflow(-2001)).toBe(1);
    expect(scoreNetflow(2000)).toBe(0);
    expect(scoreNetflow(2001)).toBe(-1);
  });
});

describe('scoreFearGreed', () => {
  it('returns +1 for extreme fear (contrarian)', () => {
    expect(scoreFearGreed(10)).toBe(1);
    expect(scoreFearGreed(24)).toBe(1);
  });

  it('returns -1 for extreme greed', () => {
    expect(scoreFearGreed(80)).toBe(-1);
    expect(scoreFearGreed(100)).toBe(-1);
  });

  it('returns 0 for neutral', () => {
    expect(scoreFearGreed(50)).toBe(0);
    expect(scoreFearGreed(25)).toBe(0);
    expect(scoreFearGreed(75)).toBe(0);
  });
});

describe('scoreUtxoAge', () => {
  it('returns +1 for increasing LTH', () => {
    expect(scoreUtxoAge(0.2)).toBe(1);
  });

  it('returns -1 for decreasing LTH', () => {
    expect(scoreUtxoAge(-0.2)).toBe(-1);
  });

  it('returns 0 for dead zone', () => {
    expect(scoreUtxoAge(0)).toBe(0);
    expect(scoreUtxoAge(0.05)).toBe(0);
    expect(scoreUtxoAge(-0.05)).toBe(0);
  });
});

describe('getMarketStatus', () => {
  it('returns accumulation when total >= 2', () => {
    const result = getMarketStatus([1, 1, 0]);
    expect(result.status).toBe('accumulation');
    expect(result.total).toBe(2);
  });

  it('returns caution when total <= -2', () => {
    const result = getMarketStatus([-1, -1, 0]);
    expect(result.status).toBe('caution');
    expect(result.total).toBe(-2);
  });

  it('returns neutral for mixed signals', () => {
    const result = getMarketStatus([1, -1, 0]);
    expect(result.status).toBe('neutral');
    expect(result.total).toBe(0);
  });

  it('returns insufficient when fewer than 2 valid scores', () => {
    expect(getMarketStatus([null, null, 1]).status).toBe('insufficient');
    expect(getMarketStatus([null, null, null]).status).toBe('insufficient');
  });

  it('works with only 2 valid scores', () => {
    const result = getMarketStatus([1, 1, null]);
    expect(result.status).toBe('accumulation');
    expect(result.total).toBe(2);
  });
});
