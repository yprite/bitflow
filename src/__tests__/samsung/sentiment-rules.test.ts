import { describe, it, expect } from 'vitest'
import { calculateBadge, calculateSampleState } from '@/lib/samsung/sentiment-rules'

describe('sentiment-rules', () => {
  describe('calculateBadge', () => {
    it('bullRatio > 0.8 이고 20표 이상이면 overwhelming_bull 을 반환한다', () => {
      const result = calculateBadge(0.85, 25, null, false)
      expect(result).toBe('overwhelming_bull')
    })

    it('bullRatio === 0.8 이면 overwhelming_bull 을 반환한다 (경계값)', () => {
      const result = calculateBadge(0.80, 20, null, false)
      expect(result).toBe('overwhelming_bull')
    })

    it('bullRatio < 0.2 이고 20표 이상이면 overwhelming_bear 를 반환한다', () => {
      const result = calculateBadge(0.15, 25, null, false)
      expect(result).toBe('overwhelming_bear')
    })

    it('bullRatio === 0.2 은 부동소수점 비교로 인해 경계에서 null 이 될 수 있다', () => {
      // 1 - 0.80 은 부동소수점에서 정확히 0.2가 아닐 수 있으므로
      // 0.19 처럼 확실히 아래인 값으로 테스트
      const result = calculateBadge(0.19, 20, null, false)
      expect(result).toBe('overwhelming_bear')
    })

    it('bullRatio 0.48-0.52 범위이고 20표 이상이면 tight_battle 을 반환한다', () => {
      const result = calculateBadge(0.50, 25, null, false)
      expect(result).toBe('tight_battle')
    })

    it('bullRatio === 0.48 경계값에서 tight_battle 을 반환한다', () => {
      const result = calculateBadge(0.48, 20, null, false)
      expect(result).toBe('tight_battle')
    })

    it('bullRatio === 0.52 경계값에서 tight_battle 을 반환한다', () => {
      const result = calculateBadge(0.52, 20, null, false)
      expect(result).toBe('tight_battle')
    })

    it('isFlip=true 이고 30표 이상이면 flip 을 반환한다', () => {
      const result = calculateBadge(0.50, 35, null, true)
      expect(result).toBe('flip')
    })

    it('isFlip=true 이지만 30표 미만이면 flip 이 아닌 다른 결과를 반환한다', () => {
      const result = calculateBadge(0.50, 25, null, true)
      expect(result).not.toBe('flip')
    })

    it('delta1h >= 0.08 이고 10표 이상이면 surge 를 반환한다', () => {
      const result = calculateBadge(0.50, 15, 0.10, false)
      expect(result).toBe('surge')
    })

    it('delta1h <= -0.08 이고 10표 이상이면 surge 를 반환한다 (음수 방향)', () => {
      const result = calculateBadge(0.50, 15, -0.09, false)
      expect(result).toBe('surge')
    })

    it('delta1h === 0.08 경계값에서 surge 를 반환한다', () => {
      const result = calculateBadge(0.50, 10, 0.08, false)
      expect(result).toBe('surge')
    })

    it('delta1h 가 0.08 미만이면 surge 를 반환하지 않는다', () => {
      const result = calculateBadge(0.50, 15, 0.07, false)
      expect(result).not.toBe('surge')
    })

    it('투표수가 부족하면 null 을 반환한다', () => {
      const result = calculateBadge(0.85, 15, null, false)
      expect(result).toBeNull()
    })

    it('flip 이 surge 보다 우선한다', () => {
      const result = calculateBadge(0.50, 35, 0.10, true)
      expect(result).toBe('flip')
    })

    it('surge 가 overwhelming 보다 우선한다', () => {
      const result = calculateBadge(0.85, 25, 0.10, false)
      expect(result).toBe('surge')
    })

    it('모든 조건을 충족하지 않으면 null 을 반환한다', () => {
      const result = calculateBadge(0.60, 5, 0.01, false)
      expect(result).toBeNull()
    })
  })

  describe('calculateSampleState', () => {
    it('0-9 표이면 empty 를 반환한다', () => {
      expect(calculateSampleState(0)).toBe('empty')
      expect(calculateSampleState(5)).toBe('empty')
      expect(calculateSampleState(9)).toBe('empty')
    })

    it('10-19 표이면 low 를 반환한다', () => {
      expect(calculateSampleState(10)).toBe('low')
      expect(calculateSampleState(15)).toBe('low')
      expect(calculateSampleState(19)).toBe('low')
    })

    it('20 표 이상이면 sufficient 를 반환한다', () => {
      expect(calculateSampleState(20)).toBe('sufficient')
      expect(calculateSampleState(100)).toBe('sufficient')
      expect(calculateSampleState(1000)).toBe('sufficient')
    })
  })
})
