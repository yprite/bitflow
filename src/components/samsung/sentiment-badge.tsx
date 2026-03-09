'use client';

import type { BadgeType, SampleState } from '@/lib/samsung/types';

interface SentimentBadgeProps {
  readonly badge: BadgeType;
  readonly sampleState: SampleState;
}

interface BadgeConfig {
  readonly label: string;
  readonly className: string;
}

const BADGE_CONFIGS: Record<string, BadgeConfig> = {
  overwhelming_bull: {
    label: '🔥 압도적 황소',
    className:
      'bg-orange-500/20 text-orange-300 border-orange-500/40 animate-pulse-glow-orange',
  },
  overwhelming_bear: {
    label: '🔥 압도적 곰',
    className:
      'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse-glow-red',
  },
  tight_battle: {
    label: '⚔️ 팽팽한 대치',
    className:
      'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse-glow-purple',
  },
  flip: {
    label: '🔄 반전!',
    className:
      'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 animate-pulse-glow-yellow',
  },
  surge: {
    label: '⚡ 급변 중',
    className:
      'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse-glow-cyan',
  },
};

const LOW_SAMPLE_BADGE: BadgeConfig = {
  label: '📊 전장이 뜨거워지는 중',
  className: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
};

export function SentimentBadge({ badge, sampleState }: SentimentBadgeProps) {
  if (sampleState === 'empty') {
    return null;
  }

  if (sampleState === 'low') {
    return (
      <BadgeDisplay config={LOW_SAMPLE_BADGE} />
    );
  }

  if (!badge) {
    return null;
  }

  const config = BADGE_CONFIGS[badge];
  if (!config) {
    return null;
  }

  return <BadgeDisplay config={config} />;
}

function BadgeDisplay({ config }: { readonly config: BadgeConfig }) {
  return (
    <>
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-glow-orange { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-pulse-glow-red { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-pulse-glow-purple { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-pulse-glow-yellow { animation: pulse-glow 1.5s ease-in-out infinite; }
        .animate-pulse-glow-cyan { animation: pulse-glow 1.5s ease-in-out infinite; }
      `}</style>

      <div
        className={`
          inline-flex items-center px-4 py-2 rounded-full
          border text-sm font-semibold
          ${config.className}
        `}
      >
        {config.label}
      </div>
    </>
  );
}
