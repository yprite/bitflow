'use client';

import { useEffect, useState } from 'react';
import KimpCard from './kimp-card';
import FundingRateCard from './funding-rate-card';
import FearGreedCard from './fear-greed-card';
import SignalBadge from './signal-badge';
import KimpChart from './kimp-chart';
import PremiumHeatmap from './premium-heatmap';
import ArbitrageCalculator from './arbitrage-calculator';
import type { DashboardData, MultiCoinKimpData, CoinPremium, KimpHistoryPoint } from '@/lib/types';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [multiCoinData, setMultiCoinData] = useState<MultiCoinKimpData | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinPremium | null>(null);
  const [sessionHistory, setSessionHistory] = useState<KimpHistoryPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchData = async () => {
    try {
      const [kimpRes, multiRes] = await Promise.all([
        fetch('/api/kimp'),
        fetch('/api/multi-kimp'),
      ]);

      if (!kimpRes.ok) throw new Error('API 오류');
      const json: DashboardData = await kimpRes.json();
      setData(json);

      if (multiRes.ok) {
        const multiJson: MultiCoinKimpData = await multiRes.json();
        setMultiCoinData(multiJson);
      }

      setError(null);
      setLastUpdated(new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' }));
      setSessionHistory((prev) => {
        if (json.history.length > 0) {
          return prev;
        }

        return [
          ...prev,
          { collectedAt: new Date().toISOString(), value: json.kimp.kimchiPremium },
        ].slice(-4320);
      });
    } catch (err) {
      setError('데이터를 불러올 수 없습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-dot-accent"
                style={{
                  opacity: 0.2 + (i * 0.2),
                  animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
          <p className="text-dot-sub text-sm">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-dot-red text-lg mb-2">{error}</p>
          <button
            onClick={fetchData}
            className="text-sm text-dot-sub hover:text-dot-accent transition px-4 py-2 border-2 border-dot-border hover:border-dot-accent"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const chartData = data.history.length > 0 ? data.history : sessionHistory;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-dot-muted font-mono">마지막 업데이트: {lastUpdated}</p>
        <button
          onClick={fetchData}
          className="text-xs text-dot-muted hover:text-dot-accent transition font-mono"
        >
          [ 새로고침 ]
        </button>
      </div>

      <KimpCard kimp={data.kimp} avg30d={data.avg30d} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FundingRateCard data={data.fundingRate} />
        <FearGreedCard data={data.fearGreed} />
        <SignalBadge signal={data.signal} />
      </div>

      <KimpChart data={chartData} />

      {multiCoinData && (
        <>
          <PremiumHeatmap data={multiCoinData} onSelectCoin={setSelectedCoin} />
          <ArbitrageCalculator data={multiCoinData} selectedCoin={selectedCoin} />
        </>
      )}
    </div>
  );
}
