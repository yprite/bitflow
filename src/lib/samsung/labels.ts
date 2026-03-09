import type { BadgeType, VoteSide } from './types'

const MAJORITY_THRESHOLD = 0.60
const MINORITY_THRESHOLD = 0.40

export function getParticipantLabel(totalCount: number): string {
  if (totalCount === 0) {
    return '아직 전장이 열리지 않았습니다'
  }
  return `${totalCount}명이 싸우는 중`
}

export function getPositionLabel(mySide: VoteSide, bullRatio: number): string {
  const myRatio = mySide === 'bull' ? bullRatio : 1 - bullRatio

  if (myRatio >= MAJORITY_THRESHOLD) {
    return '다수에 합류했습니다'
  }
  if (myRatio <= MINORITY_THRESHOLD) {
    return '역행자입니다 🏴‍☠️'
  }
  return '당신의 한 표가 판세를 바꿨습니다'
}

export function getBadgeLabel(badge: BadgeType): string | null {
  if (badge === null) {
    return null
  }

  const labels: Record<NonNullable<BadgeType>, string> = {
    overwhelming_bull: '압도적 강세 🐂',
    overwhelming_bear: '압도적 약세 🐻',
    tight_battle: '팽팽한 접전 ⚔️',
    flip: '반전 발생 🔄',
    surge: '급변 감지 ⚡',
  }

  return labels[badge]
}
