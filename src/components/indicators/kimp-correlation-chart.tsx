'use client';

import type { ExtendedKimpHistoryPoint, FundingRateHistoryPoint } from '@/lib/types';
import LivePulse from '@/components/motion/indicators/LivePulse';

interface Props {
  kimpData: ExtendedKimpHistoryPoint[];
  fundingData: FundingRateHistoryPoint[];
}

interface CorrelationPoint {
  kimp: number;
  funding: number;
}

function correlate(
  kimpData: ExtendedKimpHistoryPoint[],
  fundingData: FundingRateHistoryPoint[]
): CorrelationPoint[] {
  // Match KIMP data points to nearest funding rate data points by timestamp
  const points: CorrelationPoint[] = [];
  const fundingTimes = fundingData.map((d) => new Date(d.timestamp).getTime());

  for (const kp of kimpData) {
    const kt = new Date(kp.collectedAt).getTime();
    // Find nearest funding rate
    let bestIdx = 0;
    let bestDist = Math.abs(fundingTimes[0] - kt);
    for (let i = 1; i < fundingTimes.length; i++) {
      const dist = Math.abs(fundingTimes[i] - kt);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    // Only match if within 12 hours
    if (bestDist < 12 * 60 * 60 * 1000) {
      points.push({
        kimp: kp.value,
        funding: fundingData[bestIdx].rate * 100,
      });
    }
  }

  return points;
}

function pearsonCorrelation(points: CorrelationPoint[]): number {
  if (points.length < 3) return 0;
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.kimp, 0);
  const sumY = points.reduce((s, p) => s + p.funding, 0);
  const sumXY = points.reduce((s, p) => s + p.kimp * p.funding, 0);
  const sumX2 = points.reduce((s, p) => s + p.kimp * p.kimp, 0);
  const sumY2 = points.reduce((s, p) => s + p.funding * p.funding, 0);

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return den === 0 ? 0 : num / den;
}

export default function KimpCorrelationChart({ kimpData, fundingData }: Props) {
  if (kimpData.length < 2 || fundingData.length < 2) {
    return (
      <div className="dot-card p-6">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-4">김프-펀딩비 상관관계</h2>
        <p className="text-dot-muted text-sm">데이터를 불러오는 중...</p>
      </div>
    );
  }

  const points = correlate(kimpData, fundingData);
  const r = pearsonCorrelation(points);

  if (points.length < 3) {
    return (
      <div className="dot-card p-6">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-4">김프-펀딩비 상관관계</h2>
        <p className="text-dot-muted text-sm">매칭 가능한 데이터가 부족합니다.</p>
      </div>
    );
  }

  const kimpValues = points.map((p) => p.kimp);
  const fundingValues = points.map((p) => p.funding);
  const kMin = Math.min(...kimpValues);
  const kMax = Math.max(...kimpValues);
  const fMin = Math.min(...fundingValues);
  const fMax = Math.max(...fundingValues);
  const kRange = kMax - kMin || 1;
  const fRange = fMax - fMin || 0.01;

  const CW = 100;
  const CH = 100;
  const P = 6;

  const dots = points.map((p) => ({
    x: P + ((p.kimp - kMin) / kRange) * (CW - P * 2),
    y: P + (CH - P * 2) - ((p.funding - fMin) / fRange) * (CH - P * 2),
    kimp: p.kimp,
    funding: p.funding,
  }));

  const rLabel =
    Math.abs(r) >= 0.7
      ? '강한 상관'
      : Math.abs(r) >= 0.4
        ? '보통 상관'
        : Math.abs(r) >= 0.2
          ? '약한 상관'
          : '거의 없음';
  const rColor = r >= 0.4 ? 'text-red-500' : r <= -0.4 ? 'text-blue-500' : 'text-dot-muted';

  return (
    <div className="dot-card p-4 sm:p-6">
      <div className="dot-card-inner">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider flex items-center gap-1.5">
            <LivePulse size={4} />
            김프-펀딩비 상관관계
          </h2>
          <div className="text-right">
            <span className={`text-sm font-mono font-semibold ${rColor}`}>
              r = {r.toFixed(3)}
            </span>
            <span className="text-[10px] text-dot-muted ml-1.5">{rLabel}</span>
          </div>
        </div>

        <div className="flex gap-3">
          {/* Y-axis: Funding Rate */}
          <div className="shrink-0 h-28 flex flex-col justify-between text-[10px] text-dot-muted font-mono text-right">
            <span>{fMax.toFixed(3)}%</span>
            <span>{((fMax + fMin) / 2).toFixed(3)}%</span>
            <span>{fMin.toFixed(3)}%</span>
          </div>
          <div className="flex-1 min-w-0">
            <svg
              viewBox={`0 0 ${CW} ${CH}`}
              className="w-full h-28"
              preserveAspectRatio="xMidYMid meet"
              overflow="hidden"
            >
              <defs>
                <pattern id="dotGridCorr" width="5" height="5" patternUnits="userSpaceOnUse">
                  <circle cx="2.5" cy="2.5" r="0.3" fill="#d1d5db" />
                </pattern>
              </defs>
              <rect width={CW} height={CH} fill="url(#dotGridCorr)" rx="1" />

              {/* Scatter dots */}
              {dots.map((d, i) => (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={1.5}
                  fill="#1a1a1a"
                  opacity={0.6}
                />
              ))}
            </svg>

            {/* X-axis labels: KIMP */}
            <div className="flex justify-between text-[10px] text-dot-muted mt-1.5 font-mono">
              <span>{kMin.toFixed(1)}%</span>
              <span className="text-[9px]">김프 →</span>
              <span>{kMax.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Y-axis label */}
        <div className="text-[9px] text-dot-muted mt-1 text-center font-mono">
          ↑ 펀딩비 | {points.length}개 데이터 포인트
        </div>
      </div>
    </div>
  );
}
