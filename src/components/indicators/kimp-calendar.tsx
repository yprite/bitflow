'use client';

import type { ExtendedKimpHistoryPoint, DailyKimpSummary } from '@/lib/types';
import LivePulse from '@/components/motion/indicators/LivePulse';
import { clamp } from '@/components/motion/core/dot-math';

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

/**
 * Halftone cell: renders 1-4 dots inside a cell, sized by premium magnitude.
 * Higher |premium| → more dots, larger radius.
 * Positive → darker/denser. Negative → lighter/sparser.
 */
function HalftoneCell({ avg, size }: { avg: number; size: number }) {
  const absAvg = Math.abs(avg);
  const intensity = clamp(absAvg / 5, 0, 1); // 0–1 based on 0–5% range

  // Number of dots: 1 for low, up to 4 for extreme
  const dotCount = Math.max(1, Math.min(4, Math.ceil(intensity * 4)));

  // Dot radius: scales with intensity
  const maxR = size * 0.38;
  const minR = size * 0.1;

  // For single dot, center it. For multiple, arrange in a grid pattern.
  const positions: Array<[number, number]> = dotCount === 1
    ? [[size / 2, size / 2]]
    : dotCount === 2
      ? [[size * 0.33, size * 0.5], [size * 0.67, size * 0.5]]
      : dotCount === 3
        ? [[size * 0.5, size * 0.3], [size * 0.3, size * 0.7], [size * 0.7, size * 0.7]]
        : [[size * 0.3, size * 0.3], [size * 0.7, size * 0.3], [size * 0.3, size * 0.7], [size * 0.7, size * 0.7]];

  const r = minR + intensity * (maxR - minR);
  const baseOpacity = 0.12 + intensity * 0.7;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      {positions.map(([cx, cy], i) => {
        // Each successive dot slightly smaller
        const dotR = r * (1 - i * 0.08);
        const dotO = baseOpacity * (1 - i * 0.1);
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={Math.max(dotR, minR)}
            fill="#1a1a1a"
            opacity={dotO}
          />
        );
      })}
    </svg>
  );
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const CELL_SIZE = 16;

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

  const firstDate = new Date(daily[0].date + 'T00:00:00');
  const lastDate = new Date(daily[daily.length - 1].date + 'T00:00:00');
  const dailyMap = new Map(daily.map((d) => [d.date, d]));

  const weeks: Array<Array<{ date: string; summary: DailyKimpSummary | null; inRange: boolean }>> = [];
  let currentWeek: Array<{ date: string; summary: DailyKimpSummary | null; inRange: boolean }> = [];

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
          <div className="inline-flex gap-px">
            {/* Day labels */}
            <div className="flex flex-col gap-px mr-1">
              {DAY_LABELS.map((d) => (
                <div
                  key={d}
                  className="flex items-center justify-center text-[8px] text-dot-muted"
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-px">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`rounded-[1px] ${
                      day.inRange ? 'bg-gray-50' : ''
                    }`}
                    style={{ width: CELL_SIZE, height: CELL_SIZE }}
                    title={
                      day.summary
                        ? `${day.date}: 평균 ${day.summary.avg.toFixed(2)}% (${day.summary.count}개)`
                        : day.date
                    }
                  >
                    {day.summary ? (
                      <HalftoneCell avg={day.summary.avg} size={CELL_SIZE} />
                    ) : day.inRange ? (
                      /* Empty in-range cell: single ghost dot */
                      <svg width={CELL_SIZE} height={CELL_SIZE} viewBox={`0 0 ${CELL_SIZE} ${CELL_SIZE}`} className="block">
                        <circle cx={CELL_SIZE / 2} cy={CELL_SIZE / 2} r={1} fill="#1a1a1a" opacity={0.04} />
                      </svg>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend: dot size explains intensity */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-[9px] text-dot-muted">낮음</span>
          {[0.5, 1.5, 3, 5].map((v) => (
            <svg key={v} width={12} height={12} viewBox="0 0 12 12">
              <circle
                cx={6}
                cy={6}
                r={1 + clamp(v / 5, 0, 1) * 3.5}
                fill="#1a1a1a"
                opacity={0.15 + clamp(v / 5, 0, 1) * 0.7}
              />
            </svg>
          ))}
          <span className="text-[9px] text-dot-muted">높음</span>
        </div>
      </div>
    </div>
  );
}
