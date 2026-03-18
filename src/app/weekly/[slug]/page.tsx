import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import WeeklyReportView from '@/components/weekly-report-view';
import { fetchWeeklyReportArchive, fetchWeeklyReportBySlug } from '@/lib/weekly-reports';
import { getBaseUrl, SITE_NAME } from '@/lib/site';

export const dynamic = 'force-dynamic';

const weeklyDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const publishedAtFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Seoul',
});

function formatWeekDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : weeklyDateFormatter.format(date);
}

function formatPublishedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : publishedAtFormatter.format(date);
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const report = await fetchWeeklyReportBySlug(params.slug);

  if (!report) {
    return {
      title: '주간 리포트',
      description: '선택한 주간 리포트를 찾을 수 없습니다.',
    };
  }

  const description =
    report.dek ??
    '이번 주의 핵심 요약, 시장 해석, 온체인 흐름, 리스크와 뉴스 후보를 한 화면에 모았습니다.';
  const baseUrl = getBaseUrl();

  return {
    title: report.title,
    description,
    alternates: {
      canonical: `${baseUrl}/weekly/${report.slug}`,
    },
    openGraph: {
      title: report.title,
      description,
      url: `${baseUrl}/weekly/${report.slug}`,
      siteName: SITE_NAME,
      type: 'article',
    },
  };
}

export default async function WeeklyReportPage({
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
    <WeeklyReportView
      eyebrow={formatWeekDate(report.weekStart)}
      title={report.title}
      description={description}
      action={(
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
          {formatPublishedAt(report.publishedAt)}
        </span>
      )}
      report={report}
      archive={archive}
      activeSlug={report.slug}
      archiveTitle="다른 회차 보기"
      archiveIntro="같은 형식의 이전 회차를 바로 이어서 확인할 수 있습니다."
    />
  );
}
