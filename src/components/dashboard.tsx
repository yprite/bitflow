'use client';

import { useEffect, useState } from 'react';
import KimpCard from './kimp-card';
import FundingRateCard from './funding-rate-card';
import FearGreedCard from './fear-greed-card';
import SignalBadge from './signal-badge';
import KimpChart from './kimp-chart';
import type { DashboardData } from '@/lib/types';

interface HistoryPoint {
  time: string;
  value: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/kimp');
      if (!res.ok) throw new Error('API 오류');
      const json: DashboardData = await res.json();
      setData(json);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' }));

      // 히스토리에 추가
      setHistory(prev => [
        ...prev,
        { time: new Date().toISOString(), value: json.kimp.kimchiPremium },
      ].slice(-4320)); // 최대 30일 (1분 간격 기준)
    } catch (err) {
      setError('데이터를 불러올 수 없습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000); // 1분마다 갱신
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 text-lg">데이터 로딩 중...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">{error}</p>
          <button
            onClick={fetchData}
            className="text-sm text-gray-400 hover:text-white transition px-4 py-2 rounded-lg border border-gray-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">마지막 업데이트: {lastUpdated}</p>
        <button
          onClick={fetchData}
          className="text-xs text-gray-500 hover:text-gray-300 transition"
        >
          새로고침
        </button>
      </div>

      <KimpCard kimp={data.kimp} avg30d={data.avg30d} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FundingRateCard data={data.fundingRate} />
        <FearGreedCard data={data.fearGreed} />
        <SignalBadge signal={data.signal} />
      </div>

      <KimpChart data={history} />
    </div>
  );
}
