'use client';

import SignalBadge from './signal-badge';
import SignalFactors from './signal-factors';
import MarketBriefing from './market-briefing';
import EventStrip from './event-strip';
import OrbitalSilence from './motion/storytelling/OrbitalSilence';
import { useData } from './data-provider';

export default function Dashboard() {
  const { data, error, loading, lastUpdated, fetchData } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <OrbitalSilence />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-dot-red text-lg mb-2">{error}</p>
          <button
            onClick={fetchData}
            className="text-sm text-dot-sub hover:text-dot-accent transition px-4 py-2 border-2 border-dot-border hover:border-dot-accent"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="dot-entrance flex items-center justify-between" style={{ '--entrance-delay': '0ms' } as React.CSSProperties}>
        <p className="text-xs text-dot-muted font-mono">마지막 업데이트: {lastUpdated}</p>
        <button
          onClick={fetchData}
          className="text-xs text-dot-muted hover:text-dot-accent transition font-mono"
        >
          [ 새로고침 ]
        </button>
      </div>

      {/* 시장 온도 */}
      <div className="dot-entrance" style={{ '--entrance-delay': '80ms' } as React.CSSProperties}>
        <SignalBadge signal={data.signal} />
      </div>

      {/* 시장 브리핑 — 인사이트 해석 레이어 */}
      <div className="dot-entrance" style={{ '--entrance-delay': '120ms' } as React.CSSProperties}>
        <MarketBriefing data={data} />
      </div>

      {/* 팩터 분석 */}
      <div className="dot-entrance" style={{ '--entrance-delay': '160ms' } as React.CSSProperties}>
        <SignalFactors signal={data.signal} />
      </div>

      {/* 매크로 이벤트 캘린더 */}
      <div className="dot-entrance" style={{ '--entrance-delay': '200ms' } as React.CSSProperties}>
        <EventStrip />
      </div>

      {/* 지표 상세 페이지 링크 */}
      <div className="dot-entrance" style={{ '--entrance-delay': '240ms' } as React.CSSProperties}>
        <a
          href="/realtime"
          className="dot-card p-4 flex items-center justify-between group hover:border-dot-accent/40 transition-colors"
        >
          <div>
            <span className="text-xs font-semibold text-dot-sub uppercase tracking-wider">실시간 지표</span>
            <p className="text-[10px] text-dot-muted/60 mt-0.5">11개 개별 지표 상세 보기</p>
          </div>
          <span className="text-dot-muted group-hover:text-dot-accent transition text-sm font-mono">→</span>
        </a>
      </div>
    </div>
  );
}
