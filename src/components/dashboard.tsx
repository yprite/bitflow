'use client';

import { useState, useEffect } from 'react';
import SignalBadge from './signal-badge';
import MarketBriefing from './market-briefing';
import EventStrip from './event-strip';
import OrbitalSilence from './motion/storytelling/OrbitalSilence';
import DotAssemblyReveal from './motion/transitions/DotAssemblyReveal';
import { useData } from './data-provider';

export default function Dashboard() {
  const { data, error, loading, lastUpdated, fetchData } = useData();
  const [phase, setPhase] = useState<'loading' | 'exiting' | 'ready'>('loading');

  useEffect(() => {
    if (loading) return;

    if (!data) {
      setPhase('ready');
      return;
    }

    if (phase === 'loading') {
      setPhase('exiting');
    }
  }, [loading, data, phase]);

  useEffect(() => {
    if (loading && phase === 'ready') setPhase('loading');
  }, [loading, phase]);

  useEffect(() => {
    if (phase !== 'exiting') return;

    const timer = window.setTimeout(() => setPhase('ready'), 400);
    return () => window.clearTimeout(timer);
  }, [phase]);

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
      <DotAssemblyReveal delay={0} duration={500} density="low">
        <div className="flex items-center justify-between">
          <p className="text-xs text-dot-muted font-mono">마지막 업데이트: {lastUpdated}</p>
          <button
            onClick={fetchData}
            className="text-xs text-dot-muted hover:text-dot-accent transition font-mono"
          >
            [ 새로고침 ]
          </button>
        </div>
      </DotAssemblyReveal>

      {/* 시장 온도 */}
      <DotAssemblyReveal delay={70} duration={700}>
        <SignalBadge signal={data.signal} upbitPrice={data.kimp.upbitPrice} />
      </DotAssemblyReveal>

      {/* 시장 브리핑 — 인사이트 해석 레이어 */}
      <DotAssemblyReveal delay={190} duration={720}>
        <MarketBriefing data={data} />
      </DotAssemblyReveal>

      {/* 매크로 이벤트 캘린더 */}
      <DotAssemblyReveal delay={320} duration={740}>
        <EventStrip />
      </DotAssemblyReveal>

      {/* 지표 상세 페이지 링크 */}
      <DotAssemblyReveal delay={460} duration={600} density="low">
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
      </DotAssemblyReveal>
    </div>
  );
}
