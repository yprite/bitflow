'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VoteSide, BriefingData } from '@/lib/samsung/types';
import { useSamsungSentiment } from '@/hooks/use-samsung-sentiment';
import { useSamsungVote } from '@/hooks/use-samsung-vote';
import { HeroSentimentBoard } from './hero-sentiment-board';
import { BullBearVotePanel } from './bull-bear-vote-panel';
import { SentimentChangeCard } from './sentiment-change-card';
import { BattleBriefing } from './battle-briefing';

async function fetchBriefing(): Promise<BriefingData | null> {
  try {
    const response = await fetch('/api/samsung/briefing');
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="text-center space-y-2">
        <div className="h-9 w-40 bg-border rounded-lg mx-auto" />
        <div className="h-5 w-64 bg-border/50 rounded mx-auto" />
      </div>
      <div className="h-14 bg-border rounded-xl" />
      <div className="flex gap-3">
        <div className="flex-1 h-16 bg-border rounded-xl" />
        <div className="flex-1 h-16 bg-border rounded-xl" />
      </div>
      <div className="h-24 bg-border rounded-xl" />
    </div>
  );
}

function ErrorMessage({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry: () => void;
}) {
  return (
    <div className="text-center py-12 space-y-4">
      <p className="text-foreground/60 text-sm">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-card border border-border text-foreground/80 text-sm hover:bg-card-elevated transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}

export function SamsungSentimentPage() {
  const {
    sentiment,
    isLoading,
    error,
    refresh,
  } = useSamsungSentiment();

  const {
    mySide,
    castVote,
    isVoting,
    voteResult,
    positionLabel,
  } = useSamsungVote(
    sentiment?.mySide ?? null,
    sentiment?.positionLabel ?? null,
  );

  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    fetchBriefing().then(setBriefing);
  }, []);

  const handleVote = useCallback(
    async (side: VoteSide) => {
      setIsAnimating(true);
      await castVote(side);
      await refresh();
      setTimeout(() => setIsAnimating(false), 600);
    },
    [castVote, refresh],
  );

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !sentiment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ErrorMessage
          message={error ?? '데이터를 불러올 수 없습니다'}
          onRetry={refresh}
        />
      </div>
    );
  }

  const mergedSentiment = voteResult
    ? {
        ...sentiment,
        bullRatio: voteResult.bullRatio,
        totalCount: voteResult.totalCount,
        participantLabel: voteResult.participantLabel,
        badge: voteResult.badge,
        badgeLabel: voteResult.badgeLabel,
        sampleState: voteResult.sampleState,
        mySide: voteResult.side,
        positionLabel: voteResult.positionLabel,
      }
    : sentiment;

  const effectiveSide = mySide ?? mergedSentiment.mySide;
  const effectivePositionLabel =
    positionLabel ?? mergedSentiment.positionLabel;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <HeroSentimentBoard
        sentiment={mergedSentiment}
        isAnimating={isAnimating}
      />

      <BullBearVotePanel
        onVote={handleVote}
        mySide={effectiveSide}
        isVoting={isVoting}
        positionLabel={effectivePositionLabel}
        canChange={true}
      />

      <SentimentChangeCard
        deltaVsPrevClose={mergedSentiment.deltaYesterday}
        delta1h={mergedSentiment.delta1h}
        isFlip={mergedSentiment.isFlip}
      />

      {briefing && (
        <BattleBriefing
          bullIssues={briefing.bullIssues}
          bearIssues={briefing.bearIssues}
        />
      )}
    </div>
  );
}
