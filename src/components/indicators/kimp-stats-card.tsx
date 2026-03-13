'use client';

import type { KimpStats } from '@/lib/types';
import LivePulse from '@/components/motion/indicators/LivePulse';
import { clamp } from '@/components/motion/core/dot-math';

interface Props {
  stats: KimpStats;
  period: string;
}

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-dot-muted uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-mono font-semibold ${color ?? 'text-dot-text'}`}>{value}</span>
    </div>
  );
}

/**
 * Dot-density position bar. A row of dots where density and size
 * increases toward the current value position. The current position
 * dot is the largest and most opaque.
 */
function DotPositionBar({ position, min, max }: { position: number; min: number; max: number }) {
  const DOT_COUNT = 24;
  const BAR_WIDTH = 100; // SVG viewBox width
  const BAR_HEIGHT = 10;

  return (
    <svg viewBox={`0 0 ${BAR_WIDTH} ${BAR_HEIGHT}`} className="w-full h-2.5" preserveAspectRatio="xMidYMid meet">
      {/* Background dots: uniform small dots */}
      {Array.from({ length: DOT_COUNT }, (_, i) => {
        const x = (i / (DOT_COUNT - 1)) * BAR_WIDTH;
        const dist = Math.abs(x / BAR_WIDTH * 100 - position) / 100;
        const proximity = 1 - clamp(dist * 3, 0, 1);

        // Dots near the current position are larger and more opaque
        const r = 0.8 + proximity * 2;
        const opacity = 0.06 + proximity * 0.75;

        return (
          <circle
            key={i}
            cx={x}
            cy={BAR_HEIGHT / 2}
            r={r}
            fill="#1a1a1a"
            opacity={opacity}
          />
        );
      })}

      {/* Current position marker: crisp dot */}
      <circle
        cx={clamp(position, 2, 98) / 100 * BAR_WIDTH}
        cy={BAR_HEIGHT / 2}
        r={3.5}
        fill="#1a1a1a"
        opacity={0.9}
      />
      <circle
        cx={clamp(position, 2, 98) / 100 * BAR_WIDTH}
        cy={BAR_HEIGHT / 2}
        r={1.5}
        fill="white"
      />
    </svg>
  );
}

function getPercentilePosition(current: number, min: number, max: number): number {
  if (max === min) return 50;
  return ((current - min) / (max - min)) * 100;
}

export default function KimpStatsCard({ stats, period }: Props) {
  const position = getPercentilePosition(stats.current, stats.min, stats.max);

  return (
    <div className="dot-card p-4 sm:p-6">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <LivePulse size={4} />
          김프 통계 ({period})
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
          <StatItem label="현재" value={`${stats.current.toFixed(2)}%`} color="text-dot-accent" />
          <StatItem label="평균" value={`${stats.avg.toFixed(2)}%`} />
          <StatItem label="중앙값" value={`${stats.median.toFixed(2)}%`} />
          <StatItem label="최대" value={`${stats.max.toFixed(2)}%`} />
          <StatItem label="최소" value={`${stats.min.toFixed(2)}%`} />
          <StatItem label="표준편차" value={`${stats.stdDev.toFixed(3)}`} />
        </div>

        {/* Dot-density position bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-dot-muted font-mono">
            <span>{stats.min.toFixed(2)}%</span>
            <span>현재 위치</span>
            <span>{stats.max.toFixed(2)}%</span>
          </div>
          <DotPositionBar position={position} min={stats.min} max={stats.max} />
          <p className="text-[10px] text-dot-muted text-center font-mono">
            {stats.dataPoints}개 데이터 포인트 기반
          </p>
        </div>
      </div>
    </div>
  );
}
