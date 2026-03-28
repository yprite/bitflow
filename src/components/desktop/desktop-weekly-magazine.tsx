import Link from 'next/link';
import { Masthead } from '@/components/desktop/magazine/masthead';
import { LightSection } from '@/components/desktop/magazine/light-section';
import { MagazineFooter } from '@/components/desktop/magazine/magazine-footer';
import { TimelineItem } from '@/components/desktop/magazine/timeline-item';
import type { WeeklyReportRecord, WeeklyReportArchiveItem } from '@/lib/types';

interface Props {
  report: WeeklyReportRecord | null;
  archive: WeeklyReportArchiveItem[];
}

function formatWeekDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export default function DesktopWeeklyMagazine({ report, archive }: Props) {
  const filteredArchive = archive.filter((a) => a.slug !== report?.slug);

  return (
    <>
      {/* Section 1: Masthead */}
      <section id="weekly-masthead">
        <Masthead
          edition="BITFLOW WEEKLY"
          meta={`Archive · 총 ${archive.length + (report ? 1 : 0)}호`}
          headline="주간 리포트 아카이브"
          subhead="매주 시장을 돌아보는 브리핑"
        />
      </section>

      {/* Section 2: Latest Issue Highlight */}
      <LightSection id="weekly-latest" className="bg-white">
        <div className="desktop-kicker mb-4">
          Latest Issue
        </div>
        {report ? (
          <Link
            href={`/desktop/weekly/${report.slug}`}
            className="block border-t border-dot-border py-4"
          >
            <div className="text-[11px] text-dot-sub">
              {formatWeekDate(report.weekStart)} ~ {formatWeekDate(report.weekEnd)}
            </div>
            <h3 className="text-[20px] font-bold text-dot-text mt-2 mb-2">
              {report.title}
            </h3>
            <p className="text-[13px] text-dot-sub leading-relaxed line-clamp-3">
              {report.summary}
            </p>
            <div className="mt-3 text-[11px] font-bold text-dot-text">
              전문 읽기 →
            </div>
          </Link>
        ) : null}
      </LightSection>

      {/* Section 3: Archive Timeline */}
      <LightSection id="weekly-archive">
        <div className="desktop-kicker mb-6">
          Past Issues
        </div>
        <div className="flex flex-col gap-4">
          {filteredArchive.map((item, i) => (
            <TimelineItem
              key={item.slug}
              href={`/desktop/weekly/${item.slug}`}
              title={`Vol. ${archive.length - i} — ${item.title}`}
              subtitle={`${formatWeekDate(item.weekStart)} ~ ${formatWeekDate(item.weekEnd)}`}
              isFirst={i === 0}
            />
          ))}
        </div>
      </LightSection>

      {/* Footer */}
      <MagazineFooter
        links={[
          { label: '← 메인 매거진', sublabel: '오늘의 브리핑', href: '/desktop' },
          { label: '온체인 딥다이브 →', sublabel: '네트워크 분석', href: '/desktop/onchain' },
        ]}
      />
    </>
  );
}
