export interface KimpData {
  upbitPrice: number;
  globalPrice: number;
  usdKrw: number;
  kimchiPremium: number;
  timestamp: string;
}

export interface KimpHistoryPoint {
  collectedAt: string;
  value: number;
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

export interface SignalFactor {
  label: string;
  value: string;
  direction: '과열' | '중립' | '침체';
}

export interface CompositeSignal {
  level: '과열' | '중립' | '침체';
  color: string;
  description: string;
  score: number;
  factors: SignalFactor[];
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
  history: KimpHistoryPoint[];
}

// 멀티코인 김프 히트맵
export interface CoinPremium {
  symbol: string;
  name: string;
  upbitPrice: number;
  globalPrice: number;
  premium: number;
  marketCap: number | null;
  marketCapRank: number;
}

export interface MultiCoinKimpData {
  coins: CoinPremium[];
  usdKrw: number;
  timestamp: string;
}

// 지표 페이지 확장 타입
export interface ExtendedKimpHistoryPoint {
  collectedAt: string;
  value: number;
  usdKrw: number;
}

export interface FundingRateHistoryPoint {
  timestamp: string;
  rate: number;
}

export interface FearGreedHistoryPoint {
  timestamp: string;
  value: number;
  classification: string;
}

export interface DailyKimpSummary {
  date: string;
  avg: number;
  min: number;
  max: number;
  count: number;
}

export interface KimpStats {
  avg: number;
  min: number;
  max: number;
  stdDev: number;
  median: number;
  current: number;
  dataPoints: number;
}

export interface IndicatorsPageData {
  kimpHistory: ExtendedKimpHistoryPoint[];
  fundingRateHistory: FundingRateHistoryPoint[];
  fearGreedHistory: FearGreedHistoryPoint[];
  multiCoin: CoinPremium[];
  usdKrw: number;
}

// 차익거래 계산기
export interface ArbitrageParams {
  coin: string;
  amount: number; // 투자 금액 (원)
  direction: 'buy-kr-sell-global' | 'buy-global-sell-kr';
}

export interface ArbitrageResult {
  coin: string;
  direction: string;
  investmentKrw: number;
  premium: number;
  grossProfit: number;
  exchangeFeeKr: number;      // 한국 거래소 수수료
  exchangeFeeGlobal: number;  // 해외 거래소 수수료
  withdrawalFee: number;      // 출금 수수료
  networkFee: number;         // 네트워크 전송 수수료 (원화 환산)
  slippage: number;           // 예상 슬리피지
  netProfit: number;          // 순수익
  netProfitRate: number;      // 순수익률 (%)
  estimatedTime: string;      // 예상 소요시간
  viable: boolean;            // 수익 가능 여부
}
