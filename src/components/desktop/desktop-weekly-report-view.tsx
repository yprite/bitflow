import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  DesktopBulletList,
  DesktopEmptyState,
  DesktopHero,
  DesktopSectionHeader,
  DesktopStatCard,
  DesktopSurface,
  DesktopTextCard,
} from '@/components/desktop/desktop-ui';
import type { WeeklyReportArchiveItem, WeeklyReportRecord } from '@/lib/types';

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
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

const numberFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatPublishedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : publishedAtFormatter.format(date);
}

function formatBtc(value: number | null): string {
  return value === null ? '—' : `${numberFormatter.format(value)} BTC`;
}

function formatPercent(value: number | null, digits = 2): string {
  if (value === null) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

function formatCurrency(value: number | null): string {
  return value === null ? '—' : `$${currencyFormatter.format(value)}`;
}

function formatRatio(value: number | null): string {
  return value === null ? '—' : numberFormatter.format(value);
}

function NewsCard({
  rank,
  title,
  sourceName,
  sourceUrl,
  publishedAt,
  summary,
  whyItMatters,
  topic,
  priority,
}: WeeklyReportRecord['newsItems'][number]) {
  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="block border border-dot-border p-5 transition-colors hover:border-dot-accent"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-[0.02em] text-dot-muted">
            #{rank.toString().padStart(2, '0')}
            {priority !== null ? ` · P${priority}` : ''}
          </p>
          <h3 className="text-[14px] font-bold text-dot-accent">{title}</h3>
        </div>
        <span className="shrink-0 text-[11px] font-mono uppercase tracking-[0.02em] text-dot-muted">
          {topic ?? sourceName}
        </span>
      </div>
      <div className="mt-4 space-y-2 text-[13px] leading-7 text-dot-sub">
        <p>{summary}</p>
        <p>{whyItMatters}</p>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.02em] text-dot-muted">
        <span>{sourceName}</span>
        <span aria-hidden="true">·</span>
        <span>{publishedAt ? formatPublishedAt(publishedAt) : '발행일 미상'}</span>
      </div>
    </a>
  );
}

interface DesktopWeeklyReportViewProps {
  title: string;
  eyebrow: string;
  description: ReactNode;
  action?: ReactNode;
  report: WeeklyReportRecord | null;
  archive: WeeklyReportArchiveItem[];
  emptyTitle?: string;
  emptyBody?: ReactNode;
}

export default function DesktopWeeklyReportView({
  title,
  eyebrow,
  description,
  action,
  report,
  archive,
  emptyTitle = '공개된 주간 리포트가 없습니다',
  emptyBody = '리포트가 아직 게시되지 않았습니다.',
}: DesktopWeeklyReportViewProps) {
  return (
    <div className="space-y-6">
      <DesktopHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={action}
      />

      {report ? (
        <>
          <DesktopSurface className="p-6">
            <DesktopSectionHeader
              eyebrow="Weekly Summary"
              title="이번 주 핵심"
              description={report.dek ?? report.summary}
            />
            <div className="mt-6 space-y-5">
              <p className="text-[14px] leading-8 text-dot-sub">{report.summary}</p>
              <div className="grid gap-6 md:grid-cols-3">
                <DesktopTextCard label="시장 해석" title="Market View" body={report.marketView} />
                <DesktopTextCard label="온체인 해석" title="On-chain View" body={report.onchainView} />
                <DesktopTextCard label="리스크 워치" title="Risk Watch" body={report.riskWatch} />
              </div>
              {report.watchlist.length > 0 ? (
                <div className="space-y-3">
                  <p className="desktop-kicker">Watchlist</p>
                  <div className="flex flex-wrap gap-2">
                    {report.watchlist.map((item) => (
                      <span key={item} className="border border-dot-border px-3 py-1.5 text-[12px] text-dot-sub">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </DesktopSurface>

          <DesktopSurface className="p-6">
            <DesktopSectionHeader
              eyebrow="Snapshot"
              title="핵심 스냅샷"
              description="시장과 온체인 스냅샷을 같은 밀도로 비교할 수 있게 분리했습니다."
            />
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <p className="desktop-kicker">Market Snapshot</p>
                <div className="grid grid-cols-2 gap-4">
                  <DesktopStatCard label="BTC 가격" value={formatCurrency(report.marketSnapshot.priceUsd)} />
                  <DesktopStatCard label="주간 변동률" value={formatPercent(report.marketSnapshot.weeklyPriceChangePercent)} />
                  <DesktopStatCard
                    label="김프 평균"
                    value={formatPercent(report.marketSnapshot.kimpAverage)}
                    detail={report.marketSnapshot.kimpLatest !== null ? `최신 ${formatPercent(report.marketSnapshot.kimpLatest)}` : undefined}
                  />
                  <DesktopStatCard
                    label="공포탐욕"
                    value={
                      report.marketSnapshot.fearGreedValue === null
                        ? '—'
                        : `${formatRatio(report.marketSnapshot.fearGreedValue)} · ${report.marketSnapshot.fearGreedClassification ?? '미상'}`
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <p className="desktop-kicker">On-chain Snapshot</p>
                <div className="grid grid-cols-2 gap-4">
                  <DesktopStatCard label="기준일" value={report.onchainSnapshot.latestDay ? formatDate(report.onchainSnapshot.latestDay) : '—'} />
                  <DesktopStatCard label="7일 소진 BTC" value={formatBtc(report.onchainSnapshot.spentBtc7d)} />
                  <DesktopStatCard label="7일 재활성 BTC" value={formatBtc(report.onchainSnapshot.dormantReactivatedBtc7d)} />
                  <DesktopStatCard
                    label="고래 알림"
                    value={report.onchainSnapshot.whaleAlertCount7d === null ? '—' : `${numberFormatter.format(report.onchainSnapshot.whaleAlertCount7d)}건`}
                    detail={`활성 공급 30d ${report.onchainSnapshot.activeSupply30d !== null ? formatRatio(report.onchainSnapshot.activeSupply30d) : '—'} · 90d ${report.onchainSnapshot.activeSupply90d !== null ? formatRatio(report.onchainSnapshot.activeSupply90d) : '—'}`}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <DesktopStatCard label="모델" value={report.modelName ?? '미상'} />
              <DesktopStatCard label="생성자" value={report.generatedBy} />
              <DesktopStatCard label="생성 시각" value={formatPublishedAt(report.generatedAt)} />
            </div>
          </DesktopSurface>

          {report.sections.length > 0 ? (
            <DesktopSurface className="p-6">
              <DesktopSectionHeader
                eyebrow="Sections"
                title="주간 섹션"
                description="요약과 핵심 불릿을 PC 카드 묶음으로 재배치했습니다."
              />
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {report.sections.map((section) => (
                  <article key={section.id} className="desktop-surface p-5">
                    <div className="space-y-3">
                      <p className="desktop-kicker">{section.id}</p>
                      <div className="space-y-2">
                        <h3 className="text-[20px] font-bold text-dot-accent">{section.title}</h3>
                        <p className="text-[13px] leading-7 text-dot-sub">{section.summary}</p>
                      </div>
                      {section.bullets.length > 0 ? (
                        <DesktopBulletList items={section.bullets} />
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </DesktopSurface>
          ) : null}

          {report.newsItems.length > 0 ? (
            <DesktopSurface className="p-6">
              <DesktopSectionHeader
                eyebrow="News Candidates"
                title="이번 주 뉴스 후보"
                description="랭크와 우선순위 기준으로 정리된 원문 링크 목록입니다."
              />
              <div className="mt-6 space-y-4">
                {report.newsItems.map((item) => (
                  <NewsCard key={`${item.rank}-${item.title}`} {...item} />
                ))}
              </div>
            </DesktopSurface>
          ) : null}
        </>
      ) : (
        <DesktopEmptyState title={emptyTitle} body={emptyBody} />
      )}
    </div>
  );
}
