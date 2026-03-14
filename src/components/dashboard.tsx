'use client';

import { useState, useEffect } from 'react';
import SignalBadge from './signal-badge';
import MarketBriefing from './market-briefing';
import EventStrip from './event-strip';
import OrbitalSilence from './motion/storytelling/OrbitalSilence';
import { useData } from './data-provider';

export default function Dashboard() {
  const { data, error, loading, lastUpdated, fetchData } = useData();
  const [phase, setPhase] = useState<'loading' | 'exiting' | 'ready'>('loading');

  useEffect(() => {
    if (!loading && phase === 'loading') {
      if (data) {
        // Data loaded — play exit animation then show content
        setPhase('exiting');
        const timer = setTimeout(() => setPhase('ready'), 400);
        return () => clearTimeout(timer);
      } else {
        // Error or no data — skip animation, show error UI
        setPhase('ready');
      }
    }
  }, [loading, data, phase]);

  useEffect(() => {
    if (loading && phase === 'ready') setPhase('loading');
  }, [loading, phase]);

  if (phase !== 'ready') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={phase === 'exiting' ? 'dot-exit' : ''}>
          <OrbitalSilence />
        </div>
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
      <div className="dot-entrance" style={{ '--entrance-delay': '120ms' } as React.CSSProperties}>
        <SignalBadge signal={data.signal} upbitPrice={data.kimp.upbitPrice} />
      </div>

      {/* 시장 브리핑 — 인사이트 해석 레이어 */}
      <div className="dot-entrance" style={{ '--entrance-delay': '240ms' } as React.CSSProperties}>
        <MarketBriefing data={data} />
      </div>

      {/* 매크로 이벤트 캘린더 */}
      <div className="dot-entrance" style={{ '--entrance-delay': '360ms' } as React.CSSProperties}>
        <EventStrip />
      </div>

      {/* 지표 상세 페이지 링크 */}
      <div className="dot-entrance" style={{ '--entrance-delay': '480ms' } as React.CSSProperties}>
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
