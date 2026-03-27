interface SignalBarProps {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
}

export function SignalBar({ total, positive, neutral, negative }: SignalBarProps) {
  const segments = [
    ...Array(positive).fill('bg-dot-green'),
    ...Array(neutral).fill('bg-dot-muted'),
    ...Array(negative).fill('bg-dot-red'),
  ];

  return (
    <div role="img" aria-label={`${total}개 지표 중 ${positive}개 긍정 · ${neutral}개 중립 · ${negative}개 부정`}>
      <div className="flex justify-center gap-[3px]">
        {segments.map((color, i) => (
          <div
            key={i}
            className={`w-7 h-2 rounded-full ${color}`}
          />
        ))}
      </div>
      <div className="mt-2 text-center text-[11px] text-dot-muted">
        {total}개 지표: {positive} 긍정 · {neutral} 중립 · {negative} 부정
      </div>
    </div>
  );
}
