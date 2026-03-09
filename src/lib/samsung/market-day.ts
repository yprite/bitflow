const KST_TIMEZONE = 'Asia/Seoul';
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: KST_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
};

export function getMarketDate(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', DATE_FORMAT_OPTIONS).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export function getMarketDateObj(): Date {
  const dateStr = getMarketDate();
  return new Date(`${dateStr}T00:00:00+09:00`);
}

export function formatMarketDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', DATE_FORMAT_OPTIONS).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}
