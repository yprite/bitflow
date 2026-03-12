export interface KimpData {
  upbitPrice: number;
  binancePrice: number;
  usdKrw: number;
  kimchiPremium: number;
  timestamp: string;
}

export interface FundingRateData {
  symbol: string;
  fundingRate: number;
  nextFundingTime: number;
}

export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: string;
}

export interface CompositeSignal {
  level: '과열' | '중립' | '침체';
  color: string;
  description: string;
}

export interface AlertUser {
  chatId: number;
  threshold: number;
  active: boolean;
}

export interface DashboardData {
  kimp: KimpData;
  fundingRate: FundingRateData;
  fearGreed: FearGreedData;
  signal: CompositeSignal;
  avg30d: number | null;
}
