import type { OnchainFlowPressureData } from '@/lib/types';

interface OnchainFlowPressureCardProps {
  data: OnchainFlowPressureData;
}

const TONE_META = {
  inflow: {
    badge: 'border-dot-red/30 bg-dot-red/10 text-dot-red',
    label: '순유입 우세',
    tone: 'text-dot-red',
  },
  outflow: {
    badge: 'border-dot-green/30 bg-dot-green/10 text-dot-green',
    label: '순유출 우세',
    tone: 'text-dot-green',
  },
  balanced: {
    badge: 'border-dot-border/40 bg-white/80 text-dot-muted',
    label: '균형',
    tone: 'text-dot-accent',
  },
} as const;

function formatBtc(value: number): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: Math.abs(value) >= 100 ? 0 : 1,
    maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 1,
  })} BTC`;
}

function formatDay(value: string | null): string {
  if (!value) return '최신';
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function OnchainFlowPressureCard({ data }: OnchainFlowPressureCardProps) {
  const tone = TONE_META[data.tone];
  const totalFlow = Math.max(data.totalReceivedBtc + data.totalSentBtc, 1);
  const receivedWidth = Math.max((data.totalReceivedBtc / totalFlow) * 100, data.totalReceivedBtc > 0 ? 8 : 0);
  const sentWidth = Math.max((data.totalSentBtc / totalFlow) * 100, data.totalSentBtc > 0 ? 8 : 0);
  const scopeLabel = data.scope === 'exchange' ? 'exchange labels' : 'labeled entities';

  return (
    <article className="dot-card h-full p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              Exchange Inflow / Netflow
            </p>
            <h2 className={`text-lg font-semibold tracking-tight ${tone.tone}`}>
              {data.netflowBtc > 0 ? '+' : ''}
              {formatBtc(data.netflowBtc)}
            </h2>
          </div>
          <div className="text-right">
            <span className={`inline-flex rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${tone.badge}`}>
              {tone.label}
            </span>
            <p className="mt-2 text-[10px] font-mono text-dot-muted">{formatDay(data.latestDay)}</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-dot-sub">
          {data.summary}
        </p>

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-dot-muted">
              <span>{data.scope === 'exchange' ? '거래소 라벨 흐름' : '라벨 엔티티 흐름'}</span>
              <span>{data.trackedEntityCount} entities</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-stone-100">
              <div className="bg-dot-red/75" style={{ width: `${receivedWidth}%` }} />
              <div className="bg-dot-green/80" style={{ width: `${sentWidth}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-dot-muted">
              <span>유입 {formatBtc(data.totalReceivedBtc)}</span>
              <span>유출 {formatBtc(data.totalSentBtc)}</span>
            </div>
          </div>

          <div className="space-y-2">
            {data.leaders.map((entry) => (
              <div
                key={`${entry.entitySlug}-${entry.direction}`}
                className="rounded-sm border border-dot-border/30 bg-white/80 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3 text-[11px] font-mono">
                  <div className="space-y-1">
                    <p className="text-dot-text">{entry.entitySlug}</p>
                    <p className="text-[10px] text-dot-muted">
                      유입 {formatBtc(entry.receivedBtc)} / 유출 {formatBtc(entry.sentBtc)} / tx {entry.txCount}
                    </p>
                  </div>
                  <p className={entry.direction === 'inflow' ? 'text-dot-red' : 'text-dot-green'}>
                    {entry.netflowBtc > 0 ? '+' : ''}
                    {formatBtc(entry.netflowBtc)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="dot-insight">
          현재 범위는 {scopeLabel} 기준입니다. 거래소 라벨이 채워질수록 실제 매도 대기 물량 해석력이 더 좋아집니다.
        </p>
      </div>
    </article>
  );
}
