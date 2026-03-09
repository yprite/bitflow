import { describe, it, expect, vi, beforeEach } from 'vitest'
import { castVote, getAggregates } from '@/lib/samsung/vote-service'

// Supabase 모킹용 체이너블 빌더
function createChainableMock(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const handler = () =>
    new Proxy(
      {},
      {
        get(_target, prop: string) {
          if (prop === 'then') {
            return (resolve: (v: unknown) => void) => resolve(resolvedValue)
          }
          if (!chain[prop]) {
            chain[prop] = vi.fn().mockReturnValue(handler())
          }
          return chain[prop]
        },
      }
    )
  return handler()
}

const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
}

vi.mock('@/lib/supabase', () => ({
  createServiceClient: () => mockSupabase,
}))

function setupMultiTableMock(
  tables: Record<string, { data: unknown; error: unknown }>
) {
  mockSupabase.from.mockImplementation((tableName: string) => {
    const resolvedValue = tables[tableName] ?? { data: null, error: null }
    return createChainableMock(resolvedValue)
  })
}

describe('vote-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('castVote - 신규 투표', () => {
    it('기존 투표가 없으면 새 투표를 생성하고 결과를 반환한다', async () => {
      const callSequence: string[] = []

      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      mockSupabase.from.mockImplementation((tableName: string) => {
        callSequence.push(tableName)

        if (tableName === 'votes') {
          // 첫 번째 votes 호출: findExistingVote → 없음
          // 두 번째 votes 호출: insertVote
          if (callSequence.filter((t) => t === 'votes').length === 1) {
            return createChainableMock({ data: null, error: { code: 'PGRST116' } })
          }
          return createChainableMock({ data: null, error: null })
        }

        if (tableName === 'vote_daily_aggregates') {
          // buildVoteResult의 getAggregates
          return createChainableMock({
            data: {
              stock_slug: 'samsung',
              market_date: '2024-01-15',
              bull_count: 1,
              bear_count: 0,
              total_count: 1,
              bull_ratio: 1.0,
            },
            error: null,
          })
        }

        return createChainableMock({ data: null, error: null })
      })

      const result = await castVote('session-1', 'samsung', 'bull', '2024-01-15')

      expect(result.success).toBe(true)
      expect(result.side).toBe('bull')
      expect(result.changed).toBe(true)
    })
  })

  describe('castVote - 동일 투표 반복', () => {
    it('같은 사이드로 재투표하면 changed=false 를 반환한다', async () => {
      const callSequence: string[] = []

      mockSupabase.from.mockImplementation((tableName: string) => {
        callSequence.push(tableName)

        if (tableName === 'votes') {
          // findExistingVote → 이미 같은 사이드 투표 존재
          return createChainableMock({
            data: { id: 'vote-1', side: 'bull' },
            error: null,
          })
        }

        if (tableName === 'vote_daily_aggregates') {
          // buildVoteResult의 getAggregates
          return createChainableMock({
            data: {
              stock_slug: 'samsung',
              market_date: '2024-01-15',
              bull_count: 10,
              bear_count: 5,
              total_count: 15,
              bull_ratio: 0.667,
            },
            error: null,
          })
        }

        return createChainableMock({ data: null, error: null })
      })

      const result = await castVote('session-1', 'samsung', 'bull', '2024-01-15')

      expect(result.success).toBe(true)
      expect(result.side).toBe('bull')
      expect(result.changed).toBe(false)
    })
  })

  describe('castVote - 의견 변경 (UPSERT)', () => {
    it('다른 사이드로 투표하면 기존 투표를 업데이트하고 changed=true 를 반환한다', async () => {
      const callSequence: string[] = []

      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      mockSupabase.from.mockImplementation((tableName: string) => {
        callSequence.push(tableName)

        if (tableName === 'votes') {
          const votesCount = callSequence.filter((t) => t === 'votes').length
          if (votesCount === 1) {
            // findExistingVote → 기존에 bear로 투표함
            return createChainableMock({
              data: { id: 'vote-1', side: 'bear' },
              error: null,
            })
          }
          // updateVote
          return createChainableMock({ data: null, error: null })
        }

        if (tableName === 'vote_daily_aggregates') {
          // buildVoteResult → getAggregates (업데이트 후)
          return createChainableMock({
            data: {
              stock_slug: 'samsung',
              market_date: '2024-01-15',
              bull_count: 6,
              bear_count: 9,
              total_count: 15,
              bull_ratio: 0.4,
            },
            error: null,
          })
        }

        return createChainableMock({ data: null, error: null })
      })

      const result = await castVote('session-1', 'samsung', 'bull', '2024-01-15')

      expect(result.success).toBe(true)
      expect(result.side).toBe('bull')
      expect(result.changed).toBe(true)
    })
  })

  describe('getAggregates', () => {
    it('집계 데이터가 있으면 반환한다', async () => {
      const expectedData = {
        stock_slug: 'samsung',
        market_date: '2024-01-15',
        bull_count: 30,
        bear_count: 20,
        total_count: 50,
        bull_ratio: 0.6,
      }

      setupMultiTableMock({
        vote_daily_aggregates: { data: expectedData, error: null },
      })

      const result = await getAggregates('samsung', '2024-01-15')

      expect(result).toEqual(expectedData)
    })

    it('집계 데이터가 없으면 null 을 반환한다', async () => {
      setupMultiTableMock({
        vote_daily_aggregates: { data: null, error: { code: 'PGRST116' } },
      })

      const result = await getAggregates('samsung', '2024-01-15')

      expect(result).toBeNull()
    })
  })
})
