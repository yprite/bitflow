import { createCipheriv } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import {
  buildBtcReturnsSection,
  decryptCoinglassResponseData,
} from './btc-returns';

function encryptFixture(plaintext: string, key: string): string {
  const compressed = gzipSync(Buffer.from(plaintext, 'utf8'));
  const cipher = createCipheriv('aes-128-ecb', Buffer.from(key, 'utf8'), null);
  cipher.setAutoPadding(true);

  return Buffer.concat([
    cipher.update(compressed),
    cipher.final(),
  ]).toString('base64');
}

describe('decryptCoinglassResponseData', () => {
  it('decrypts a v1 CoinGlass payload using the api path seed', () => {
    const url = 'https://capi.coinglass.com/api/spot/pricePerformance?symbol=BTC';
    const payload = { hello: 'world', count: 2 };
    const actualKey = '1234567890abcdef';
    const seedKey = Buffer.from('/api/spot/pricePerformance').toString('base64').slice(0, 16);

    const userToken = encryptFixture(actualKey, seedKey);
    const encryptedData = encryptFixture(JSON.stringify(payload), actualKey);

    const decrypted = decryptCoinglassResponseData({
      url,
      encryptedData,
      userToken,
      cacheTs: '1741950000000',
      version: '1',
    });

    expect(JSON.parse(decrypted)).toEqual(payload);
  });
});

describe('buildBtcReturnsSection', () => {
  it('maps monthly history into descending year rows with summary rows', () => {
    const section = buildBtcReturnsSection('monthly', {
      '2024': [
        { month: 1, priceChangePercent: 2.5 },
        { month: 2, priceChangePercent: 1.0 },
        { month: 3, priceChangePercent: 0.5 },
      ],
      '2025': [
        { month: 1, priceChangePercent: 3.75 },
        { month: 2, priceChangePercent: 4.5 },
        { month: 3, priceChangePercent: -1.0 },
      ],
      '2026': [
        { month: 1, priceChangePercent: 1.25 },
        { month: 2, priceChangePercent: -2.5 },
      ],
    });

    expect(section.columns.slice(0, 3)).toEqual(['1월', '2월', '3월']);
    expect(section.rows[0]).toEqual({
      label: '2026',
      values: [1.25, -2.5, null, null, null, null, null, null, null, null, null, null],
    });
    expect(section.rows[1]).toEqual({
      label: '2025',
      values: [3.75, 4.5, -1, null, null, null, null, null, null, null, null, null],
    });
    expect(section.rows[3]).toEqual({
      label: '평균',
      values: [2.5, 1, -0.25, null, null, null, null, null, null, null, null, null],
    });
    expect(section.rows[4]).toEqual({
      label: '중앙값',
      values: [2.5, 1, -0.25, null, null, null, null, null, null, null, null, null],
    });
  });

  it('maps quarterly history with explicit quarter indices and array-order fallback', () => {
    const section = buildBtcReturnsSection('quarterly', {
      '2025': [
        { priceChangePercent: -2.25 },
        { priceChangePercent: 8.75 },
        { priceChangePercent: 1.0 },
        { priceChangePercent: -4.5 },
      ],
      '2026': [
        { quarterly: 1, priceChangePercent: 12.5 },
      ],
    });

    expect(section.columns).toEqual(['1분기', '2분기', '3분기', '4분기']);
    expect(section.rows[0]).toEqual({
      label: '2026',
      values: [12.5, null, null, null],
    });
    expect(section.rows[1]).toEqual({
      label: '2025',
      values: [-2.25, 8.75, 1, -4.5],
    });
    expect(section.rows[2]).toEqual({
      label: '평균',
      values: [5.13, 8.75, 1, -4.5],
    });
    expect(section.rows[3]).toEqual({
      label: '중앙값',
      values: [5.13, 8.75, 1, -4.5],
    });
  });
});
