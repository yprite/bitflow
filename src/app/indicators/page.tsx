'use client';

import KimpChart from '@/components/kimp-chart';
import OrbitalSilence from '@/components/motion/storytelling/OrbitalSilence';
import { useData } from '@/components/data-provider';

export default function IndicatorsPage() {
  const { data, chartData, error, loading, fetchData } = useData();

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
      <div className="flex items-center gap-3">
        <a href="/" className="text-dot-muted hover:text-dot-accent transition text-sm font-mono">← 홈</a>
        <h1 className="text-sm font-semibold text-dot-sub uppercase tracking-wider">지표</h1>
      </div>

      <KimpChart data={chartData} />
    </div>
  );
}
