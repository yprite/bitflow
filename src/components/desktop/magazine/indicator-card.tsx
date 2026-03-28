import { NumberCounter } from '@/components/motion/number-counter';

type Tone = 'positive' | 'negative' | 'neutral' | 'accent';

interface IndicatorCardProps {
  label: string;
  labelEn: string;
  value: number;
  displayValue?: string;
  tone: Tone;
  toneLabel: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const TONE_COLORS: Record<Tone, string> = {
  positive: 'text-dot-blue',
  negative: 'text-dot-red',
  neutral: 'text-dot-sub',
  accent: 'text-dot-text',
};

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
  return (
    <div className="desktop-surface flex items-center justify-between p-4">
      <div>
        <div className="text-[11px] text-dot-sub">{label}</div>
        <div className="text-[10px] text-dot-muted">{labelEn}</div>
      </div>
      <div className="text-right">
        <div className={`text-2xl font-bold ${TONE_COLORS[tone]}`}>
          {displayValue ?? (
            <NumberCounter
              value={value}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
            />
          )}
        </div>
        <div className={`text-[10px] ${TONE_COLORS[tone]}`}>{toneLabel}</div>
      </div>
    </div>
  );
}
