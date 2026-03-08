export const FOLLOW_TAG_STORAGE_KEY = 'bitflow_follow_tags';
export const ALERT_MODE_STORAGE_KEY = 'bitflow_alert_mode';
export const RECOMMENDED_TAG_COUNT = 3;

export type AlertMode = 'instant' | 'close' | 'off';

export const ALERT_MODE_LABEL: Record<AlertMode, string> = {
  instant: '즉시 알림',
  close: '장마감 요약',
  off: '끄기',
};

export function getTagsForTheme(theme: string): string[] {
  if (theme.includes('HBM') || theme.includes('반도체')) {
    return ['반도체'];
  }

  if (theme.includes('조선') || theme.includes('방산')) {
    return ['조선', '방산'];
  }

  if (theme.includes('배당') || theme.includes('금융') || theme.includes('자사주')) {
    return ['배당'];
  }

  if (theme.includes('코스닥')) {
    return ['코스닥'];
  }

  if (theme.includes('전력 인프라') || theme.includes('전력')) {
    return ['전력 인프라'];
  }

  return [];
}

export function hasMatchingTag(itemTags: string[] | undefined, selectedTags: string[]): boolean {
  if (!itemTags?.length || !selectedTags.length) {
    return false;
  }

  return itemTags.some((tag) => selectedTags.includes(tag));
}

export function prioritizeBySelectedTags<T extends { tags?: string[] }>(
  items: T[],
  selectedTags: string[]
): T[] {
  if (!selectedTags.length) {
    return items;
  }

  const prioritized = items.filter((item) => hasMatchingTag(item.tags, selectedTags));
  const rest = items.filter((item) => !hasMatchingTag(item.tags, selectedTags));

  return [...prioritized, ...rest];
}
