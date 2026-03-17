import type { DashboardData } from './types';

export interface MarketDriver {
  label: string;
  value: string;
  direction: '과열' | '중립' | '침체';
  impact: 'high' | 'medium' | 'low';
}

export interface MarketScenario {
  name: string;
  description: string;
  severity: 'warning' | 'caution' | 'neutral' | 'opportunity';
}

export interface MarketInsight {
  topDrivers: MarketDriver[];
  keyRisk: { label: string; description: string } | null;
  keyRelief: { label: string; description: string } | null;
  scenario: MarketScenario | null;
  actionGuide: string;
  observationPoints: string[];
}

function deriveImpact(absScore: number): 'high' | 'medium' | 'low' {
  if (absScore >= 1.5) return 'high';
  if (absScore >= 0.8) return 'medium';
  return 'low';
}

function extractTopDrivers(data: DashboardData): MarketDriver[] {
  return [...data.signal.factors]
    .sort((a, b) => Math.abs(b.weightedScore) - Math.abs(a.weightedScore))
    .slice(0, 3)
    .map((f) => ({
      label: f.label,
      value: f.value,
      direction: f.direction,
      impact: deriveImpact(Math.abs(f.weightedScore)),
    }));
}

const riskDescriptions: Record<string, string> = {
  '김프': '김프가 과열 상태 — 한국 프리미엄 급등으로 역프 전환 리스크 주의',
  '펀딩비': '펀딩비가 과열 상태 — 레버리지 과부하 주의',
  'USDT프리미엄': 'USDT 프리미엄이 과열 상태 — 원화 자금 과도 유입 주의',
  '공포탐욕': '탐욕 지수 과열 — 시장 낙관 과잉, 조정 가능성 경계',
  'BTC도미넌스': 'BTC 도미넌스 과열 — 알트코인 약세 지속 가능성',
  '롱비율': '롱 비율 과열 — 롱 포지션 과밀, 청산 연쇄 주의',
  '미결제약정': '미결제약정 과열 — 레버리지 누적으로 급변동 리스크 증가',
  '청산비율': '청산 비율 과열 — 롱 청산 집중, 추가 하락 촉발 가능',
  '스테이블': '스테이블코인 유입 과열 — 단기 과열 후 조정 주의',
  '거래량': '거래량 급증 과열 — 과매수 구간, 단기 되돌림 주의',
  '마이크로스트레티지': 'MSTR 보유 증가와 STRC 자본엔진 가속이 동시에 포착됨 — 기관 수요 과열 여부 점검',
};

const reliefDescriptions: Record<string, string> = {
  '김프': '김프 침체 — 역프 구간으로 해외 대비 할인 매수 기회',
  '펀딩비': '펀딩비 침체 — 숏 과밀로 반등 가능성 존재',
  'USDT프리미엄': 'USDT 프리미엄 침체 — 자금 이탈 우려, 바닥 확인 필요',
  '공포탐욕': '공포 지수 극단적 — 역발상 매수 기회 탐색 가능',
  'BTC도미넌스': 'BTC 도미넌스 하락 — 알트코인 순환매 가능성',
  '롱비율': '롱 비율 침체 — 숏 과밀, 숏스퀴즈 반등 가능성',
  '미결제약정': '미결제약정 감소 — 레버리지 해소, 변동성 축소 기대',
  '청산비율': '청산 비율 안정 — 시장 스트레스 완화 신호',
  '스테이블': '스테이블코인 감소 — 자금 이탈 중, 추가 하락 주의',
  '거래량': '거래량 급감 — 관망세 진입, 방향성 돌파 대기',
  '마이크로스트레티지': 'MSTR 보유 변화가 멈추고 STRC 엔진도 둔화 — 기관 매수 모멘텀 약화 구간 확인',
};

function extractKeyRisk(data: DashboardData): MarketInsight['keyRisk'] {
  const overheated = data.signal.factors
    .filter((f) => f.direction === '과열' && f.weightedScore > 0)
    .sort((a, b) => b.weightedScore - a.weightedScore);

  if (overheated.length === 0) return null;

  const top = overheated[0];
  const description =
    riskDescriptions[top.label] ??
    `${top.label}이(가) 과열 상태 — 관련 리스크 주의`;

  return { label: top.label, description };
}

function extractKeyRelief(data: DashboardData): MarketInsight['keyRelief'] {
  const cooled = data.signal.factors
    .filter((f) => f.direction === '침체' && f.weightedScore < 0)
    .sort((a, b) => a.weightedScore - b.weightedScore);

  if (cooled.length === 0) return null;

  const top = cooled[0];
  const description =
    reliefDescriptions[top.label] ??
    `${top.label}이(가) 침체 상태 — 안도 요인으로 작용 가능`;

  return { label: top.label, description };
}

function detectScenario(data: DashboardData): MarketScenario | null {
  const {
    kimp,
    fundingRate,
    usdtPremium,
    openInterest,
    longShortRatio,
    liquidation,
    strategyBtc,
    strategyCapital,
    btcDominance,
    stablecoinMcap,
    fearGreed,
  } = data;

  if (kimp.kimchiPremium > 3 && usdtPremium.premium > 0.5) {
    return {
      name: '한국 매수세 과열',
      description:
        '김프 상승 + USDT 프리미엄 상승 — 한국 시장 자금 유입 과열 신호',
      severity: 'warning',
    };
  }

  if (kimp.kimchiPremium < -1 && fundingRate.fundingRate < 0) {
    return {
      name: '역프 + 펀딩비 음전',
      description:
        '역프리미엄 + 펀딩비 음전 — 과매도 구간, 반등 기회 포착 가능',
      severity: 'opportunity',
    };
  }

  if (
    fundingRate.fundingRate * 100 > 0.05 &&
    openInterest.changeRate > 10 &&
    longShortRatio.longShortRatio > 1.5
  ) {
    return {
      name: '레버리지 과열',
      description:
        '높은 펀딩비 + OI 급증 + 롱 편중 — 레버리지 청산 연쇄 리스크',
      severity: 'warning',
    };
  }

  if (
    fundingRate.fundingRate < 0 &&
    longShortRatio.longShortRatio < 0.7 &&
    liquidation.ratio < 0.4
  ) {
    return {
      name: '숏스퀴즈 잠재',
      description:
        '펀딩비 음전 + 숏 편중 + 낮은 롱 청산 비율 — 숏스퀴즈 가능성 존재',
      severity: 'caution',
    };
  }

  if (
    (
      strategyBtc.holdingsChange > 0 ||
      strategyCapital.currentWeekEstimatedBtc > 1000 ||
      (strategyCapital.latestConfirmed?.netProceedsUsd ?? 0) > 100_000_000
    ) &&
    btcDominance.dominance > 58
  ) {
    return {
      name: '마이크로스트레티지 가동',
      description:
        'MSTR 보유 증가 또는 STRC 자본조달 활성 + 높은 BTC 도미넌스 — Strategy 매수 모멘텀 확대 신호',
      severity: 'neutral',
    };
  }

  if (stablecoinMcap.change24h < -1 && usdtPremium.premium < -0.5) {
    return {
      name: '자금 이탈',
      description:
        '스테이블코인 시총 감소 + USDT 할인 — 시장 자금 이탈 경고',
      severity: 'warning',
    };
  }

  if (fearGreed.value < 20 && longShortRatio.longShortRatio < 0.8) {
    return {
      name: '극단적 공포 매수 기회',
      description:
        '극단적 공포 지수 + 숏 편중 — 역발상 매수 기회 구간',
      severity: 'opportunity',
    };
  }

  return null;
}

const actionGuideMap: Record<string, string> = {
  '극과열': '시장 극도의 과열 — 신규 매수 자제, 익절 및 리스크 축소 권장',
  '과열': '과열 구간 진입 — 추격 매수 위험, 분할 익절 고려',
  '중립': '방향성 탐색 중 — 핵심 지표 변화 모니터링, 급변 대비',
  '침체': '침체 구간 — 공포 속 기회 탐색, 분할 매수 고려',
  '극침체': '극도의 침체 — 역발상 매수 적기 가능, 바닥 확인 후 진입',
};

function deriveActionGuide(data: DashboardData): string {
  return actionGuideMap[data.signal.level] ?? actionGuideMap['중립'];
}

function buildObservationPoints(data: DashboardData): string[] {
  const candidates: { priority: number; text: string }[] = [];

  const kp = data.kimp.kimchiPremium;
  if (kp >= 2.5 && kp <= 3.5) {
    candidates.push({
      priority: 10,
      text: `김프 ${kp.toFixed(2)}%로 3% 경계선 부근 — 돌파 시 과열 전환, 이탈 시 안정 복귀 주시`,
    });
  } else if (kp >= 4.5 && kp <= 5.5) {
    candidates.push({
      priority: 10,
      text: `김프 ${kp.toFixed(2)}%로 5% 임계선 부근 — 역사적 고점 구간, 역프 전환 경계`,
    });
  }

  const fr = data.fundingRate.fundingRate;
  if (Math.abs(fr * 100) > 0.05) {
    const nextTime = new Date(data.fundingRate.nextFundingTime);
    const timeStr = `${nextTime.getUTCHours().toString().padStart(2, '0')}:${nextTime.getUTCMinutes().toString().padStart(2, '0')} UTC`;
    candidates.push({
      priority: 9,
      text: `펀딩비 ${(fr * 100).toFixed(4)}%로 극단적 수준 — 다음 정산 ${timeStr}, 포지션 비용 점검 필요`,
    });
  }

  const fg = data.fearGreed.value;
  if (fg >= 20 && fg <= 30) {
    candidates.push({
      priority: 8,
      text: `공포탐욕 지수 ${fg}으로 25 경계 부근 — 극단적 공포 진입 여부 주시`,
    });
  } else if (fg >= 70 && fg <= 80) {
    candidates.push({
      priority: 8,
      text: `공포탐욕 지수 ${fg}으로 75 경계 부근 — 극단적 탐욕 진입 여부 주시`,
    });
  }

  const dom = data.btcDominance.dominance;
  if (dom >= 54 && dom <= 56) {
    candidates.push({
      priority: 7,
      text: `BTC 도미넌스 ${dom.toFixed(1)}%로 55% 경계 부근 — 하락 시 알트코인 반등 기대`,
    });
  } else if (dom >= 59 && dom <= 61) {
    candidates.push({
      priority: 7,
      text: `BTC 도미넌스 ${dom.toFixed(1)}%로 60% 경계 부근 — 알트코인 추가 약세 가능성 점검`,
    });
  }

  const oiChange = data.openInterest.changeRate;
  if (oiChange > 15) {
    candidates.push({
      priority: 9,
      text: `미결제약정 24시간 ${oiChange.toFixed(1)}% 급증 — 레버리지 과열, 급변동 대비 필요`,
    });
  } else if (oiChange < -15) {
    candidates.push({
      priority: 9,
      text: `미결제약정 24시간 ${oiChange.toFixed(1)}% 급감 — 대규모 청산 발생, 추가 변동 주의`,
    });
  }

  if (candidates.length === 0) {
    return [
      '주요 지표 임계 구간 없음 — 안정적 흐름 유지 중',
      '김프, 펀딩비, 공포탐욕 지수의 방향성 변화 모니터링',
      '거래량과 미결제약정 추이로 다음 변동성 구간 대비',
    ];
  }

  candidates.sort((a, b) => b.priority - a.priority);
  const picked = candidates.slice(0, 3).map((c) => c.text);

  while (picked.length < 3) {
    if (picked.length === 1) {
      picked.push('김프 및 USDT 프리미엄 추이로 한국 자금 흐름 점검');
    } else {
      picked.push('거래량과 미결제약정 추이로 다음 변동성 구간 대비');
    }
  }

  return picked;
}

/** DashboardData를 분석하여 시장 인사이트를 생성합니다. */
export function generateInsights(data: DashboardData): MarketInsight {
  return {
    topDrivers: extractTopDrivers(data),
    keyRisk: extractKeyRisk(data),
    keyRelief: extractKeyRelief(data),
    scenario: detectScenario(data),
    actionGuide: deriveActionGuide(data),
    observationPoints: buildObservationPoints(data),
  };
}
