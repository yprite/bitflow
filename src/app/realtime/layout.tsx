import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '실시간 지표 · 11개 시장 지표 상세',
  description:
    '김치프리미엄, 펀딩비, 공포탐욕지수, USDT 프리미엄, BTC 도미넌스 등 11개 지표를 실시간으로 확인하세요.',
  openGraph: {
    title: '실시간 지표 · 11개 시장 지표 상세 | 비트코인 기상청',
    description:
      '김치프리미엄, 펀딩비, 공포탐욕지수, USDT 프리미엄, BTC 도미넌스 등 11개 지표를 실시간으로 확인하세요.',
  },
};

export default function RealtimeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
