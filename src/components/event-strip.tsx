'use client';

import LivePulse from './motion/indicators/LivePulse';
import { getUpcomingEvents, type MarketEventWithCountdown } from '@/lib/events';

// ── Color mapping per event type ───────────────────────────
const TYPE_COLORS: Record<string, string> = {
  fomc: '#e53935',
  cpi: '#f9a825',
  employment: '#1e88e5',
  etf: '#00c853',
  halving: '#00c853',
  other: '#9ca3af',
};

const TYPE_LABELS: Record<string, string> = {
  fomc: 'FOMC',
  cpi: 'CPI',
  employment: '고용',
  etf: 'ETF',
  halving: '반감기',
  other: '기타',
};

const TYPE_TAGS: Record<string, string> = {
  fomc: '높은 변동성 예상',
  cpi: '인플레이션 데이터',
  employment: '고용 시장',
  etf: 'ETF 관련',
  halving: '반감기',
  other: '',
};

// ── Tailwind badge bg classes (low-opacity tints) ──────────
const TYPE_BADGE_CLASSES: Record<string, string> = {
  fomc: 'bg-red-50 text-dot-red border-red-200',
  cpi: 'bg-yellow-50 text-dot-yellow border-yellow-300',
  employment: 'bg-blue-50 text-dot-blue border-blue-200',
  etf: 'bg-emerald-50 text-dot-green border-emerald-200',
  halving: 'bg-emerald-50 text-dot-green border-emerald-200',
  other: 'bg-gray-50 text-dot-muted border-gray-200',
};

// ── Format date for display ────────────────────────────────
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[d.getDay()];
  return `${month}/${day} (${weekday})`;
}

// ── Countdown badge ────────────────────────────────────────
function CountdownBadge({ daysUntil }: { daysUntil: number }) {
  if (daysUntil === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold font-mono px-1.5 py-0.5 bg-dot-accent text-white tracking-wide">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-white"
          style={{ animation: 'livePulse 1.5s ease-in-out infinite' }}
        />
        오늘
      </span>
    );
  }

  return (
    <span className="text-[10px] font-semibold font-mono text-dot-muted px-1.5 py-0.5 bg-gray-100 border border-gray-200 tabular-nums">
      D-{daysUntil}
    </span>
  );
}

// ── Single event row ───────────────────────────────────────
function EventRow({
  event,
  index,
}: {
  event: MarketEventWithCountdown;
  index: number;
}) {
  const color = TYPE_COLORS[event.type] || TYPE_COLORS.other;
  const badgeClass = TYPE_BADGE_CLASSES[event.type] || TYPE_BADGE_CLASSES.other;
  const label = TYPE_LABELS[event.type] || '기타';
  const tag = TYPE_TAGS[event.type] || '';
    const isToday = event.daysUntil === 0;

  return (
    <div
      className={`flex items-center gap-3 py-2.5 ${index > 0 ? 'border-t border-dashed border-gray-200' : ''}`}
    >
      {/* Color indicator dot */}
      <span
        className="flex-shrink-0 w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />

      {/* Date */}
      <span className={`font-mono text-xs tabular-nums flex-shrink-0 w-[72px] ${isToday ? 'text-dot-accent font-semibold' : 'text-dot-sub'}`}>
        {formatDate(event.date)}
      </span>

      {/* Type badge */}
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 border flex-shrink-0 ${badgeClass}`}>
        {label}
      </span>

      {/* Title & tag */}
      <div className="flex-1 min-w-0">
        <span className={`text-xs truncate block ${isToday ? 'text-dot-text font-medium' : 'text-dot-sub'}`}>
          {event.title}
        </span>
        {tag && (
          <span className="text-[10px] text-dot-muted block truncate">
            {tag}
          </span>
        )}
      </div>

      {/* Time */}
      {event.time && (
        <span className="text-[10px] font-mono text-dot-muted flex-shrink-0 hidden sm:block">
          {event.time}
        </span>
      )}

      {/* Countdown */}
      <CountdownBadge daysUntil={event.daysUntil} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function EventStrip() {
  const events = getUpcomingEvents(5);

  if (events.length === 0) {
    return null;
  }

  const nextEvent = events[0];
  const nextColor = TYPE_COLORS[nextEvent.type] || TYPE_COLORS.other;

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider flex items-center gap-1.5">
            <LivePulse size={4} color={nextColor} />
            매크로 이벤트 캘린더
          </h2>
          {nextEvent.daysUntil <= 3 && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 border"
              style={{
                color: nextColor,
                borderColor: nextColor,
                backgroundColor: `${nextColor}08`,
              }}
            >
              {nextEvent.daysUntil === 0
                ? '오늘 발표'
                : `다음 이벤트 D-${nextEvent.daysUntil}`}
            </span>
          )}
        </div>

        {/* Event list */}
        <div>
          {events.map((event, i) => (
            <EventRow
              key={`${event.date}-${event.type}`}
              event={event}
              index={i}
            />
          ))}
        </div>

        {/* Insight line */}
        <p className="dot-insight">
          {nextEvent.daysUntil === 0
            ? `${TYPE_LABELS[nextEvent.type]} 발표일 — 변동성 확대 대비 필요`
            : nextEvent.daysUntil <= 2
              ? `${TYPE_LABELS[nextEvent.type]} D-${nextEvent.daysUntil} — 포지션 리스크 점검 권장`
              : `다음 주요 이벤트: ${formatDate(nextEvent.date)} ${TYPE_LABELS[nextEvent.type]}`}
        </p>
      </div>
    </div>
  );
}
