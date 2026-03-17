import { describe, expect, it } from 'vitest';
import {
  estimateCpfpPackage,
  estimateRbfReplacement,
  estimateTransactionVbytes,
  satsForFeeRate,
} from './bitcoin-tools';

describe('bitcoin-tools', () => {
  it('estimates common transaction size profiles', () => {
    expect(
      estimateTransactionVbytes({
        inputCount: 1,
        outputCount: 2,
        inputProfile: 'p2wpkh',
        outputProfile: 'p2wpkh',
      })
    ).toBe(141);

    expect(
      estimateTransactionVbytes({
        inputCount: 2,
        outputCount: 1,
        inputProfile: 'p2tr',
        outputProfile: 'p2tr',
      })
    ).toBe(170);
  });

  it('calculates fee totals from fee rates', () => {
    expect(satsForFeeRate(141, 12)).toBe(1692);
    expect(satsForFeeRate(220, 1.5)).toBe(330);
  });

  it('computes additional sats required for RBF', () => {
    expect(
      estimateRbfReplacement({
        vbytes: 150,
        currentFeeRate: 2,
        targetFeeRate: 10,
      })
    ).toEqual({
      currentFeeSats: 300,
      replacementFeeSats: 1500,
      additionalFeeSats: 1200,
    });
  });

  it('computes child fee rate needed for CPFP package rescue', () => {
    expect(
      estimateCpfpPackage({
        parentVbytes: 180,
        parentFeeRate: 2,
        childVbytes: 140,
        targetPackageFeeRate: 8,
      })
    ).toEqual({
      parentFeeSats: 360,
      requiredPackageFeeSats: 2560,
      childFeeSats: 2200,
      childFeeRate: expect.closeTo(15.7142857143, 8),
    });
  });
});
