import { describe, it, expect, vi } from 'vitest'
import { getMarketDate, getMarketDateObj, formatMarketDate } from '@/lib/samsung/market-day'

describe('market-day 유틸리티', () => {
  describe('getMarketDate', () => {
    it('YYYY-MM-DD 형식의 문자열을 반환한다', () => {
      const result = getMarketDate()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('Asia/Seoul 시간대 기준으로 날짜를 반환한다', () => {
      // 고정된 시각: UTC 2024-01-15 14:00 = KST 2024-01-15 23:00
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T14:00:00Z'))

      const result = getMarketDate()
      expect(result).toBe('2024-01-15')

      vi.useRealTimers()
    })

    it('자정 전후로 KST 날짜가 올바르게 바뀐다', () => {
      vi.useFakeTimers()

      // UTC 2024-01-15 14:59 = KST 2024-01-15 23:59 → 아직 15일
      vi.setSystemTime(new Date('2024-01-15T14:59:00Z'))
      expect(getMarketDate()).toBe('2024-01-15')

      // UTC 2024-01-15 15:00 = KST 2024-01-16 00:00 → 16일로 바뀜
      vi.setSystemTime(new Date('2024-01-15T15:00:00Z'))
      expect(getMarketDate()).toBe('2024-01-16')

      vi.useRealTimers()
    })
  })

  describe('getMarketDateObj', () => {
    it('Date 객체를 반환한다', () => {
      const result = getMarketDateObj()
      expect(result).toBeInstanceOf(Date)
    })

    it('KST 자정 기준 Date 객체를 반환한다', () => {
      vi.useFakeTimers()
      // UTC 2024-03-20T10:00:00Z = KST 2024-03-20 19:00
      // getMarketDate() → '2024-03-20'
      // getMarketDateObj() → new Date('2024-03-20T00:00:00+09:00') = UTC 2024-03-19T15:00:00Z
      vi.setSystemTime(new Date('2024-03-20T10:00:00Z'))

      const result = getMarketDateObj()
      expect(result.toISOString()).toBe('2024-03-19T15:00:00.000Z')

      vi.useRealTimers()
    })
  })

  describe('formatMarketDate', () => {
    it('주어진 Date 객체를 YYYY-MM-DD 형식으로 변환한다', () => {
      const date = new Date('2024-06-15T10:00:00+09:00')
      const result = formatMarketDate(date)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('Asia/Seoul 시간대로 날짜를 포맷한다', () => {
      // UTC 2024-06-15 14:30 = KST 2024-06-15 23:30
      const date = new Date('2024-06-15T14:30:00Z')
      const result = formatMarketDate(date)
      expect(result).toBe('2024-06-15')
    })

    it('UTC와 KST 날짜가 다른 경우 KST 기준으로 반환한다', () => {
      // UTC 2024-06-15 15:30 = KST 2024-06-16 00:30
      const date = new Date('2024-06-15T15:30:00Z')
      const result = formatMarketDate(date)
      expect(result).toBe('2024-06-16')
    })
  })
})
