'use client';

import type { SentimentData } from '@/lib/samsung/types';
import { TugOfWarBar } from './tug-of-war-bar';
import { SentimentBadge } from './sentiment-badge';
import { ColdStartPrompt } from './cold-start-prompt';

interface HeroSentimentBoardProps {
  readonly sentiment: SentimentData;
  readonly isAnimating?: boolean;
}

export function HeroSentimentBoard({
  sentiment,
  isAnimating = false,
}: HeroSentimentBoardProps) {
  const isColdStart = sentiment.sampleState === 'empty';

  return (
    <section className="w-full space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          삼성전자
        </h1>
        <p className="text-foreground/60 text-base md:text-lg">
          지금 시장은 Bull인가 Bear인가
        </p>
      </div>

      {isColdStart ? (
        <ColdStartPrompt totalCount={sentiment.totalCount} />
      ) : (
        <SentimentContent
          sentiment={sentiment}
          isAnimating={isAnimating}
        />
      )}
    </section>
  );
}

function SentimentContent({
  sentiment,
  isAnimating,
}: {
  readonly sentiment: SentimentData;
  readonly isAnimating: boolean;
}) {
  return (
    <div className="space-y-4">
      <TugOfWarBar
        bullRatio={sentiment.bullRatio}
        totalCount={sentiment.totalCount}
        isAnimating={isAnimating}
        badge={sentiment.badge}
      />

      <div className="flex flex-col items-center gap-3">
        <SentimentBadge
          badge={sentiment.badge}
          sampleState={sentiment.sampleState}
        />

        <p className="text-lg md:text-xl font-semibold text-foreground/80">
          <span className="text-[#22D3EE]">
            {sentiment.participantLabel}
          </span>
        </p>
      </div>
    </div>
  );
}
