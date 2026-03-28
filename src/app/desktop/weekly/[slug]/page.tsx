import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DesktopWeeklyReportView from '@/components/desktop/desktop-weekly-report-view';
import { fetchWeeklyReportArchive, fetchWeeklyReportBySlug } from '@/lib/weekly-reports';

const publishedAtFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Seoul',
});

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

function formatPublishedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : publishedAtFormatter.format(date);
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const report = await fetchWeeklyReportBySlug(params.slug);

  if (!report) {
    return {
      title: '주간 리포트 Desktop',
      description: '선택한 주간 리포트를 찾을 수 없습니다.',
    };
  }

  return {
    title: `${report.title} Desktop`,
    description:
      report.dek ??
      '이번 주의 핵심 요약, 시장 해석, 온체인 흐름, 리스크와 뉴스 후보를 한 화면에 모았습니다.',
  };
}

export default async function DesktopWeeklyDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [report, archive] = await Promise.all([
    fetchWeeklyReportBySlug(params.slug),
    fetchWeeklyReportArchive(12),
  ]);

  if (!report) {
    notFound();
  }

  const description =
    report.dek ??
    '이번 주의 핵심 요약, 시장 해석, 온체인 흐름, 리스크와 뉴스 후보를 한 화면에 모았습니다.';

  return (
    <DesktopWeeklyReportView
      eyebrow={formatWeekDate(report.weekStart)}
      title={`${report.title} Desktop`}
      description={description}
      action={<span className="text-[11px] text-dot-muted">{formatPublishedAt(report.publishedAt)}</span>}
      report={report}
      archive={archive}
    />
  );
}
