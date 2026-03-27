import { describe, expect, it } from 'vitest';
import { resolveChromePath } from './news-ingest-lib.mjs';

describe('resolveChromePath', () => {
  it('prefers an explicit BITFLOW_CHROME_PATH override', () => {
    expect(
      resolveChromePath({
        env: {
          BITFLOW_CHROME_PATH: '/custom/chrome',
        },
        pathExists: () => false,
        appDirectories: [],
      })
    ).toBe('/custom/chrome');
  });

  it('finds Chrome inside a renamed application bundle when the default app is missing', () => {
    const renamedChromePath = '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';

    expect(
      resolveChromePath({
        env: {},
        pathExists: (candidate) => candidate === renamedChromePath,
        appDirectories: ['/Applications/Google Chrome 2.app'],
      })
    ).toBe(renamedChromePath);
  });
});
