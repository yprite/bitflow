import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '비트코인 도구 · mempool · fee 계산기',
  description:
    '비트코인 mempool, fee 계산기, BTC·sats 변환기, 블록 템포와 반감기 카운트다운을 한 화면에서 확인하세요.',
  openGraph: {
    title: '비트코인 도구 · mempool · fee 계산기 | 비트코인 기상청',
    description:
      '비트코인 mempool, fee 계산기, BTC·sats 변환기, 블록 템포와 반감기 카운트다운을 한 화면에서 확인하세요.',
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
