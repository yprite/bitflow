import type { BadgeType, SampleState } from './types'

const OVERWHELMING_THRESHOLD = 0.80
const TIGHT_BATTLE_LOW = 0.48
const TIGHT_BATTLE_HIGH = 0.52
const SURGE_DELTA_THRESHOLD = 0.08
const MIN_VOTES_OVERWHELMING = 20
const MIN_VOTES_TIGHT = 20
const MIN_VOTES_FLIP = 30
const MIN_VOTES_SURGE = 10
const SAMPLE_EMPTY_MAX = 9
const SAMPLE_LOW_MAX = 19

export function calculateBadge(
  bullRatio: number,
  totalCount: number,
  delta1h: number | null,
  isFlip: boolean
): BadgeType {
  if (isFlip && totalCount >= MIN_VOTES_FLIP) {
    return 'flip'
  }

  if (delta1h !== null && Math.abs(delta1h) >= SURGE_DELTA_THRESHOLD && totalCount >= MIN_VOTES_SURGE) {
    return 'surge'
  }

  if (totalCount >= MIN_VOTES_OVERWHELMING) {
    if (bullRatio >= OVERWHELMING_THRESHOLD) {
      return 'overwhelming_bull'
    }
    if (bullRatio <= 1 - OVERWHELMING_THRESHOLD) {
      return 'overwhelming_bear'
    }
  }

  if (
    totalCount >= MIN_VOTES_TIGHT &&
    bullRatio >= TIGHT_BATTLE_LOW &&
    bullRatio <= TIGHT_BATTLE_HIGH
  ) {
    return 'tight_battle'
  }

  return null
}

export function calculateSampleState(totalCount: number): SampleState {
  if (totalCount <= SAMPLE_EMPTY_MAX) {
    return 'empty'
  }
  if (totalCount <= SAMPLE_LOW_MAX) {
    return 'low'
  }
  return 'sufficient'
}
