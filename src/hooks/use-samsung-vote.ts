'use client';

import { useState, useCallback } from 'react';
import type { VoteSide, VoteResult } from '@/lib/samsung/types';

type VotingState = 'idle' | 'voting' | 'voted';

interface UseSamsungVoteReturn {
  readonly mySide: VoteSide | null;
  readonly castVote: (side: VoteSide) => Promise<void>;
  readonly changeOpinion: (newSide: VoteSide) => Promise<void>;
  readonly isVoting: boolean;
  readonly votingState: VotingState;
  readonly voteResult: VoteResult | null;
  readonly positionLabel: string | null;
}

async function postVote(side: VoteSide): Promise<VoteResult> {
  const response = await fetch('/api/samsung/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ side }),
  });

  if (!response.ok) {
    throw new Error(`Vote failed: ${response.status}`);
  }

  return response.json();
}

export function useSamsungVote(
  initialSide: VoteSide | null = null,
  initialPositionLabel: string | null = null,
): UseSamsungVoteReturn {
  const [votingState, setVotingState] = useState<VotingState>(
    initialSide ? 'voted' : 'idle',
  );
  const [mySide, setMySide] = useState<VoteSide | null>(initialSide);
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  const [positionLabel, setPositionLabel] = useState<string | null>(
    initialPositionLabel,
  );
  const executeVote = useCallback(async (side: VoteSide) => {
    const previousSide = mySide;

    setMySide(side);
    setVotingState('voting');

    try {
      const result = await postVote(side);
      setVoteResult(result);
      setPositionLabel(result.positionLabel);
      setVotingState('voted');
    } catch {
      setMySide(previousSide);
      setVotingState(previousSide ? 'voted' : 'idle');
    }
  }, [mySide]);

  const castVote = useCallback(
    (side: VoteSide) => executeVote(side),
    [executeVote],
  );

  const changeOpinion = useCallback(
    (newSide: VoteSide) => executeVote(newSide),
    [executeVote],
  );

  return {
    mySide,
    castVote,
    changeOpinion,
    isVoting: votingState === 'voting',
    votingState,
    voteResult,
    positionLabel,
  };
}
