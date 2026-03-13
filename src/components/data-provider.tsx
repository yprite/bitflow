'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { DashboardData, MultiCoinKimpData, KimpHistoryPoint } from '@/lib/types';

export interface DayRange {
  min: number;
  max: number;
  current: number;
}

interface DataContextType {
  data: DashboardData | null;
  multiCoinData: MultiCoinKimpData | null;
  sessionHistory: KimpHistoryPoint[];
  chartData: KimpHistoryPoint[];
  fundingRange: DayRange | null;
  fearGreedRange: DayRange | null;
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
  const [fundingRange, setFundingRange] = useState<DayRange | null>(null);
  const [fearGreedRange, setFearGreedRange] = useState<DayRange | null>(null);

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

      // Track daily range for funding rate
      const fr = json.fundingRate.fundingRate * 100;
      setFundingRange((prev) => {
        if (!prev) return { min: fr, max: fr, current: fr };
        return { min: Math.min(prev.min, fr), max: Math.max(prev.max, fr), current: fr };
      });

      // Track daily range for fear & greed
      const fg = json.fearGreed.value;
      setFearGreedRange((prev) => {
        if (!prev) return { min: fg, max: fg, current: fg };
        return { min: Math.min(prev.min, fg), max: Math.max(prev.max, fg), current: fg };
      });

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
    <DataContext.Provider value={{ data, multiCoinData, sessionHistory, chartData, fundingRange, fearGreedRange, error, loading, lastUpdated, fetchData }}>
      {children}
    </DataContext.Provider>
  );
}
