/**
 * Macro event calendar for Korean Bitcoin investors.
 *
 * Contains real 2026 FOMC, CPI, and Employment report dates.
 * All times are in Korean Standard Time (KST / UTC+9).
 */

export interface MarketEvent {
  date: string;          // ISO date string (YYYY-MM-DD)
  time?: string;         // Korean time if known (e.g., "03:00")
  title: string;         // Korean title
  type: 'fomc' | 'cpi' | 'employment' | 'etf' | 'halving' | 'other';
  impact: 'high' | 'medium' | 'low';
  description?: string;  // Brief Korean description
}

export interface MarketEventWithCountdown extends MarketEvent {
  /** Number of days from today (0 = today, 1 = tomorrow, etc.) */
  daysUntil: number;
}

// ── FOMC 2026 ──────────────────────────────────────────────
const FOMC_2026: MarketEvent[] = [
  {
    date: '2026-01-28',
    time: '04:00',
    title: 'FOMC 금리 결정',
    type: 'fomc',
    impact: 'high',
    description: '연방준비제도 1월 금리 결정 발표',
  },
  {
    date: '2026-03-18',
    time: '04:00',
    title: 'FOMC 금리 결정',
    type: 'fomc',
    impact: 'high',
    description: '연방준비제도 3월 금리 결정 및 점도표 발표',
  },
  {
    date: '2026-05-06',
    time: '04:00',
    title: 'FOMC 금리 결정',
    type: 'fomc',
    impact: 'high',
    description: '연방준비제도 5월 금리 결정 발표',
  },
  {
    date: '2026-06-17',
    time: '04:00',
    title: 'FOMC 금리 결정',
    type: 'fomc',
    impact: 'high',
    description: '연방준비제도 6월 금리 결정 및 점도표 발표',
  },
  {
    date: '2026-07-29',
    time: '04:00',
    title: 'FOMC 금리 결정',
    type: 'fomc',
    impact: 'high',
    description: '연방준비제도 7월 금리 결정 발표',
  },
  {
    date: '2026-09-16',
    time: '04:00',
    title: 'FOMC 금리 결정',
    type: 'fomc',
    impact: 'high',
    description: '연방준비제도 9월 금리 결정 및 점도표 발표',
  },
  {
    date: '2026-10-28',
    time: '04:00',
    title: 'FOMC 금리 결정',
    type: 'fomc',
    impact: 'high',
    description: '연방준비제도 10월 금리 결정 발표',
  },
  {
    date: '2026-12-16',
    time: '04:00',
    title: 'FOMC 금리 결정',
    type: 'fomc',
    impact: 'high',
    description: '연방준비제도 12월 금리 결정 및 점도표 발표',
  },
];

// ── US CPI Release 2026 ────────────────────────────────────
const CPI_2026: MarketEvent[] = [
  { date: '2026-01-14', time: '22:30', title: '미국 CPI 발표', type: 'cpi', impact: 'high', description: '12월 소비자물가지수 발표' },
  { date: '2026-02-11', time: '22:30', title: '미국 CPI 발표', type: 'cpi', impact: 'high', description: '1월 소비자물가지수 발표' },
  { date: '2026-03-11', time: '21:30', title: '미국 CPI 발표', type: 'cpi', impact: 'high', description: '2월 소비자물가지수 발표' },
  { date: '2026-04-14', time: '21:30', title: '미국 CPI 발표', type: 'cpi', impact: 'high', description: '3월 소비자물가지수 발표' },
  { date: '2026-05-12', time: '21:30', title: '미국 CPI 발표', type: 'cpi', impact: 'high', description: '4월 소비자물가지수 발표' },
  { date: '2026-06-10', time: '21:30', title: '미국 CPI 발표', type: 'cpi', impact: 'high', description: '5월 소비자물가지수 발표' },
  { date: '2026-07-14', time: '21:30', title: '미국 CPI 발표', type: 'cpi', impact: 'high', description: '6월 소비자물가지수 발표' },
  { date: '2026-08-12', time: '21:30', title: '미국 CPI 발표', type: 'cpi', impact: 'high', description: '7월 소비자물가지수 발표' },
  { date: '2026-09-16', time: '21:30', title: '미국 CPI 발표', type: 'cpi', impact: 'high', description: '8월 소비자물가지수 발표' },
  { date: '2026-10-14', time: '21:30', title: '미국 CPI 발표', type: 'cpi', impact: 'high', description: '9월 소비자물가지수 발표' },
  { date: '2026-11-12', time: '22:30', title: '미국 CPI 발표', type: 'cpi', impact: 'high', description: '10월 소비자물가지수 발표' },
  { date: '2026-12-10', time: '22:30', title: '미국 CPI 발표', type: 'cpi', impact: 'high', description: '11월 소비자물가지수 발표' },
];

// ── US Employment Report 2026 ──────────────────────────────
const EMPLOYMENT_2026: MarketEvent[] = [
  { date: '2026-01-09', time: '22:30', title: '미국 고용보고서', type: 'employment', impact: 'medium', description: '12월 비농업 고용 및 실업률 발표' },
  { date: '2026-02-06', time: '22:30', title: '미국 고용보고서', type: 'employment', impact: 'medium', description: '1월 비농업 고용 및 실업률 발표' },
  { date: '2026-03-06', time: '22:30', title: '미국 고용보고서', type: 'employment', impact: 'medium', description: '2월 비농업 고용 및 실업률 발표' },
  { date: '2026-04-03', time: '21:30', title: '미국 고용보고서', type: 'employment', impact: 'medium', description: '3월 비농업 고용 및 실업률 발표' },
  { date: '2026-05-08', time: '21:30', title: '미국 고용보고서', type: 'employment', impact: 'medium', description: '4월 비농업 고용 및 실업률 발표' },
  { date: '2026-06-05', time: '21:30', title: '미국 고용보고서', type: 'employment', impact: 'medium', description: '5월 비농업 고용 및 실업률 발표' },
  { date: '2026-07-02', time: '21:30', title: '미국 고용보고서', type: 'employment', impact: 'medium', description: '6월 비농업 고용 및 실업률 발표' },
  { date: '2026-08-07', time: '21:30', title: '미국 고용보고서', type: 'employment', impact: 'medium', description: '7월 비농업 고용 및 실업률 발표' },
  { date: '2026-09-04', time: '21:30', title: '미국 고용보고서', type: 'employment', impact: 'medium', description: '8월 비농업 고용 및 실업률 발표' },
  { date: '2026-10-02', time: '21:30', title: '미국 고용보고서', type: 'employment', impact: 'medium', description: '9월 비농업 고용 및 실업률 발표' },
  { date: '2026-11-06', time: '22:30', title: '미국 고용보고서', type: 'employment', impact: 'medium', description: '10월 비농업 고용 및 실업률 발표' },
  { date: '2026-12-04', time: '22:30', title: '미국 고용보고서', type: 'employment', impact: 'medium', description: '11월 비농업 고용 및 실업률 발표' },
];

// ── All events combined ────────────────────────────────────
const ALL_EVENTS: MarketEvent[] = [
  ...FOMC_2026,
  ...CPI_2026,
  ...EMPLOYMENT_2026,
];

/**
 * Calculate the number of calendar days between today and a target date.
 * Returns 0 if the target is today, negative if in the past.
 */
function daysBetween(today: Date, target: Date): number {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diff = targetStart.getTime() - todayStart.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Returns upcoming macro events sorted by date (ascending).
 *
 * - Filters out past events (only today or future).
 * - Attaches a `daysUntil` countdown field.
 * - Returns the first `count` events (default: 5).
 */
export function getUpcomingEvents(count: number = 5): MarketEventWithCountdown[] {
  const now = new Date();

  return ALL_EVENTS
    .map((event) => {
      const eventDate = new Date(event.date + 'T00:00:00');
      const daysUntil = daysBetween(now, eventDate);
      return { ...event, daysUntil };
    })
    .filter((e) => e.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, count);
}

/**
 * Returns the single closest upcoming event, or null if none remain.
 */
export function getNextEvent(): MarketEventWithCountdown | null {
  const upcoming = getUpcomingEvents(1);
  return upcoming.length > 0 ? upcoming[0] : null;
}
