'use client';

interface ColdStartPromptProps {
  readonly totalCount: number;
}

const TARGET_VOTES = 100;

export function ColdStartPrompt({ totalCount }: ColdStartPromptProps) {
  const progressPercent = Math.min(
    Math.round((totalCount / TARGET_VOTES) * 100),
    100,
  );

  return (
    <div className="w-full rounded-xl bg-card border border-border p-6 md:p-8 text-center space-y-4">
      <h3 className="text-xl md:text-2xl font-bold text-foreground">
        첫 투표의 주인공이 되세요
      </h3>

      <p className="text-foreground/60 text-sm">
        아직 전장이 형성되지 않았습니다. 당신의 한 표가 시작입니다.
      </p>

      <div className="space-y-2">
        <div className="w-full h-3 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm text-foreground/50">
          {TARGET_VOTES}표까지{' '}
          <span className="text-[#22D3EE] font-semibold">
            {progressPercent}%
          </span>{' '}
          도달
        </p>
      </div>

      <p className="text-lg font-semibold text-foreground/70">
        현재{' '}
        <span className="text-[#3B82F6]">{totalCount}</span>표
      </p>
    </div>
  );
}
