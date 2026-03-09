import type { Metadata } from 'next';
import { SamsungSentimentPage } from '@/components/samsung/samsung-sentiment-page';
import { getSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: '삼성전자 Bull vs Bear — 지금 시장은 황소인가 곰인가',
  description:
    '삼성전자에 대한 실시간 민심을 확인하고 한 표를 던지세요. 지금 사람들은 황소인가 곰인가?',
  openGraph: {
    title: '삼성전자 Bull vs Bear',
    description:
      '지금 삼성전자 민심을 확인하고 참여하세요',
    url: `${getSiteUrl()}/samsung`,
    type: 'website',
    locale: 'ko_KR',
    images: [
      {
        url: `${getSiteUrl()}/api/og/samsung`,
        width: 1200,
        height: 630,
        alt: '삼성전자 Bull vs Bear',
      },
    ],
  },
};

export default function SamsungPage() {
  return <SamsungSentimentPage />;
}
