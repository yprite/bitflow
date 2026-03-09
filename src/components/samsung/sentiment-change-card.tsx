'use client';

interface SentimentChangeCardProps {
  readonly deltaVsPrevClose: number | null;
  readonly delta1h: number | null;
  readonly isFlip: boolean;
}

interface DeltaRowProps {
  readonly label: string;
  readonly value: number | null;
}

function formatDelta(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%p`;
}

function getDeltaColor(value: number): string {
  if (value > 0) return 'text-[#3B82F6]';
  if (value < 0) return 'text-[#EF4444]';
  return 'text-foreground/50';
}

function getDeltaArrow(value: number): string {
  if (value > 0) return '↑';
  if (value < 0) return '↓';
  return '→';
}

function getDeltaDescription(value: number): string {
  if (value > 0) return 'Bull 강세';
  if (value < 0) return 'Bear 강세';
  return '변동 없음';
}

function DeltaRow({ label, value }: DeltaRowProps) {
  if (value === null) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-foreground/60 text-sm">{label}</span>
        <span className="text-foreground/30 text-sm">데이터 없음</span>
      </div>
    );
  }

  const color = getDeltaColor(value);
  const arrow = getDeltaArrow(value);
  const description = getDeltaDescription(value);

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-foreground/60 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-bold text-base ${color}`}>
          {arrow} {formatDelta(value)}
        </span>
        <span className="text-foreground/40 text-xs">{description}</span>
      </div>
    </div>
  );
}

export function SentimentChangeCard({
  deltaVsPrevClose,
  delta1h,
  isFlip,
}: SentimentChangeCardProps) {
  const hasDelta = deltaVsPrevClose !== null || delta1h !== null;

  if (!hasDelta && !isFlip) {
    return null;
  }

  return (
    <div className="w-full rounded-xl bg-card-elevated border border-border p-4 md:p-5 space-y-1">
      <div className="divide-y divide-border-light">
        <DeltaRow label="전일 대비" value={deltaVsPrevClose} />
        <DeltaRow label="1시간 변화" value={delta1h} />
      </div>

      {isFlip && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
          <span className="text-yellow-300 font-semibold text-sm">
            🔄 반전 발생!
          </span>
        </div>
      )}
    </div>
  );
}
