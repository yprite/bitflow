import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '지표 히스토리 · 김치프리미엄 차트',
  description:
    '김치프리미엄, 펀딩비, 공포탐욕지수 30일 히스토리 차트. 통계, 캘린더, 상관관계 분석까지 한눈에.',
  openGraph: {
    title: '지표 히스토리 · 김치프리미엄 차트 | 비트코인 기상청',
    description:
      '김치프리미엄, 펀딩비, 공포탐욕지수 30일 히스토리 차트. 통계, 캘린더, 상관관계 분석까지 한눈에.',
  },
};

export default function IndicatorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
