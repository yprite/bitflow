import type { Metadata } from 'next';
import DesktopOnchainMagazine from '@/components/desktop/desktop-onchain-magazine';
import { fetchOnchainSummary } from '@/lib/onchain';
import { fetchOnchainNetworkPulse } from '@/lib/onchain-monitor';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '온체인',
  description: '비트코인 온체인 모니터의 PC 전용 버전입니다.',
};

export default async function DesktopOnchainPage() {
  const [summary, networkPulse] = await Promise.all([
    fetchOnchainSummary({
      metricLookbackDays: 30,
      alertLimit: 60,
      entityLimit: 18,
    }),
    fetchOnchainNetworkPulse(),
  ]);

  return <DesktopOnchainMagazine summary={summary} networkPulse={networkPulse} />;
}
