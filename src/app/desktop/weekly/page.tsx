import DesktopWeeklyReportView from '@/components/desktop/desktop-weekly-report-view';
import { fetchLatestWeeklyReport, fetchWeeklyReportArchive } from '@/lib/weekly-reports';

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

export default async function DesktopWeeklyPage() {
  const [latestReport, archive] = await Promise.all([
    fetchLatestWeeklyReport(),
    fetchWeeklyReportArchive(12),
  ]);

  const visibleArchive = latestReport
    ? archive.filter((item) => item.slug !== latestReport.slug)
    : archive;

  return (
    <DesktopWeeklyReportView
      eyebrow="Weekly Report Desktop"
      title="주간 리포트 Desktop"
      description="최신 회차를 본문에 두고, 우측 고정 아카이브에서 지난 리포트를 바로 비교할 수 있도록 재배치했습니다."
      action={
        latestReport ? (
          <span className="desktop-chip">
            최신 회차 · {formatWeekDate(latestReport.weekStart)}
          </span>
        ) : undefined
      }
      report={latestReport}
      archive={visibleArchive}
      activeSlug={latestReport?.slug ?? null}
      archiveTitle="지난 회차 아카이브"
      archiveIntro="최신 회차를 제외한 이전 리포트를 시간순으로 정리했습니다."
    />
  );
}
