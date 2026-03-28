interface SignalBarProps {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
}

export function SignalBar({ total, positive, neutral, negative }: SignalBarProps) {
  return (
    <div role="img" aria-label={`${total}개 지표 중 ${positive}개 긍정 · ${neutral}개 중립 · ${negative}개 부정`}>
      <div className="flex justify-center gap-1">
        {Array(total).fill(0).map((_, i) => {
          const isActive = i < positive || i >= total - negative;
          return (
            <div
              key={i}
              className={`h-1 w-6 ${isActive ? 'bg-dot-text' : 'bg-dot-border'}`}
            />
          );
        })}
      </div>
      <div className="mt-2 text-center text-[11px] text-dot-muted">
        {total}개 지표: {positive} 긍정 · {neutral} 중립 · {negative} 부정
      </div>
    </div>
  );
}
