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
  usdtPremiumRange: DayRange | null;
  btcDominanceRange: DayRange | null;
  longShortRange: DayRange | null;
  oiRange: DayRange | null;
  liqRange: DayRange | null;
  stableRange: DayRange | null;
  volumeRange: DayRange | null;
  strategyBtcRange: DayRange | null;
  capitalRange: DayRange | null;
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
  const [usdtPremiumRange, setUsdtPremiumRange] = useState<DayRange | null>(null);
  const [btcDominanceRange, setBtcDominanceRange] = useState<DayRange | null>(null);
  const [longShortRange, setLongShortRange] = useState<DayRange | null>(null);
  const [oiRange, setOiRange] = useState<DayRange | null>(null);
  const [liqRange, setLiqRange] = useState<DayRange | null>(null);
  const [stableRange, setStableRange] = useState<DayRange | null>(null);
  const [volumeRange, setVolumeRange] = useState<DayRange | null>(null);
  const [strategyBtcRange, setStrategyBtcRange] = useState<DayRange | null>(null);
  const [capitalRange, setCapitalRange] = useState<DayRange | null>(null);

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

      // Track daily range for USDT premium
      const up = json.usdtPremium.premium;
      setUsdtPremiumRange((prev) => {
        if (!prev) return { min: up, max: up, current: up };
        return { min: Math.min(prev.min, up), max: Math.max(prev.max, up), current: up };
      });

      // Track daily range for BTC dominance
      const dom = json.btcDominance.dominance;
      setBtcDominanceRange((prev) => {
        if (!prev) return { min: dom, max: dom, current: dom };
        return { min: Math.min(prev.min, dom), max: Math.max(prev.max, dom), current: dom };
      });

      // Track daily range for long/short ratio
      const ls = json.longShortRatio.longShortRatio;
      setLongShortRange((prev) => {
        if (!prev) return { min: ls, max: ls, current: ls };
        return { min: Math.min(prev.min, ls), max: Math.max(prev.max, ls), current: ls };
      });

      // Track daily range for open interest
      const oiVal = json.openInterest.oiUsd;
      setOiRange((prev) => {
        if (!prev) return { min: oiVal, max: oiVal, current: oiVal };
        return { min: Math.min(prev.min, oiVal), max: Math.max(prev.max, oiVal), current: oiVal };
      });

      // Track daily range for liquidation ratio
      const liqVal = json.liquidation.ratio;
      setLiqRange((prev) => {
        if (!prev) return { min: liqVal, max: liqVal, current: liqVal };
        return { min: Math.min(prev.min, liqVal), max: Math.max(prev.max, liqVal), current: liqVal };
      });

      // Track daily range for stablecoin change
      const stableVal = json.stablecoinMcap.change24h;
      setStableRange((prev) => {
        if (!prev) return { min: stableVal, max: stableVal, current: stableVal };
        return { min: Math.min(prev.min, stableVal), max: Math.max(prev.max, stableVal), current: stableVal };
      });

      // Track daily range for volume change
      const volVal = json.volumeChange.binanceChangeRate || json.volumeChange.changeRate;
      setVolumeRange((prev) => {
        if (!prev) return { min: volVal, max: volVal, current: volVal };
        return { min: Math.min(prev.min, volVal), max: Math.max(prev.max, volVal), current: volVal };
      });

      // Track daily range for Strategy BTC holdings change rate
      const strategyBtcVal = json.strategyBtc.changeRate;
      setStrategyBtcRange((prev) => {
        if (!prev) return { min: strategyBtcVal, max: strategyBtcVal, current: strategyBtcVal };
        return {
          min: Math.min(prev.min, strategyBtcVal),
          max: Math.max(prev.max, strategyBtcVal),
          current: strategyBtcVal,
        };
      });

      // Track daily range for Strategy capital engine estimate
      const capitalVal = json.strategyCapital.currentWeekEstimatedBtc;
      setCapitalRange((prev) => {
        if (!prev) return { min: capitalVal, max: capitalVal, current: capitalVal };
        return { min: Math.min(prev.min, capitalVal), max: Math.max(prev.max, capitalVal), current: capitalVal };
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
    <DataContext.Provider value={{ data, multiCoinData, sessionHistory, chartData, fundingRange, fearGreedRange, usdtPremiumRange, btcDominanceRange, longShortRange, oiRange, liqRange, stableRange, volumeRange, strategyBtcRange, capitalRange, error, loading, lastUpdated, fetchData }}>
      {children}
    </DataContext.Provider>
  );
}
