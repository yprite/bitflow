type Tone = 'heat' | 'cool';

const TONE_COLORS: Record<Tone, string> = {
  heat: 'text-dot-red',
  cool: 'text-dot-blue',
};

interface IndicatorCardProps {
  label: string;
  labelEn: string;
  value: number;
  displayValue?: string;
  tone?: Tone;
  toneLabel: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function IndicatorCard({
  label,
  labelEn,
  value,
  displayValue,
  tone,
  toneLabel,
  prefix = '',
  suffix = '',
  decimals,
}: IndicatorCardProps) {
  const colorClass = tone ? TONE_COLORS[tone] : 'text-dot-text';

  return (
    <div className="border-t border-dot-border flex items-center justify-between py-3">
      <div>
        <div className="text-[11px] text-dot-sub">{label}</div>
        <div className="text-[11px] text-dot-muted">{labelEn}</div>
      </div>
      <div className="text-right">
        <div className={`text-[13px] font-bold ${colorClass}`}>
          {displayValue ?? `${prefix}${value.toFixed(decimals ?? 1)}${suffix}`}
        </div>
        <div className={`text-[11px] ${colorClass}`}>{toneLabel}</div>
      </div>
    </div>
  );
}
