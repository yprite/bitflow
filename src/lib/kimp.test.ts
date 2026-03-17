import { describe, expect, it } from 'vitest';
import { getCompositeSignal } from './kimp';

describe('getCompositeSignal', () => {
  it('combines MSTR and STRC into a single MicroStrategy factor', () => {
    const signal = getCompositeSignal(
      2,
      0,
      50,
      0,
      56,
      50,
      0,
      0.5,
      0,
      0,
      761_068,
      1.2,
      4_000,
      0,
      1
    );

    const factor = signal.factors.find((entry) => entry.label === '마이크로스트레티지');

    expect(signal.factors).toHaveLength(11);
    expect(factor).toMatchObject({
      direction: '과열',
      weight: 1.25,
      weightedScore: 5,
    });
    expect(factor?.value).toContain('M+1.20%');
    expect(factor?.value).toContain('S~4.0k');
  });

  it('keeps STRC divergence logic while aggregating into the same factor', () => {
    const signal = getCompositeSignal(
      -2,
      -0.02,
      20,
      -1,
      63,
      30,
      -20,
      0.3,
      -2,
      -60,
      761_068,
      0.2,
      4_000,
      0,
      1
    );

    const factor = signal.factors.find((entry) => entry.label === '마이크로스트레티지');

    expect(factor).toMatchObject({
      direction: '침체',
      weightedScore: -1.25,
    });
  });
});
