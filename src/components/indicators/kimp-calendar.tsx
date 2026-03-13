'use client';

import type { ExtendedKimpHistoryPoint, DailyKimpSummary } from '@/lib/types';
import LivePulse from '@/components/motion/indicators/LivePulse';

interface Props {
  data: ExtendedKimpHistoryPoint[];
}

function aggregateDaily(data: ExtendedKimpHistoryPoint[]): DailyKimpSummary[] {
  const map = new Map<string, number[]>();

  for (const point of data) {
    const date = new Date(point.collectedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const arr = map.get(key);
    if (arr) {
      arr.push(point.value);
    } else {
      map.set(key, [point.value]);
    }
  }

  return Array.from(map.entries())
    .map(([date, values]) => ({
      date,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getCellColor(avg: number): string {
  if (avg >= 5) return 'bg-red-500';
  if (avg >= 3) return 'bg-red-400';
  if (avg >= 2) return 'bg-red-300';
  if (avg >= 1) return 'bg-orange-200';
  if (avg >= 0) return 'bg-gray-200';
  if (avg >= -1) return 'bg-blue-200';
  if (avg >= -2) return 'bg-blue-300';
  return 'bg-blue-400';
}

function getCellTextColor(avg: number): string {
  if (avg >= 3 || avg <= -2) return 'text-white';
  return 'text-dot-muted';
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export default function KimpCalendar({ data }: Props) {
  const daily = aggregateDaily(data);

  if (daily.length < 2) {
    return (
      <div className="dot-card p-6">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-4">김프 히트맵 캘린더</h2>
        <p className="text-dot-muted text-sm">히스토리 데이터가 쌓이면 표시됩니다.</p>
      </div>
    );
  }

  // Build a grid: fill from first date to last date
  const firstDate = new Date(daily[0].date + 'T00:00:00');
  const lastDate = new Date(daily[daily.length - 1].date + 'T00:00:00');
  const dailyMap = new Map(daily.map((d) => [d.date, d]));

  // Build weeks array
  const weeks: Array<Array<{ date: string; summary: DailyKimpSummary | null; inRange: boolean }>> = [];
  let currentWeek: Array<{ date: string; summary: DailyKimpSummary | null; inRange: boolean }> = [];

  // Start from Monday of the first week
  const startDay = firstDate.getDay();
  const mondayOffset = startDay === 0 ? 6 : startDay - 1;
  const gridStart = new Date(firstDate);
  gridStart.setDate(gridStart.getDate() - mondayOffset);

  const cursor = new Date(gridStart);
  while (cursor <= lastDate || currentWeek.length > 0) {
    const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    const inRange = cursor >= firstDate && cursor <= lastDate;
    currentWeek.push({ date: dateStr, summary: dailyMap.get(dateStr) ?? null, inRange });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
      if (cursor > lastDate) break;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: '', summary: null, inRange: false });
    }
    weeks.push(currentWeek);
  }

  return (
    <div className="dot-card p-4 sm:p-6">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-1.5">
          <LivePulse size={4} />
          김프 히트맵 캘린더
        </h2>

        <div className="overflow-x-auto">
          <div className="inline-flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAY_LABELS.map((d) => (
                <div key={d} className="w-4 h-4 flex items-center justify-center text-[8px] text-dot-muted">
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-4 h-4 rounded-[2px] flex items-center justify-center ${
                      day.summary
                        ? getCellColor(day.summary.avg)
                        : day.inRange
                          ? 'bg-gray-100'
                          : 'bg-transparent'
                    }`}
                    title={
                      day.summary
                        ? `${day.date}: 평균 ${day.summary.avg.toFixed(2)}% (${day.summary.count}개)`
                        : day.date
                    }
                  >
                    {day.summary && (
                      <span className={`text-[5px] font-mono leading-none ${getCellTextColor(day.summary.avg)}`}>
                        {day.summary.avg.toFixed(1)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-1 mt-3">
          <span className="text-[9px] text-dot-muted">역프</span>
          {['bg-blue-400', 'bg-blue-300', 'bg-blue-200', 'bg-gray-200', 'bg-orange-200', 'bg-red-300', 'bg-red-400', 'bg-red-500'].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-[1px] ${c}`} />
          ))}
          <span className="text-[9px] text-dot-muted">양프</span>
        </div>
      </div>
    </div>
  );
}
