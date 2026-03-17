import type { OnchainMetricSummary } from '@/lib/types';

interface OnchainMetricCardProps {
  metric: OnchainMetricSummary;
}

function formatDate(value: string | null): string {
  if (!value) return '—';

  return new Date(`${value}T00:00:00Z`).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatMetricValue(unit: string, value: number | null, compact = false): string {
  if (value === null) return '수집 중';

  if (unit === 'percent') {
    return `${value.toFixed(compact ? 1 : 2)}%`;
  }

  if (unit === 'btc') {
    return `${value.toLocaleString('en-US', {
      minimumFractionDigits: compact ? 0 : 2,
      maximumFractionDigits: compact ? 1 : 2,
    })} BTC`;
  }

  return value.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
}

function getDeltaTone(changeValue: number | null) {
  if (changeValue === null || changeValue === 0) {
    return { className: 'text-dot-muted', label: changeValue === null ? '' : '변화 없음' };
  }

  if (changeValue > 0) {
    return { className: 'text-dot-green', label: '전일 대비 증가' };
  }

  return { className: 'text-dot-red', label: '전일 대비 감소' };
}

function Sparkline({ metric }: { metric: OnchainMetricSummary }) {
  if (metric.series.length < 2) {
    return (
      <div className="flex h-20 items-center justify-center rounded-sm border border-dashed border-dot-border/30 bg-white/60 px-3 py-2 text-[11px] text-dot-muted">
        데이터가 쌓이면 추이 차트가 표시됩니다
      </div>
    );
  }

  const values = metric.series.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = metric.series
    .map((point, index) => {
      const x = (index / (metric.series.length - 1)) * 100;
      const y = 100 - ((point.value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  const area = `0,100 ${points} 100,100`;

  return (
    <div className="space-y-2">
      <div className="h-20 rounded-sm border border-dot-border/30 bg-white/70 p-2">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <polygon points={area} fill="rgba(39, 86, 73, 0.08)" />
          <polyline
            points={points}
            fill="none"
            stroke="#275649"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-dot-muted">
        <span>{formatDate(metric.series[0]?.day ?? null)}</span>
        <span>{formatDate(metric.series.at(-1)?.day ?? null)}</span>
      </div>
    </div>
  );
}

export default function OnchainMetricCard({ metric }: OnchainMetricCardProps) {
  const delta = getDeltaTone(metric.changeValue);
  const changeText =
    metric.changeValue === null
      ? '비교 데이터 수집 중'
      : `${metric.changeValue > 0 ? '+' : ''}${formatMetricValue(metric.unit, metric.changeValue, true)}${
          metric.changePercent === null
            ? ''
            : ` (${metric.changePercent > 0 ? '+' : ''}${metric.changePercent.toFixed(1)}%)`
        }`;

  return (
    <article className="dot-card h-full p-4 sm:p-5">
      <div className="dot-card-inner space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              {metric.label}
            </p>
            <h2 className="text-lg font-semibold text-dot-accent tracking-tight">
              {formatMetricValue(metric.unit, metric.latestValue)}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-dot-muted">
            {formatDate(metric.latestDay)}
          </span>
        </div>

        <p className="text-xs text-dot-sub leading-relaxed">{metric.description}</p>

        <Sparkline metric={metric} />

        <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
          <span className={delta.className}>{changeText}</span>
          <span className="text-dot-muted">{delta.label}</span>
        </div>
      </div>
    </article>
  );
}
