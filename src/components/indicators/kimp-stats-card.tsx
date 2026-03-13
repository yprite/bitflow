'use client';

import type { KimpStats } from '@/lib/types';
import LivePulse from '@/components/motion/indicators/LivePulse';

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
          <StatItem label="최대" value={`${stats.max.toFixed(2)}%`} color="text-red-500" />
          <StatItem label="최소" value={`${stats.min.toFixed(2)}%`} color="text-blue-500" />
          <StatItem label="표준편차" value={`${stats.stdDev.toFixed(3)}`} />
        </div>

        {/* Position bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-dot-muted font-mono">
            <span>{stats.min.toFixed(2)}%</span>
            <span>현재 위치</span>
            <span>{stats.max.toFixed(2)}%</span>
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 via-gray-300 to-red-400 rounded-full"
              style={{ width: '100%' }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-dot-text rounded-full border-2 border-white shadow-sm"
              style={{ left: `calc(${Math.min(Math.max(position, 2), 98)}% - 5px)` }}
            />
          </div>
          <p className="text-[10px] text-dot-muted text-center font-mono">
            {stats.dataPoints}개 데이터 포인트 기반
          </p>
        </div>
      </div>
    </div>
  );
}
