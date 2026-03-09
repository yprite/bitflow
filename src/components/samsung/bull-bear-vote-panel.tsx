'use client';

import type { VoteSide } from '@/lib/samsung/types';

interface BullBearVotePanelProps {
  readonly onVote: (side: VoteSide) => void;
  readonly mySide?: VoteSide | null;
  readonly isVoting: boolean;
  readonly positionLabel?: string | null;
  readonly canChange: boolean;
}

interface VoteButtonProps {
  readonly side: VoteSide;
  readonly label: string;
  readonly emoji: string;
  readonly color: string;
  readonly hoverGlow: string;
  readonly isSelected: boolean;
  readonly isDisabled: boolean;
  readonly onClick: () => void;
}

const POSITION_STYLES: Record<string, string> = {
  rebel: 'text-purple-400',
  majority: 'text-blue-300',
  flipper: 'text-yellow-400 font-semibold',
  default: 'text-foreground/70',
};

function getPositionStyle(label: string | null | undefined): string {
  if (!label) return POSITION_STYLES.default;
  if (label.includes('역행자')) return POSITION_STYLES.rebel;
  if (label.includes('바꿨')) return POSITION_STYLES.flipper;
  if (label.includes('합류')) return POSITION_STYLES.majority;
  return POSITION_STYLES.default;
}

function VoteButton({
  label,
  emoji,
  color,
  hoverGlow,
  isSelected,
  isDisabled,
  onClick,
}: VoteButtonProps) {
  const baseClasses = `
    flex-1 min-h-[64px] md:min-h-[72px] rounded-xl
    font-bold text-lg md:text-xl
    transition-all duration-150 ease-out
    select-none cursor-pointer
    border-2 relative overflow-hidden
  `;

  const selectedClasses = isSelected
    ? `${color} text-white border-transparent shadow-lg`
    : `bg-transparent text-foreground/80 border-border-light
       hover:scale-[1.02] ${hoverGlow}`;

  const disabledClasses = isDisabled
    ? 'opacity-60 pointer-events-none'
    : 'active:scale-[0.98]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${selectedClasses} ${disabledClasses}`}
    >
      <span className="relative z-10">
        {emoji} {label}
      </span>
    </button>
  );
}

export function BullBearVotePanel({
  onVote,
  mySide,
  isVoting,
  positionLabel,
  canChange,
}: BullBearVotePanelProps) {
  const hasVoted = mySide !== null && mySide !== undefined;

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-3">
        <VoteButton
          side="bull"
          label="황소다"
          emoji="🐂"
          color="bg-[#3B82F6]"
          hoverGlow="hover:shadow-[0_0_16px_rgba(59,130,246,0.3)]"
          isSelected={mySide === 'bull'}
          isDisabled={isVoting || (hasVoted && !canChange)}
          onClick={() => onVote('bull')}
        />
        <VoteButton
          side="bear"
          label="곰이다"
          emoji="🐻"
          color="bg-[#EF4444]"
          hoverGlow="hover:shadow-[0_0_16px_rgba(239,68,68,0.3)]"
          isSelected={mySide === 'bear'}
          isDisabled={isVoting || (hasVoted && !canChange)}
          onClick={() => onVote('bear')}
        />
      </div>

      {hasVoted && (
        <div className="space-y-2 text-center">
          {positionLabel && (
            <p className={`text-base ${getPositionStyle(positionLabel)}`}>
              {positionLabel}
            </p>
          )}
          {canChange && (
            <p className="text-xs text-foreground/40">
              마음이 바뀌면 다시 투표할 수 있습니다
            </p>
          )}
        </div>
      )}

      {isVoting && (
        <p className="text-center text-sm text-foreground/50 animate-pulse">
          투표 중...
        </p>
      )}
    </div>
  );
}
