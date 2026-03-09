import { describe, it, expect } from 'vitest'
import { getParticipantLabel, getPositionLabel, getBadgeLabel } from '@/lib/samsung/labels'

describe('labels', () => {
  describe('getParticipantLabel', () => {
    it('참여자가 0명이면 전장이 열리지 않았다는 메시지를 반환한다', () => {
      const result = getParticipantLabel(0)
      expect(result).toBe('아직 전장이 열리지 않았습니다')
    })

    it('참여자가 있으면 "N명이 싸우는 중" 형식을 반환한다', () => {
      const result = getParticipantLabel(347)
      expect(result).toBe('347명이 싸우는 중')
    })

    it('참여자가 1명이면 "1명이 싸우는 중" 을 반환한다', () => {
      const result = getParticipantLabel(1)
      expect(result).toBe('1명이 싸우는 중')
    })
  })

  describe('getPositionLabel', () => {
    it('다수 편에 합류한 경우 (bullRatio >= 0.60) bull 사이드에서 적절한 라벨을 반환한다', () => {
      const result = getPositionLabel('bull', 0.70)
      expect(result).toBe('다수에 합류했습니다')
    })

    it('다수 편에 합류한 경우 bear 사이드에서 적절한 라벨을 반환한다', () => {
      // bear 입장에서 myRatio = 1 - 0.30 = 0.70 >= 0.60
      const result = getPositionLabel('bear', 0.30)
      expect(result).toBe('다수에 합류했습니다')
    })

    it('소수 편에 속한 경우 역행자 라벨을 반환한다', () => {
      // bull 입장에서 myRatio = 0.30 <= 0.40
      const result = getPositionLabel('bull', 0.30)
      expect(result).toBe('역행자입니다 🏴‍☠️')
    })

    it('bear 사이드에서 소수파인 경우 역행자 라벨을 반환한다', () => {
      // bear 입장에서 myRatio = 1 - 0.70 = 0.30 <= 0.40
      const result = getPositionLabel('bear', 0.70)
      expect(result).toBe('역행자입니다 🏴‍☠️')
    })

    it('접전 상황이면 판세를 바꿨다는 라벨을 반환한다', () => {
      // bull 입장에서 myRatio = 0.50, 0.40 < 0.50 < 0.60
      const result = getPositionLabel('bull', 0.50)
      expect(result).toBe('당신의 한 표가 판세를 바꿨습니다')
    })

    it('경계값 0.60 에서 다수 라벨을 반환한다', () => {
      const result = getPositionLabel('bull', 0.60)
      expect(result).toBe('다수에 합류했습니다')
    })

    it('경계값 0.40 에서 역행자 라벨을 반환한다', () => {
      const result = getPositionLabel('bull', 0.40)
      expect(result).toBe('역행자입니다 🏴‍☠️')
    })
  })

  describe('getBadgeLabel', () => {
    it('overwhelming_bull 배지에 올바른 라벨을 반환한다', () => {
      expect(getBadgeLabel('overwhelming_bull')).toBe('압도적 강세 🐂')
    })

    it('overwhelming_bear 배지에 올바른 라벨을 반환한다', () => {
      expect(getBadgeLabel('overwhelming_bear')).toBe('압도적 약세 🐻')
    })

    it('tight_battle 배지에 올바른 라벨을 반환한다', () => {
      expect(getBadgeLabel('tight_battle')).toBe('팽팽한 접전 ⚔️')
    })

    it('flip 배지에 올바른 라벨을 반환한다', () => {
      expect(getBadgeLabel('flip')).toBe('반전 발생 🔄')
    })

    it('surge 배지에 올바른 라벨을 반환한다', () => {
      expect(getBadgeLabel('surge')).toBe('급변 감지 ⚡')
    })

    it('null 배지에 null 을 반환한다', () => {
      expect(getBadgeLabel(null)).toBeNull()
    })
  })
})
