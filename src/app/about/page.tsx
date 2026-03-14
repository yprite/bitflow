import type { Metadata } from 'next';
import { SITE_CONTACT_URL, SITE_NAME, SITE_REPO_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: '서비스 소개',
  description:
    '비트코인 기상청이 어떤 데이터를 보여주고, 어떤 사용자 문제를 해결하려는지 설명합니다.',
};

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

export default function AboutPage() {
  return (
    <div className="space-y-5">
      <section className="dot-card p-5 sm:p-6 space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-dot-muted">About</p>
        <h1 className="text-base sm:text-lg font-semibold text-dot-accent tracking-tight">{SITE_NAME}</h1>
        <p className="text-sm text-dot-sub leading-relaxed">
          비트코인 기상청은 한국 시장 기준으로 비트코인과 암호화폐의 체감 온도를 읽기 쉽게 정리한 데이터 사이트입니다.
          글로벌 차트가 놓치기 쉬운 국내 프리미엄, 원화 체감 가격, 심리 과열 신호를 함께 보여주는 것이 목표입니다.
        </p>
      </section>

      <section className="dot-card p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">운영 원칙</h2>
        <ul className="space-y-2">
          {productPrinciples.map((item, index) => (
            <li key={item} className="flex items-start gap-2 text-sm text-dot-sub leading-relaxed">
              <span className="text-dot-muted/50 font-mono">{String(index + 1).padStart(2, '0')}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="dot-card p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">무엇을 제공하나요?</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {coverage.map((item) => (
            <article key={item.title} className="border border-dot-border/60 p-4 dot-grid-sparse">
              <h3 className="text-xs font-semibold text-dot-sub uppercase tracking-wider">{item.title}</h3>
              <p className="mt-2 text-xs text-dot-sub leading-relaxed">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dot-card p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">데이터와 운영</h2>
        <p className="text-xs text-dot-sub leading-relaxed">
          사이트는 업비트, 글로벌 시세 API, alternative.me, 자체 계산 로직을 조합해 값을 표시합니다.
          일부 기능은 Supabase와 Vercel 인프라를 사용하며, 데이터 지연이나 외부 API 제한으로 수치가 일시적으로 늦게 반영될 수 있습니다.
        </p>
        <p className="text-xs text-dot-sub leading-relaxed">
          프로젝트와 변경 내역은 공개 저장소에서 확인할 수 있습니다.
          {' '}
          <a href={SITE_REPO_URL} target="_blank" rel="noreferrer" className="text-dot-accent hover:underline">
            GitHub 저장소
          </a>
          {' '}·{' '}
          <a href={SITE_CONTACT_URL} target="_blank" rel="noreferrer" className="text-dot-accent hover:underline">
            문의 및 제보
          </a>
        </p>
      </section>
    </div>
  );
}
