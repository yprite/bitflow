'use client';

import { useState, useEffect } from 'react';

interface TugOfWarBarProps {
  readonly bullRatio: number;
  readonly totalCount: number;
  readonly isAnimating?: boolean;
  readonly badge?: string | null;
}

const SPRING_BEZIER = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const TRANSITION_DURATION = '0.3s';
const EXTREME_THRESHOLD_HIGH = 0.8;
const EXTREME_THRESHOLD_LOW = 0.2;

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function getGlowStyle(bullRatio: number): React.CSSProperties {
  if (bullRatio >= EXTREME_THRESHOLD_HIGH) {
    return { boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' };
  }
  if (bullRatio <= EXTREME_THRESHOLD_LOW) {
    return { boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)' };
  }
  return {};
}

export function TugOfWarBar({
  bullRatio,
  totalCount,
  isAnimating = false,
}: TugOfWarBarProps) {
  const [shaking, setShaking] = useState(false);
  const bullPercent = formatPercent(bullRatio);
  const bearPercent = formatPercent(1 - bullRatio);
  const bullWidth = Math.max(bullRatio * 100, 5);
  const bearWidth = Math.max((1 - bullRatio) * 100, 5);

  useEffect(() => {
    if (!isAnimating) return;
    setShaking(true);
    const timer = setTimeout(() => setShaking(false), 500);
    return () => clearTimeout(timer);
  }, [isAnimating, totalCount]);

  return (
    <div className="w-full">
      <style jsx>{`
        @keyframes tug-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        .tug-shake {
          animation: tug-shake 0.5s ease-in-out;
        }
      `}</style>

      <div
        className={`
          flex w-full h-12 md:h-14 rounded-xl overflow-hidden
          ${shaking ? 'tug-shake' : ''}
        `}
        style={getGlowStyle(bullRatio)}
      >
        <div
          className="flex items-center justify-center bg-[#3B82F6] relative overflow-hidden"
          style={{
            width: `${bullWidth}%`,
            transition: `width ${TRANSITION_DURATION} ${SPRING_BEZIER}`,
          }}
        >
          <span className="text-white font-bold text-sm md:text-base z-10 select-none">
            Bull {bullPercent}
          </span>
        </div>

        <div
          className="flex items-center justify-center bg-[#EF4444] relative overflow-hidden"
          style={{
            width: `${bearWidth}%`,
            transition: `width ${TRANSITION_DURATION} ${SPRING_BEZIER}`,
          }}
        >
          <span className="text-white font-bold text-sm md:text-base z-10 select-none">
            Bear {bearPercent}
          </span>
        </div>
      </div>
    </div>
  );
}
