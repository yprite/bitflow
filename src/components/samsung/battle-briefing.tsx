'use client';

import type { BriefingItem } from '@/lib/samsung/types';

interface BattleBriefingProps {
  readonly bullIssues: readonly BriefingItem[];
  readonly bearIssues: readonly BriefingItem[];
}

interface IssueColumnProps {
  readonly title: string;
  readonly emoji: string;
  readonly issues: readonly BriefingItem[];
  readonly borderColor: string;
}

function IssueCard({
  issue,
  borderColor,
}: {
  readonly issue: BriefingItem;
  readonly borderColor: string;
}) {
  return (
    <div
      className={`bg-card rounded-lg p-3 md:p-4 border-l-4 ${borderColor}`}
    >
      <h4 className="font-semibold text-foreground text-sm md:text-base">
        {issue.title}
      </h4>
      <p className="text-foreground/50 text-xs md:text-sm mt-1 leading-relaxed">
        {issue.summary}
      </p>
    </div>
  );
}

function IssueColumn({
  title,
  emoji,
  issues,
  borderColor,
}: IssueColumnProps) {
  return (
    <div className="flex-1 space-y-3">
      <h3 className="text-base md:text-lg font-bold text-foreground/90">
        {emoji} {title}
      </h3>
      <div className="space-y-2">
        {issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            borderColor={borderColor}
          />
        ))}
      </div>
      {issues.length === 0 && (
        <p className="text-foreground/30 text-sm text-center py-4">
          아직 이슈가 없습니다
        </p>
      )}
    </div>
  );
}

export function BattleBriefing({
  bullIssues,
  bearIssues,
}: BattleBriefingProps) {
  const hasIssues = bullIssues.length > 0 || bearIssues.length > 0;

  if (!hasIssues) {
    return null;
  }

  return (
    <section className="w-full space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">
        오늘의 전선
      </h2>

      <div className="flex flex-col md:flex-row gap-4">
        <IssueColumn
          title="Bull 근거"
          emoji="🐂"
          issues={bullIssues}
          borderColor="border-[#3B82F6]"
        />
        <IssueColumn
          title="Bear 근거"
          emoji="🐻"
          issues={bearIssues}
          borderColor="border-[#EF4444]"
        />
      </div>
    </section>
  );
}
