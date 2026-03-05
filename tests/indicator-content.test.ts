import { describe, expect, it } from 'vitest';
import {
  INDICATOR_CONFIGS,
  getGlossaryEntries,
  getGlossarySlugs,
  getIndicatorSlugs,
} from '../src/lib/indicator-content';

describe('indicator content', () => {
  it('contains 5 indicator detail routes', () => {
    expect(getIndicatorSlugs()).toHaveLength(5);
  });

  it('contains at least 10 glossary entries', () => {
    expect(getGlossaryEntries().length).toBeGreaterThanOrEqual(10);
  });

  it('has unique indicator slugs', () => {
    const slugs = INDICATOR_CONFIGS.map((item) => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has unique glossary slugs', () => {
    const slugs = getGlossarySlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
