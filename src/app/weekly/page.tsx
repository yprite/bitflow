import type { Metadata } from 'next';
import WeeklyReportView from '@/components/weekly-report-view';
import { fetchLatestWeeklyReport, fetchWeeklyReportArchive } from '@/lib/weekly-reports';
import { SITE_NAME } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '주간 리포트',
  description: '이번 주 비트코인 리포트와 지난 회차 아카이브를 함께 확인합니다.',
};

const weeklyDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

function formatWeekDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : weeklyDateFormatter.format(date);
}

export default async function WeeklyPage() {
  const [latestReport, archive] = await Promise.all([
    fetchLatestWeeklyReport(),
    fetchWeeklyReportArchive(12),
  ]);
  const visibleArchive = latestReport
    ? archive.filter((item) => item.slug !== latestReport.slug)
    : archive;

  return (
    <WeeklyReportView
      eyebrow="Weekly Report"
      title="주간 리포트"
      description="이번 주 최신 리포트를 먼저 읽고, 아래 아카이브에서 지난 회차를 이어서 확인합니다."
      action={
        latestReport ? (
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
            최신 회차 · {formatWeekDate(latestReport.weekStart)}
          </span>
        ) : (
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
            {SITE_NAME}
          </span>
        )
      }
      report={latestReport}
      archive={visibleArchive}
      activeSlug={latestReport?.slug ?? null}
      archiveTitle="지난 회차 아카이브"
      archiveIntro="최신 회차를 제외한 이전 리포트를 시간순으로 정리했습니다."
    />
  );
}
