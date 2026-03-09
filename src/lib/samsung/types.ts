export type VoteSide = 'bull' | 'bear'

export type SampleState = 'empty' | 'low' | 'sufficient'

export type BadgeType =
  | 'overwhelming_bull'
  | 'overwhelming_bear'
  | 'tight_battle'
  | 'flip'
  | 'surge'
  | null

export interface VoteResult {
  readonly success: boolean
  readonly side: VoteSide
  readonly changed: boolean
  readonly bullRatio: number
  readonly totalCount: number
  readonly bullCount: number
  readonly bearCount: number
  readonly positionLabel: string
  readonly badge: BadgeType
  readonly badgeLabel: string | null
  readonly participantLabel: string
  readonly sampleState: SampleState
}

export interface SentimentData {
  readonly stockSlug: string
  readonly marketDate: string
  readonly bullCount: number
  readonly bearCount: number
  readonly totalCount: number
  readonly bullRatio: number
  readonly bearRatio: number
  readonly deltaYesterday: number | null
  readonly delta1h: number | null
  readonly isFlip: boolean
  readonly badge: BadgeType
  readonly badgeLabel: string | null
  readonly sampleState: SampleState
  readonly participantLabel: string
  readonly mySide: VoteSide | null
  readonly positionLabel: string | null
}

export interface SnapshotEntry {
  readonly id: string
  readonly stockSlug: string
  readonly bucketAt: string
  readonly bullCount: number
  readonly bearCount: number
  readonly totalCount: number
  readonly bullRatio: number
  readonly delta1h: number | null
  readonly isFlip: boolean
  readonly createdAt: string
}

export interface BriefingItem {
  readonly id: string
  readonly slot: number
  readonly title: string
  readonly summary: string
  readonly tone: 'bull' | 'bear' | 'neutral'
}

export interface BriefingData {
  readonly stockSlug: string
  readonly marketDate: string
  readonly bullIssues: readonly BriefingItem[]
  readonly bearIssues: readonly BriefingItem[]
  readonly neutralIssues: readonly BriefingItem[]
}

export interface DailyAggregate {
  readonly stockSlug: string
  readonly marketDate: string
  readonly bullCount: number
  readonly bearCount: number
  readonly totalCount: number
  readonly bullRatio: number
  readonly updatedAt: string
}
