import type { OnchainFeePressureData } from '@/lib/types';

interface OnchainFeePressureCardProps {
  data: OnchainFeePressureData;
}

const PRESSURE_META: Record<
  OnchainFeePressureData['pressure'],
  { chip: string; label: string; insight: string }
> = {
  완화: {
    chip: 'border-dot-green/30 bg-dot-green/10 text-dot-green',
    label: '완화',
    insight: '즉시 확정 수수료 부담이 낮아 네트워크가 비교적 비어 있습니다.',
  },
  균형: {
    chip: 'border-dot-yellow/30 bg-dot-yellow/10 text-dot-yellow',
    label: '균형',
    insight: '급한 거래와 일반 거래 간 수수료 차이가 적당히 벌어진 상태입니다.',
  },
  혼잡: {
    chip: 'border-dot-red/30 bg-dot-red/10 text-dot-red',
    label: '혼잡',
    insight: '상위 수수료 경쟁이 붙어 빠른 확정 비용이 높아진 상태입니다.',
  },
};

function formatFee(value: number): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })} sat/vB`;
}

function formatVsize(value: number): string {
  return `${(value / 1_000_000).toFixed(1)} vMB`;
}

function formatBtc(value: number): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value >= 10 ? 0 : 2,
    maximumFractionDigits: 2,
  })} BTC`;
}

export default function OnchainFeePressureCard({ data }: OnchainFeePressureCardProps) {
  const meta = PRESSURE_META[data.pressure];
  const maxProjectedFee = Math.max(...data.projectedBlocks.map((block) => block.medianFee), 1);

  return (
    <article className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              Mempool / Fee Pressure
            </p>
            <h2 className="text-lg font-semibold text-dot-accent tracking-tight">
              {formatFee(data.fastestFee)}
            </h2>
          </div>
          <span className={`inline-flex rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${meta.chip}`}>
            {meta.label}
          </span>
        </div>

        <p className="text-xs text-dot-sub leading-relaxed">{meta.insight}</p>

        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">즉시</p>
            <p className="mt-1 text-dot-accent">{formatFee(data.fastestFee)}</p>
          </div>
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">30분</p>
            <p className="mt-1 text-dot-accent">{formatFee(data.halfHourFee)}</p>
          </div>
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">1시간</p>
            <p className="mt-1 text-dot-accent">{formatFee(data.hourFee)}</p>
          </div>
        </div>

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-2">
          {data.projectedBlocks.map((block, index) => (
            <div key={`${block.medianFee}-${index}`} className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-dot-muted">
                <span>예상 {index + 1}블록</span>
                <span>{formatFee(block.medianFee)}</span>
              </div>
              <div className="h-2 rounded-full bg-dot-border/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-dot-accent/80"
                  style={{ width: `${Math.max((block.medianFee / maxProjectedFee) * 100, 8)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 text-[11px] font-mono text-dot-sub">
          <span>{data.mempoolTxCount.toLocaleString('ko-KR')} tx 대기</span>
          <span>{formatVsize(data.mempoolVsize)}</span>
          <span>{formatBtc(data.totalFeeBtc)}</span>
        </div>
      </div>
    </article>
  );
}
