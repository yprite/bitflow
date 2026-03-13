'use client';

import KimpCard from './kimp-card';
import FundingRateCard from './funding-rate-card';
import FearGreedCard from './fear-greed-card';
import SignalBadge from './signal-badge';
import OrbitalSilence from './motion/storytelling/OrbitalSilence';
import { useData } from './data-provider';

function NavCard({ href, title, description, items }: {
  href: string;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <a href={href} className="dot-card p-4 sm:p-5 group cursor-pointer block hover:border-dot-accent transition-colors">
      <div className="dot-card-inner">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-dot-sub uppercase tracking-wider group-hover:text-dot-accent transition-colors">
            {title}
          </h3>
          <span className="text-dot-muted group-hover:text-dot-accent transition-colors text-sm font-mono">→</span>
        </div>
        <p className="text-[11px] text-dot-muted mb-3">{description}</p>
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span key={item} className="text-[10px] text-dot-sub bg-dot-border/20 px-2 py-0.5 font-mono">
              {item}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}

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
    <div className="space-y-3 sm:space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-dot-muted font-mono">마지막 업데이트: {lastUpdated}</p>
        <button
          onClick={fetchData}
          className="text-xs text-dot-muted hover:text-dot-accent transition font-mono"
        >
          [ 새로고침 ]
        </button>
      </div>

      <KimpCard kimp={data.kimp} avg30d={data.avg30d} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <FundingRateCard data={data.fundingRate} />
        <FearGreedCard data={data.fearGreed} />
        <SignalBadge signal={data.signal} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <NavCard
          href="/indicators"
          title="지표"
          description="김프 추이 차트를 확인합니다"
          items={['김프 차트']}
        />
        <NavCard
          href="/tools"
          title="도구"
          description="멀티코인 비교와 재정거래 시뮬레이션"
          items={['히트맵', '재정거래 계산기']}
        />
      </div>
    </div>
  );
}
