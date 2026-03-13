'use client';

import type { KimpData } from '@/lib/types';
import DotCluster from './motion/indicators/DotCluster';
import InsightBloom from './motion/indicators/InsightBloom';
import DotKPIValue from './motion/typography/DotKPIValue';
import DotValueRefresh, { refreshStyle, residueStyle } from './motion/transitions/DotValueRefresh';
import { useReducedMotion } from './motion/core/useReducedMotion';
import LivePulse from './motion/indicators/LivePulse';

interface KimpCardProps {
  kimp: KimpData;
  avg30d: number | null;
}

export default function KimpCard({ kimp, avg30d }: KimpCardProps) {
  const reducedMotion = useReducedMotion();
  const isPositive = kimp.kimchiPremium >= 0;

  const badgeState = avg30d !== null
    ? kimp.kimchiPremium > avg30d ? 'above' : 'below'
    : null;
  const badge = badgeState === 'above' ? '평균 이상 ↑' : badgeState === 'below' ? '평균 이하 ↓' : null;
  const badgeColor = badgeState === 'above'
    ? 'bg-emerald-50 text-dot-green border border-emerald-200'
    : badgeState === 'below'
    ? 'bg-red-50 text-dot-red border border-red-200'
    : '';

  return (
    <div className="dot-card p-4 sm:p-6">
      <div className="dot-card-inner">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-dot-sub uppercase tracking-wider flex items-center gap-2">
            <LivePulse size={5} />
            김치프리미엄
          </h2>
          {badge && (
            <span className={`text-xs px-2 py-0.5 font-mono relative ${badgeColor}`}>
              30일 {badge}
              <InsightBloom trigger={badgeState ?? ''} dotCount={6} travelDistance={20} dotSize={2} />
            </span>
          )}
        </div>

        {/* Primary KPI: dot-morphing premium value */}
        <div className="mb-1">
          <DotKPIValue
            value={kimp.kimchiPremium}
            decimals={2}
            suffix="%"
            showSign
            fontScale={8}
            morphMode="reconfigure"
            morphDuration={600}
          />
        </div>

        <div className="mt-2 mb-4">
          <DotCluster value={kimp.kimchiPremium} pulse />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 text-sm dot-border-t pt-4">
          {/* Sub-values with refresh transition */}
          <div>
            <p className="text-dot-muted text-xs mb-1">업비트 BTC</p>
            <DotValueRefresh value={kimp.upbitPrice}>
              {({ current, previous, showResidue, residueOpacity, pulseScale }) => (
                <div className="relative">
                  {showResidue && previous !== null && (
                    <p className="text-dot-text font-mono font-medium text-xs sm:text-sm" style={residueStyle(residueOpacity, reducedMotion)}>
                      {Number(previous).toLocaleString()}원
                    </p>
                  )}
                  <p className="text-dot-text font-mono font-medium text-xs sm:text-sm" style={refreshStyle(pulseScale, reducedMotion)}>
                    {Number(current).toLocaleString()}원
                  </p>
                </div>
              )}
            </DotValueRefresh>
          </div>
          <div>
            <p className="text-dot-muted text-xs mb-1">해외 BTC</p>
            <DotValueRefresh value={kimp.globalPrice}>
              {({ current, previous, showResidue, residueOpacity, pulseScale }) => (
                <div className="relative">
                  {showResidue && previous !== null && (
                    <p className="text-dot-text font-mono font-medium text-xs sm:text-sm" style={residueStyle(residueOpacity, reducedMotion)}>
                      ${Number(previous).toLocaleString()}
                    </p>
                  )}
                  <p className="text-dot-text font-mono font-medium text-xs sm:text-sm" style={refreshStyle(pulseScale, reducedMotion)}>
                    ${Number(current).toLocaleString()}
                  </p>
                </div>
              )}
            </DotValueRefresh>
          </div>
          <div>
            <p className="text-dot-muted text-xs mb-1">환율</p>
            <DotValueRefresh value={Math.round(kimp.usdKrw)}>
              {({ current, previous, showResidue, residueOpacity, pulseScale }) => (
                <div className="relative">
                  {showResidue && previous !== null && (
                    <p className="text-dot-text font-mono font-medium text-xs sm:text-sm" style={residueStyle(residueOpacity, reducedMotion)}>
                      {Number(previous).toLocaleString()}원
                    </p>
                  )}
                  <p className="text-dot-text font-mono font-medium text-xs sm:text-sm" style={refreshStyle(pulseScale, reducedMotion)}>
                    {Number(current).toLocaleString()}원
                  </p>
                </div>
              )}
            </DotValueRefresh>
          </div>
        </div>
      </div>
    </div>
  );
}
