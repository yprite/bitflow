import type { OnchainDormancyPulseData } from '@/lib/types';

interface OnchainDormancyPulseCardProps {
  data: OnchainDormancyPulseData;
}

const TONE_META = {
  calm: {
    badge: 'border-dot-green/30 bg-dot-green/10 text-dot-green',
    label: '차분',
    bar: 'bg-dot-green/80',
  },
  watch: {
    badge: 'border-dot-yellow/30 bg-dot-yellow/10 text-dot-yellow',
    label: '주의',
    bar: 'bg-dot-yellow/80',
  },
  spike: {
    badge: 'border-dot-red/30 bg-dot-red/10 text-dot-red',
    label: '급증',
    bar: 'bg-dot-red/80',
  },
} as const;

function formatBtc(value: number): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value >= 100 ? 0 : 1,
    maximumFractionDigits: value >= 100 ? 0 : 1,
  })} BTC`;
}

function formatShortDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function OnchainDormancyPulseCard({ data }: OnchainDormancyPulseCardProps) {
  const tone = TONE_META[data.tone];
  const maxValue = Math.max(...data.series.map((point) => point.value), data.latestValue, 1);

  return (
    <article className="dot-card h-full p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              Dormancy Pulse
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-dot-accent">
              {formatBtc(data.latestValue)}
            </h2>
          </div>
          <span className={`inline-flex rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${tone.badge}`}>
            {tone.label}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-dot-sub">{data.summary}</p>

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-dot-muted">
            <span>최근 7일 휴면 코인 이동</span>
            <span>avg x{data.ratio.toFixed(1)}</span>
          </div>
          <div className="grid h-24 grid-cols-7 items-end gap-1">
            {data.series.map((point) => {
              const height = Math.max((point.value / maxValue) * 100, point.value > 0 ? 8 : 5);

              return (
                <div key={point.day} className="flex h-full flex-col items-center justify-end gap-1">
                  <div className="flex h-20 w-full items-end">
                    <div
                      className={`w-full rounded-t-sm ${tone.bar}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-dot-muted">{formatShortDate(point.day)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">최근값</p>
            <p className="mt-1 text-dot-accent">{formatBtc(data.latestValue)}</p>
          </div>
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">직전 평균</p>
            <p className="mt-1 text-dot-accent">{formatBtc(data.baselineValue)}</p>
          </div>
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">활성 공급 30D</p>
            <p className="mt-1 text-dot-accent">
              {data.active30dRatio === null ? 'N/A' : `${data.active30dRatio.toFixed(1)}%`}
            </p>
          </div>
        </div>

        <p className="dot-insight">
          휴면 코인 이동은 장기 보유자의 행동 변화를 보여줍니다. 급증이 며칠 이어질수록 해석 강도가 높아집니다.
        </p>
      </div>
    </article>
  );
}
