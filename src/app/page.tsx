import type { Metadata } from 'next';
import { MarketHome } from '@/components/home/market-home';
import { getFallbackMarketHomeSnapshot } from '@/lib/market-home-data';
import { getSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'BitFlow Radar',
  description: '지금 붙는 테마와 왜 오르는지, 내일까지 이어질 이벤트를 30초 안에 파악하는 한국 주식 레이더',
  openGraph: {
    title: 'BitFlow Radar',
    description: '지금 붙는 종목, 상승 이유, 내일 일정까지 한 화면에서 보는 한국 주식 레이더',
    url: getSiteUrl(),
    type: 'website',
    locale: 'ko_KR',
  },
};

export default function Home() {
  return <MarketHome initialSnapshot={getFallbackMarketHomeSnapshot()} />;
}
