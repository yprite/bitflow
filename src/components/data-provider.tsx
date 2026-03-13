'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { DashboardData, MultiCoinKimpData, KimpHistoryPoint } from '@/lib/types';

interface DataContextType {
  data: DashboardData | null;
  multiCoinData: MultiCoinKimpData | null;
  sessionHistory: KimpHistoryPoint[];
  chartData: KimpHistoryPoint[];
  error: string | null;
  loading: boolean;
  lastUpdated: string;
  fetchData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export default function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [multiCoinData, setMultiCoinData] = useState<MultiCoinKimpData | null>(null);
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

  const chartData = data && data.history.length > 0 ? data.history : sessionHistory;

  return (
    <DataContext.Provider value={{ data, multiCoinData, sessionHistory, chartData, error, loading, lastUpdated, fetchData }}>
      {children}
    </DataContext.Provider>
  );
}
