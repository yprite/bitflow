import Link from 'next/link';
import { DesktopBulletList, DesktopHero, DesktopSectionHeader, DesktopStatCard, DesktopSurface, DesktopTextCard } from '@/components/desktop/desktop-ui';
import { SITE_CONTACT_URL, SITE_NAME, SITE_REPO_URL } from '@/lib/site';

const productPrinciples = [
  '한국 투자자가 실제로 체감하는 지표를 우선합니다.',
  '단순 숫자 나열보다 해석 가능한 신호와 브리핑을 제공합니다.',
  '원본 데이터와 계산 로직을 최대한 투명하게 공개합니다.',
];

const coverage = [
  {
    title: '실시간 지표',
    body: '김치프리미엄, 펀딩비, 공포탐욕지수, BTC 도미넌스 등 시장 체온을 빠르게 확인하는 화면입니다.',
  },
  {
    title: '히스토리',
    body: '최근 30일 흐름과 변동성, 평균 회귀 여부를 읽기 위한 차트와 통계가 포함됩니다.',
  },
  {
    title: '도구',
    body: '멀티코인 김프 히트맵과 재정거래 계산기를 통해 상대적인 기회와 리스크를 함께 살핍니다.',
  },
];

export default function DesktopAboutPage() {
  return (
    <div className="magazine-content pt-20 pb-16">
      <Link href="/desktop" className="mb-6 inline-flex text-[10px] uppercase tracking-[0.14em] text-dot-muted hover:text-dot-accent">개요</Link>
    <div className="space-y-6">
      <DesktopHero
        eyebrow="About"
        title={SITE_NAME}
        description={(
          <>
            비트코인 기상청은 한국 시장 기준으로 비트코인과 암호화폐의 체감 온도를 읽기 쉽게 정리한 데이터 사이트입니다.
            글로벌 차트가 놓치기 쉬운 국내 프리미엄, 원화 체감 가격, 심리 과열 신호를 함께 보여주는 것이 목표입니다.
          </>
        )}
        sidebar={(
          <div className="space-y-4">
            <DesktopStatCard label="핵심" value="국내 체감 지표" tone="neutral" />
            <DesktopStatCard label="형식" value="해석 가능한 브리핑" tone="neutral" />
            <DesktopStatCard label="공개" value="GitHub 저장소" tone="neutral" />
          </div>
        )}
      />

      <DesktopSurface className="p-6">
        <DesktopSectionHeader eyebrow="Principles" title="운영 원칙" />
        <div className="mt-6">
          <DesktopBulletList numbered items={productPrinciples} />
        </div>
      </DesktopSurface>

      <DesktopSurface className="p-6">
        <DesktopSectionHeader eyebrow="Coverage" title="무엇을 제공하나요?" />
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {coverage.map((item) => (
            <DesktopTextCard key={item.title} label={item.title} title={item.title} body={item.body} />
          ))}
        </div>
      </DesktopSurface>

      <DesktopSurface className="p-6">
        <DesktopSectionHeader eyebrow="Operations" title="데이터와 운영" />
        <div className="mt-6 space-y-4 text-[13px] leading-7 text-dot-sub">
          <p>
            사이트는 업비트, 글로벌 시세 API, alternative.me, 자체 계산 로직을 조합해 값을 표시합니다.
            일부 기능은 Supabase와 Vercel 인프라를 사용하며, 데이터 지연이나 외부 API 제한으로 수치가 일시적으로 늦게 반영될 수 있습니다.
          </p>
          <p>
            프로젝트와 변경 내역은
            {' '}
            <a href={SITE_REPO_URL} target="_blank" rel="noreferrer" className="text-dot-accent hover:underline">
              GitHub 저장소
            </a>
            {' '}및{' '}
            <a href={SITE_CONTACT_URL} target="_blank" rel="noreferrer" className="text-dot-accent hover:underline">
              문의 채널
            </a>
            에서 확인할 수 있습니다.
          </p>
        </div>
      </DesktopSurface>
    </div>
    </div>
  );
}
