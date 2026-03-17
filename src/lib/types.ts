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
  weight: number;        // 가중치 (0.5 ~ 2.0)
  weightedScore: number; // 가중 적용된 점수
}

export type SignalLevel = '극과열' | '과열' | '중립' | '침체' | '극침체';
export type TrendDirection = '급상승' | '상승' | '보합' | '하락' | '급하락';

export interface CompositeSignal {
  level: SignalLevel;
  color: string;
  description: string;
  score: number;           // 가중 점수 (raw sum)
  normalizedScore: number; // 정규화 점수 (-100 ~ +100)
  maxPossibleScore: number;
  trend: TrendDirection;   // 추세 방향
  scoreChange: number;     // 이전 대비 점수 변화량
  factors: SignalFactor[];
}

export interface AlertUser {
  chatId: number;
  threshold: number;
  active: boolean;
}

export interface UsdtPremiumData {
  usdtKrwPrice: number;
  actualUsdKrw: number;
  premium: number;
  timestamp: string;
}

export interface BtcDominanceData {
  dominance: number;
  totalMarketCap: number;
  btcMarketCap: number;
  timestamp: string;
}

export interface LongShortRatioData {
  longRatio: number;
  shortRatio: number;
  longShortRatio: number;
  timestamp: string;
}

export interface OpenInterestData {
  oi: number;
  oiUsd: number;
  changeRate: number;   // 24h OI 변화율 (%)
  timestamp: string;
}

export interface LiquidationData {
  longLiqUsd: number;
  shortLiqUsd: number;
  totalLiqUsd: number;
  ratio: number;         // long/total (0~1)
  timestamp: string;
}

export interface StablecoinMcapData {
  totalMcap: number;
  change24h: number;     // 24h 변화율 (%)
  timestamp: string;
}

export interface VolumeChangeData {
  volume24h: number;
  volumeAvg7d: number;
  changeRate: number;    // (24h / 7d avg - 1) * 100
  binanceVolume24h: number;     // Binance BTCUSDT 24h 거래량 (BTC)
  binanceVolumeAvg7d: number;   // Binance 7일 평균 거래량 (BTC)
  binanceChangeRate: number;    // Binance 거래량 변화율 (%)
  timestamp: string;
}

export type StrategyCapitalStatus = 'active' | 'standby' | 'unavailable';

export interface StrategyCapitalEstimateDay {
  date: string;
  closePrice: number;
  btcPrice: number;
  totalVolume: number;
  eligibleVolume: number;
  regularEligibleVolume: number;
  extendedEligibleVolume: number;
  eligibleRatio: number;
  estimatedAtmVolume: number;
  estimatedNetProceedsUsd: number;
  estimatedBtc: number;
}

export interface StrategyCapitalConfirmation {
  filedDate: string;
  period: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  sharesSold: number;
  netProceedsUsd: number;
  avgBtcPrice: number;
  estimatedBtc: number;
  secUrl: string;
}

export interface StrategyCapitalData {
  ticker: string;
  status: StrategyCapitalStatus;
  thresholdPrice: number;
  currentPrice: number;
  distanceToThreshold: number;
  currentYield: number;
  annualizedDividend: number;
  exDividendDate: string | null;
  marketOpen: boolean;
  currentDay: StrategyCapitalEstimateDay | null;
  currentWeekEstimatedBtc: number;
  currentWeekEstimatedNetProceedsUsd: number;
  recentDays: StrategyCapitalEstimateDay[];
  latestConfirmed: StrategyCapitalConfirmation | null;
  confirmedTotalEstimatedBtc: number;
  confirmedTotalNetProceedsUsd: number;
  confirmedTotalSharesSold: number;
  timestamp: string;
}

export type OnchainDataStatus = 'available' | 'unavailable';
export type OnchainDataSource = 'supabase' | 'local-postgres' | 'fallback';

export type OnchainMetricId =
  | 'created_utxo_count'
  | 'spent_utxo_count'
  | 'spent_btc'
  | 'dormant_reactivated_btc'
  | 'active_supply_ratio_30d'
  | 'active_supply_ratio_90d';

export interface OnchainMetricPoint {
  day: string;
  value: number;
  unit: string;
}

export interface OnchainMetricSummary {
  id: OnchainMetricId;
  label: string;
  description: string;
  metricName: string;
  dimensionKey: string;
  unit: string;
  latestDay: string | null;
  latestValue: number | null;
  previousValue: number | null;
  changeValue: number | null;
  changePercent: number | null;
  series: OnchainMetricPoint[];
}

export interface OnchainEntityFlowEntry {
  day: string;
  entitySlug: string;
  receivedSats: number;
  sentSats: number;
  netflowSats: number;
  txCount: number;
}

export interface OnchainAlertEvent {
  detectedAt: string;
  alertType: string;
  severity: string;
  title: string;
  body: string;
  relatedTxid: string | null;
  relatedEntitySlug: string | null;
  context: Record<string, unknown>;
}

export interface OnchainAlertStats {
  total: number;
  high: number;
  medium: number;
  info: number;
}

export interface OnchainSummaryData {
  status: OnchainDataStatus;
  source: OnchainDataSource;
  message: string | null;
  latestDay: string | null;
  metrics: OnchainMetricSummary[];
  entityFlows: OnchainEntityFlowEntry[];
  alerts: OnchainAlertEvent[];
  alertStats: OnchainAlertStats;
  updatedAt: string;
}

export type OnchainPressureLevel = '완화' | '균형' | '혼잡';
export type OnchainRegimeLabel = '확장' | '중립' | '위축';
export type OnchainRegimeTone = 'expansion' | 'neutral' | 'contraction';

export interface OnchainProjectedBlock {
  blockVSize: number;
  txCount: number;
  medianFee: number;
}

export interface OnchainFeePressureData {
  pressure: OnchainPressureLevel;
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
  mempoolTxCount: number;
  mempoolVsize: number;
  totalFeeBtc: number;
  projectedBlocks: OnchainProjectedBlock[];
}

export interface OnchainBlockTempoData {
  currentHeight: number;
  latestBlockAt: string;
  latestBlockTxCount: number;
  minutesSinceLastBlock: number;
  averageBlockMinutes: number;
  difficultyChange: number;
  difficultyProgress: number;
  remainingBlocksToAdjustment: number;
  estimatedRetargetAt: string | null;
}

export interface OnchainNetworkPulseData {
  marketContext: OnchainMarketContextData;
  feePressure: OnchainFeePressureData;
  feeHistory: OnchainFeeRegimeHistoryData;
  blockTempo: OnchainBlockTempoData;
}

export interface OnchainMarketContextPoint {
  time: string;
  priceUsd: number;
}

export interface OnchainMarketContextData {
  currentPriceUsd: number;
  windowDays: number;
  history: OnchainMarketContextPoint[];
}

export interface OnchainFeeRegimeHistoryPoint {
  height: number;
  timestamp: string;
  medianFee: number;
  avgFeeRate: number;
  txCount: number;
  totalFeesBtc: number;
}

export interface OnchainFeeRegimeHistoryData {
  tone: 'relief' | 'balanced' | 'hot';
  label: string;
  trend: '상승' | '완화' | '안정';
  summary: string;
  latestMedianFee: number;
  averageMedianFee: number;
  peakMedianFee: number;
  points: OnchainFeeRegimeHistoryPoint[];
}

export interface OnchainWhaleSummary {
  windowHours: number;
  totalAlerts: number;
  confirmedCount: number;
  pendingCount: number;
  dormantCount: number;
  totalMovedBtc: number;
  confirmedMovedBtc: number;
  pendingMovedBtc: number;
  dormantMovedBtc: number;
  largestMoveBtc: number;
  dominantAlertType: string | null;
  latestDetectedAt: string | null;
  slices: OnchainWhaleSlice[];
  buckets: OnchainWhaleBucket[];
}

export interface OnchainWhaleSlice {
  key: 'confirmed' | 'pending' | 'dormant';
  label: string;
  movedBtc: number;
  count: number;
}

export interface OnchainWhaleBucket {
  startAt: string;
  endAt: string;
  movedBtc: number;
  alertCount: number;
}

export interface OnchainRegimeSummary {
  label: OnchainRegimeLabel;
  tone: OnchainRegimeTone;
  score: number;
  summary: string;
  drivers: string[];
  factors: OnchainRegimeFactor[];
}

export interface OnchainRegimeFactor {
  label: string;
  contribution: number;
  detail: string;
}

export interface OnchainDormancyPulsePoint {
  day: string;
  value: number;
}

export interface OnchainDormancyPulseData {
  tone: 'calm' | 'watch' | 'spike';
  label: string;
  summary: string;
  latestDay: string | null;
  latestValue: number;
  baselineValue: number;
  ratio: number;
  changePercent: number | null;
  active30dRatio: number | null;
  active90dRatio: number | null;
  series: OnchainDormancyPulsePoint[];
}

export interface OnchainFlowPressureEntry {
  entitySlug: string;
  netflowBtc: number;
  receivedBtc: number;
  sentBtc: number;
  txCount: number;
  direction: 'inflow' | 'outflow';
}

export interface OnchainFlowPressureData {
  tone: 'inflow' | 'outflow' | 'balanced';
  scope: 'exchange' | 'labeled';
  label: string;
  summary: string;
  latestDay: string | null;
  trackedEntityCount: number;
  exchangeEntityCount: number;
  totalReceivedBtc: number;
  totalSentBtc: number;
  netflowBtc: number;
  leaders: OnchainFlowPressureEntry[];
}

export interface OnchainBriefingData {
  tone: OnchainRegimeTone;
  headline: string;
  summary: string;
  bullets: string[];
  watchLabel: string;
}

export interface OnchainAgeBandSegment {
  key: 'hot' | 'warm' | 'cold';
  label: string;
  share: number;
  description: string;
}

export interface OnchainAgeBandSummary {
  tone: 'rotation' | 'balanced' | 'dormant';
  label: string;
  summary: string;
  latestDay: string | null;
  hotShare: number;
  warmShare: number;
  coldShare: number;
  active30d: number;
  active90d: number;
  dormantMovedBtc: number | null;
  segments: OnchainAgeBandSegment[];
}

export interface OnchainSupportResistanceSummary {
  tone: 'supportive' | 'neutral' | 'capped';
  label: string;
  summary: string;
  currentPriceUsd: number;
  periodLowUsd: number;
  periodAverageUsd: number;
  periodHighUsd: number;
  supportUsd: number;
  resistanceUsd: number;
  supportDistancePercent: number;
  resistanceDistancePercent: number;
  windowDays: number;
}

export interface DashboardData {
  kimp: KimpData;
  fundingRate: FundingRateData;
  fearGreed: FearGreedData;
  usdtPremium: UsdtPremiumData;
  btcDominance: BtcDominanceData;
  longShortRatio: LongShortRatioData;
  openInterest: OpenInterestData;
  liquidation: LiquidationData;
  stablecoinMcap: StablecoinMcapData;
  volumeChange: VolumeChangeData;
  strategyCapital: StrategyCapitalData;
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

export type BtcReturnsPeriod = 'monthly' | 'quarterly';

export interface BtcReturnsRow {
  label: string;
  values: Array<number | null>;
}

export interface BtcReturnsSection {
  period: BtcReturnsPeriod;
  title: string;
  columns: string[];
  rows: BtcReturnsRow[];
}

export interface BtcReturnsHistory {
  sourceUrl: string;
  fetchedAt: string;
  monthly: BtcReturnsSection;
  quarterly: BtcReturnsSection;
}

export interface IndicatorsPageData {
  kimpHistory: ExtendedKimpHistoryPoint[];
  fundingRateHistory: FundingRateHistoryPoint[];
  fearGreedHistory: FearGreedHistoryPoint[];
  btcReturnsHistory: BtcReturnsHistory | null;
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
