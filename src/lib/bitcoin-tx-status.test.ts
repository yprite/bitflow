import { describe, expect, it } from 'vitest';
import { deriveBitcoinTxStatusSnapshot } from './bitcoin-tx-status';

describe('bitcoin-tx-status', () => {
  it('derives mempool stage and fee band for unconfirmed transactions', () => {
    const snapshot = deriveBitcoinTxStatusSnapshot({
      tx: {
        txid: 'a'.repeat(64),
        fee: 1200,
        weight: 560,
        vout: [{ value: 100_000 }, { value: 200_000 }],
        status: { confirmed: false },
      },
      tipHeight: 940_000,
      fees: {
        fastestFee: 10,
        halfHourFee: 6,
        hourFee: 3,
        economyFee: 1,
        minimumFee: 1,
      },
    });

    expect(snapshot.stage).toBe('mempool');
    expect(snapshot.vsize).toBe(140);
    expect(snapshot.feeRate).toBeCloseTo(8.5714, 4);
    expect(snapshot.targetBand).toBe('half_hour');
    expect(snapshot.totalOutputSats).toBe(300_000);
  });

  it('derives confirmations for confirmed transactions', () => {
    const snapshot = deriveBitcoinTxStatusSnapshot({
      tx: {
        txid: 'b'.repeat(64),
        fee: 900,
        weight: 720,
        vout: [{ value: 1_000_000 }],
        status: {
          confirmed: true,
          block_height: 939_995,
          block_hash: 'c'.repeat(64),
          block_time: 1_700_000_000,
        },
      },
      tipHeight: 940_000,
      fees: {
        fastestFee: 8,
        halfHourFee: 5,
        hourFee: 2,
        economyFee: 1,
        minimumFee: 1,
      },
    });

    expect(snapshot.stage).toBe('confirmed');
    expect(snapshot.confirmations).toBe(6);
    expect(snapshot.stageLabel).toBe('확정 완료');
    expect(snapshot.targetBand).toBeNull();
    expect(snapshot.blockTime).toBe('2023-11-14T22:13:20.000Z');
  });
});
