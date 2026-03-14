import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '프리미엄 히트맵 · 재정거래 계산기',
  description:
    '50개 이상 암호화폐 김치프리미엄 히트맵과 재정거래 수익률 계산기. 실시간 차익거래 기회를 확인하세요.',
  openGraph: {
    title: '프리미엄 히트맵 · 재정거래 계산기 | 비트코인 기상청',
    description:
      '50개 이상 암호화폐 김치프리미엄 히트맵과 재정거래 수익률 계산기. 실시간 차익거래 기회를 확인하세요.',
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
