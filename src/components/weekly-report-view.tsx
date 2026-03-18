import Link from 'next/link';
import type { ReactNode } from 'react';
import GuideModal from '@/components/guide-modal';
import PageHeader from '@/components/page-header';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
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
  if (value === null) {
    return '—';
  }

  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

function formatCurrency(value: number | null): string {
  return value === null ? '—' : `$${currencyFormatter.format(value)}`;
}

function formatRatio(value: number | null): string {
  return value === null ? '—' : numberFormatter.format(value);
}

function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: ReactNode;
}) {
  return (
    <div className="border border-dot-border/60 p-3 dot-grid-sparse">
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold tracking-tight text-dot-accent">{value}</p>
      {detail ? <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">{detail}</p> : null}
    </div>
  );
}

function ArchiveCard({
  item,
  active,
}: {
  item: WeeklyReportArchiveItem;
  active: boolean;
}) {
  return (
    <Link
      href={`/weekly/${item.slug}`}
      className={`block border p-4 transition-colors dot-grid-sparse ${
        active
          ? 'border-dot-accent/70 bg-white/80'
          : 'border-dot-border/60 bg-white/60 hover:border-dot-muted/70 hover:bg-white/80'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
            {formatDate(item.weekStart)} - {formatDate(item.weekEnd)}
          </p>
          <h3 className="text-sm font-semibold tracking-tight text-dot-accent">{item.title}</h3>
          {item.dek ? <p className="text-xs leading-relaxed text-dot-sub">{item.dek}</p> : null}
        </div>
        <span className="shrink-0 text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
          {active ? '현재' : formatPublishedAt(item.publishedAt)}
        </span>
      </div>
    </Link>
  );
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
      className="block border border-dot-border/60 p-4 transition-colors dot-grid-sparse hover:border-dot-muted/70 hover:bg-white/80"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
            #{rank.toString().padStart(2, '0')}
            {priority !== null ? ` · P${priority}` : ''}
          </p>
          <h3 className="text-sm font-semibold tracking-tight text-dot-accent">{title}</h3>
        </div>
        <span className="shrink-0 text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
          {topic ?? sourceName}
        </span>
      </div>
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-dot-sub">
        <p>{summary}</p>
        <p className="text-dot-sub/90">
          {whyItMatters}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
        <span>{sourceName}</span>
        <span aria-hidden="true">·</span>
        <span>{publishedAt ? formatPublishedAt(publishedAt) : '발행일 미상'}</span>
      </div>
    </a>
  );
}

function WeeklyReportGuideContent() {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="border border-dot-border/60 p-3 dot-grid-sparse">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">시장</p>
        <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
          summary와 market view를 먼저 읽고, 가격과 프리미엄 변화가 이번 주 분위기를 어떻게 바꿨는지 확인합니다.
        </p>
      </div>
      <div className="border border-dot-border/60 p-3 dot-grid-sparse">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">온체인</p>
        <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
          onchain view와 스냅샷으로 네트워크 활동, 고래 흐름, 활성 공급 추세를 함께 봅니다.
        </p>
      </div>
      <div className="border border-dot-border/60 p-3 dot-grid-sparse">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">뉴스</p>
        <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
          뉴스 항목은 원문 링크를 함께 제공합니다. 아카이브를 통해 지난 회차와 현재 회차를 바로 비교할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

interface WeeklyReportViewProps {
  title: string;
  eyebrow: string;
  description: ReactNode;
  action?: ReactNode;
  report: WeeklyReportRecord | null;
  archive: WeeklyReportArchiveItem[];
  activeSlug?: string | null;
  archiveTitle?: string;
  archiveIntro?: ReactNode;
  emptyTitle?: string;
  emptyBody?: ReactNode;
}

export default function WeeklyReportView({
  title,
  eyebrow,
  description,
  action,
  report,
  archive,
  activeSlug = null,
  archiveTitle = '주간 아카이브',
  archiveIntro = '최근 회차를 빠르게 넘겨보며 흐름을 비교할 수 있습니다.',
  emptyTitle = '공개된 주간 리포트가 없습니다',
  emptyBody = '리포트가 아직 게시되지 않았습니다. 아카이브가 비어 있으면 첫 공개 회차가 올라올 때까지 잠시 기다려주세요.',
}: WeeklyReportViewProps) {
  const hasReport = report !== null;

  return (
    <div className="space-y-3 sm:space-y-5">
      <DotAssemblyReveal delay={0} duration={520} density="low">
        <PageHeader
          variant="card"
          eyebrow={eyebrow}
          title={title}
          description={description}
          action={(
            <div className="flex flex-col items-end gap-2">
              {action}
              <GuideModal
                title="주간 리포트 읽는 법"
                eyebrow="Weekly Report"
                triggerLabel="읽는 법"
                maxWidthClassName="max-w-4xl"
                triggerClassName="inline-flex rounded-sm border border-dot-border/60 bg-white/75 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-dot-sub transition hover:border-dot-accent/50 hover:text-dot-accent"
                intro="이번 주 핵심 요약부터 시장, 온체인, 뉴스 후보까지 한 번에 따라갈 수 있게 정리했습니다."
              >
                <WeeklyReportGuideContent />
              </GuideModal>
            </div>
          )}
        />
      </DotAssemblyReveal>

      {hasReport ? (
        <>
          <DotAssemblyReveal delay={130} duration={700}>
            <section className="dot-card p-5 sm:p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-dot-muted">이번 주 핵심</p>
                  <h2 className="text-sm font-semibold tracking-tight text-dot-accent">{report.title}</h2>
                  {report.dek ? <p className="text-xs leading-relaxed text-dot-sub">{report.dek}</p> : null}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
                  <p>{formatDate(report.weekStart)} - {formatDate(report.weekEnd)}</p>
                  <p className="mt-1 text-right">
                    {formatPublishedAt(report.publishedAt)}
                  </p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-dot-sub">{report.summary}</p>

              <div className="grid gap-3 lg:grid-cols-3">
                <div className="border border-dot-border/60 p-4 dot-grid-sparse">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">시장 해석</p>
                  <p className="mt-2 text-sm leading-relaxed text-dot-sub">{report.marketView}</p>
                </div>
                <div className="border border-dot-border/60 p-4 dot-grid-sparse">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">온체인 해석</p>
                  <p className="mt-2 text-sm leading-relaxed text-dot-sub">{report.onchainView}</p>
                </div>
                <div className="border border-dot-border/60 p-4 dot-grid-sparse">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">리스크 워치</p>
                  <p className="mt-2 text-sm leading-relaxed text-dot-sub">{report.riskWatch}</p>
                </div>
              </div>

              {report.watchlist.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">이번 주 워치리스트</p>
                  <div className="flex flex-wrap gap-2">
                    {report.watchlist.map((item) => (
                      <span
                        key={item}
                        className="border border-dot-border/60 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-dot-sub"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </DotAssemblyReveal>

          <DotAssemblyReveal delay={170} duration={720}>
            <section className="dot-card p-5 sm:p-6 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-dot-accent">핵심 스냅샷</h2>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">시장 스냅샷</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <StatTile label="BTC 가격" value={formatCurrency(report.marketSnapshot.priceUsd)} />
                    <StatTile
                      label="주간 변동률"
                      value={formatPercent(report.marketSnapshot.weeklyPriceChangePercent)}
                    />
                    <StatTile
                      label="김프 평균"
                      value={formatPercent(report.marketSnapshot.kimpAverage)}
                      detail={report.marketSnapshot.kimpLatest !== null ? `최신 ${formatPercent(report.marketSnapshot.kimpLatest)}` : undefined}
                    />
                    <StatTile
                      label="공포탐욕"
                      value={
                        report.marketSnapshot.fearGreedValue === null
                          ? '—'
                          : `${formatRatio(report.marketSnapshot.fearGreedValue)} · ${report.marketSnapshot.fearGreedClassification ?? '미상'}`
                      }
                      detail={report.marketSnapshot.fearGreedClassification ?? undefined}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">온체인 스냅샷</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <StatTile
                      label="기준일"
                      value={report.onchainSnapshot.latestDay ? formatDate(report.onchainSnapshot.latestDay) : '—'}
                    />
                    <StatTile
                      label="7일 소진 BTC"
                      value={formatBtc(report.onchainSnapshot.spentBtc7d)}
                    />
                    <StatTile
                      label="7일 재활성 BTC"
                      value={formatBtc(report.onchainSnapshot.dormantReactivatedBtc7d)}
                    />
                    <StatTile
                      label="고래 알림"
                      value={report.onchainSnapshot.whaleAlertCount7d === null ? '—' : `${numberFormatter.format(report.onchainSnapshot.whaleAlertCount7d)}건`}
                      detail={
                        <>
                          활성 공급 30d {report.onchainSnapshot.activeSupply30d !== null ? formatRatio(report.onchainSnapshot.activeSupply30d) : '—'}
                          {' · '}
                          90d {report.onchainSnapshot.activeSupply90d !== null ? formatRatio(report.onchainSnapshot.activeSupply90d) : '—'}
                        </>
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatTile label="모델" value={report.modelName ?? '미상'} />
                <StatTile label="생성자" value={report.generatedBy} />
                <StatTile label="생성 시각" value={formatPublishedAt(report.generatedAt)} />
              </div>
            </section>
          </DotAssemblyReveal>

          {report.sections.length > 0 ? (
            <DotAssemblyReveal delay={220} duration={740}>
              <section className="dot-card p-5 sm:p-6 space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-dot-accent">주간 섹션</h2>
                <div className="grid gap-3 xl:grid-cols-2">
                  {report.sections.map((section) => (
                    <article key={section.id} className="border border-dot-border/60 p-4 dot-grid-sparse">
                      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
                        {section.id}
                      </p>
                      <h3 className="mt-2 text-sm font-semibold tracking-tight text-dot-accent">{section.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-dot-sub">{section.summary}</p>
                      {section.bullets.length > 0 ? (
                        <ul className="mt-3 space-y-2">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="flex items-start gap-2 text-xs leading-relaxed text-dot-sub">
                              <span className="text-dot-muted/45">·</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            </DotAssemblyReveal>
          ) : null}

          {report.newsItems.length > 0 ? (
            <DotAssemblyReveal delay={270} duration={780}>
              <section className="dot-card p-5 sm:p-6 space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-dot-accent">이번 주 뉴스 후보</h2>
                <div className="grid gap-3">
                  {report.newsItems.map((item) => (
                    <NewsCard key={`${item.rank}-${item.title}`} {...item} />
                  ))}
                </div>
              </section>
            </DotAssemblyReveal>
          ) : null}
        </>
      ) : (
        <DotAssemblyReveal delay={130} duration={700}>
          <section className="dot-card p-5 sm:p-6 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dot-accent">{emptyTitle}</h2>
            <p className="text-xs leading-relaxed text-dot-sub">{emptyBody}</p>
          </section>
        </DotAssemblyReveal>
      )}

      <DotAssemblyReveal delay={320} duration={680}>
        <section className="dot-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-dot-accent">{archiveTitle}</h2>
              <p className="text-xs leading-relaxed text-dot-sub">{archiveIntro}</p>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              {archive.length}회차
            </p>
          </div>

          {archive.length > 0 ? (
            <div className="grid gap-3">
              {archive.map((item) => (
                <ArchiveCard key={item.slug} item={item} active={item.slug === activeSlug} />
              ))}
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-dot-sub">아카이브가 아직 준비되지 않았습니다.</p>
          )}
        </section>
      </DotAssemblyReveal>
    </div>
  );
}
