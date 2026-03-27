import Link from 'next/link';
import { Masthead } from '@/components/desktop/magazine/masthead';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { LightSection } from '@/components/desktop/magazine/light-section';
import { MagazineFooter } from '@/components/desktop/magazine/magazine-footer';
import { FloatingProgress } from '@/components/desktop/magazine/floating-progress';
import { TimelineItem } from '@/components/desktop/magazine/timeline-item';
import type { WeeklyReportRecord, WeeklyReportArchiveItem } from '@/lib/types';

const WEEKLY_SECTIONS = [
  { id: 'weekly-masthead', label: '마스트헤드' },
  { id: 'weekly-latest', label: '최신호' },
  { id: 'weekly-archive', label: '아카이브' },
];

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
      <FloatingProgress sections={WEEKLY_SECTIONS} />

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
        <ScrollReveal>
          <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-4">
            Latest Issue
          </div>
          {report ? (
            <Link
              href={`/desktop/weekly/${report.slug}`}
              className="block bg-dot-bg rounded-md p-6 border-l-4 border-dot-text hover:shadow-md transition-shadow"
            >
              <div className="text-[11px] text-dot-sub">
                {formatWeekDate(report.weekStart)} ~ {formatWeekDate(report.weekEnd)}
              </div>
              <h3 className="text-xl font-bold text-dot-text mt-2 mb-2">
                {report.title}
              </h3>
              <p className="text-[13px] text-dot-sub leading-relaxed line-clamp-3">
                {report.summary}
              </p>
              <div className="mt-3 text-xs font-semibold text-dot-text">
                전문 읽기 →
              </div>
            </Link>
          ) : (
            <div className="text-center py-12 text-dot-muted text-sm">
              최신 리포트가 없습니다
            </div>
          )}
        </ScrollReveal>
      </LightSection>

      {/* Section 3: Archive Timeline */}
      <LightSection id="weekly-archive">
        <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
          Past Issues
        </div>
        <div className="border-l-2 border-dot-border pl-5 flex flex-col gap-4">
          {filteredArchive.map((item, i) => (
            <ScrollReveal key={item.slug} delay={i * 60}>
              <TimelineItem
                href={`/desktop/weekly/${item.slug}`}
                title={`Vol. ${archive.length - i} — ${item.title}`}
                subtitle={`${formatWeekDate(item.weekStart)} ~ ${formatWeekDate(item.weekEnd)}`}
                isFirst={i === 0}
              />
            </ScrollReveal>
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
