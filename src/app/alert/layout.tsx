import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '텔레그램 김프 알림 설정',
  description:
    '김치프리미엄이 임계값을 넘으면 텔레그램으로 실시간 알림. 봇 설정 방법과 명령어 안내.',
  openGraph: {
    title: '텔레그램 김프 알림 설정 | 비트코인 기상청',
    description:
      '김치프리미엄이 임계값을 넘으면 텔레그램으로 실시간 알림. 봇 설정 방법과 명령어 안내.',
  },
};

export default function AlertLayout({ children }: { children: React.ReactNode }) {
  return children;
}
