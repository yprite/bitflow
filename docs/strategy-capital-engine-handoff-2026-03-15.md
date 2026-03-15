# Strategy Capital Engine Handoff

작성일: 2026-03-15

## 현재 상태

기존 `Strategy BTC 보유량` 지표는 제거했고, 현재 대시보드의 11번째 지표는 `Strategy 자본엔진 (STRC)` 기준으로 동작한다.

이번 세션에서 완료한 범위:

- `Strategy 총 BTC 보유량 변화` 기반 모델 제거
- `STRC ATM 발행 -> Strategy 매수 재원` 관점의 데이터 모델 추가
- `strc.live`의 `ticker-data`, `sec-filings`를 읽는 fetcher 구현
- 대시보드 카드, 요약 테이블, 시그널 계산, 인사이트 문구 교체
- 추정식 단위 테스트 추가
- `npm test`, `npm run build` 통과
- 커밋/푸시 완료: `9657b1e`

## 핵심 파일

- STRC 데이터 fetch + 추정 계산기: [src/lib/strategy-capital.ts](/Users/yonghun/.openclaw/workspace/bitflow/src/lib/strategy-capital.ts)
- 추정식 테스트: [src/lib/strategy-capital.test.ts](/Users/yonghun/.openclaw/workspace/bitflow/src/lib/strategy-capital.test.ts)
- 타입 정의: [src/lib/types.ts](/Users/yonghun/.openclaw/workspace/bitflow/src/lib/types.ts)
- API 응답 조립: [src/app/api/kimp/route.ts](/Users/yonghun/.openclaw/workspace/bitflow/src/app/api/kimp/route.ts)
- 복합 시그널 계산: [src/lib/kimp.ts](/Users/yonghun/.openclaw/workspace/bitflow/src/lib/kimp.ts)
- 카드 UI: [src/components/strategy-capital-card.tsx](/Users/yonghun/.openclaw/workspace/bitflow/src/components/strategy-capital-card.tsx)
- 실시간 페이지 연결: [src/app/realtime/page.tsx](/Users/yonghun/.openclaw/workspace/bitflow/src/app/realtime/page.tsx)
- 인라인 지표 라벨: [src/components/indicator-table.tsx](/Users/yonghun/.openclaw/workspace/bitflow/src/components/indicator-table.tsx)
- 시나리오/해석 문구: [src/lib/market-insights.ts](/Users/yonghun/.openclaw/workspace/bitflow/src/lib/market-insights.ts)

## 새 데이터 모델 요약

`DashboardData.strategyCapital` 구조는 아래 의미를 가진다.

- `status`
  `active | standby | unavailable`
- `thresholdPrice`
  현재는 STRC ATM 임계가로 `99.98` 고정
- `currentPrice`
  최신 intraday bar의 마지막 가격
- `distanceToThreshold`
  `currentPrice - thresholdPrice`
- `currentDay`
  최신 세션 기준 추정치
- `currentWeekEstimatedBtc`
  최신 거래 주간(월~금) 누적 추정 BTC
- `latestConfirmed`
  가장 최근 STRC filing 기준 확정 조달 이벤트
- `confirmedTotalEstimatedBtc`
  STRC filing 전체를 `netProceeds / avgBtcPrice`로 합산한 누적치

## 추정 로직

현재 구현은 `strc.live`의 상세 페이지 수치와 맞는 휴리스틱을 코드로 옮긴 것이다.

식:

```text
eligibleVolume = 1분봉 중 close >= 99.98 인 거래량 합
estimatedAtmVolume = eligibleVolume * 0.4
estimatedNetProceedsUsd = estimatedAtmVolume * closePrice * 0.975
estimatedBtc = estimatedNetProceedsUsd / dailyBtcPrice
```

세부 규칙:

- `0.4`
  임계가 이상 거래량 중 40%를 ATM 발행량으로 추정
- `0.975`
  브로커 수수료 2.5% 차감
- `dailyBtcPrice`
  `ticker-data.btcHistory[YYYY-MM-DD]` 사용
- 주간 추정치는 최신 거래일이 속한 주(`월요일 시작`)만 합산

## 시그널 반영 방식

복합 시그널의 마지막 팩터는 이제 `MSTR매입`이 아니라 `STRC엔진`이다.

현재 점수 기준:

- `currentWeekEstimatedBtc >= 3000` 또는 `latestConfirmed.netProceedsUsd >= 250M` → `+2`
- `currentWeekEstimatedBtc >= 500` 또는 `latestConfirmed.netProceedsUsd >= 50M` → `+1`
- `distanceToThreshold <= -1.5` → `-2`
- `distanceToThreshold < 0` → `-1`

즉, 이 지표는 `보유량 확인`이 아니라 `조달 엔진의 온도`를 반영한다.

## 확인된 제약

- 데이터 소스는 현재 공식 SEC/Strategy 직접 수집이 아니라 `strc.live`의 비공식 API다.
- `latestConfirmed`는 SEC 링크가 붙지만, `currentWeekEstimatedBtc`와 `currentDay`는 휴리스틱이다.
- `confirmedTotalEstimatedBtc`도 공식 공시값이 아니라 `netProceeds / avgBtcPrice` 계산값이다.
- `thresholdPrice = 99.98`, `40%`, `2.5%`는 현재 구현 상수이며, 공식 Strategy 문서에서 직접 주는 값은 아니다.

## 다음 세션에서 바로 할 일

1. `strc.live` 의존을 줄일지 결정
2. 가능하면 Strategy/SEC 원문에서 filing feed를 직접 수집하는 경로 추가
3. `strategyCapital` 히스토리를 Supabase에 저장할지 결정
4. 상세 카드에 `최근 5일 추정 표` 또는 `currentWeek trend sparkline` 추가
5. 필요하면 `STRC` 외 `STRK/STRF/STRD` 확장 설계

## 주의사항

- 현재 워크트리에는 이번 문서 작업과 별개인 사용자 변경이 남아 있다.
- 확인된 예: `.gitignore`, `README.md`, `docs/bitcoin-onchain-*`, `python/`, `supabase/migrations/004_btc_onchain.sql`
- 다음 세션에서 커밋할 때도 이 파일들을 같이 묶지 않도록 주의할 것

## 한 줄 요약

`Strategy BTC 보유량` 카드는 없앴고, 이제 대시보드는 `STRC ATM 자본엔진`의 `확정 filing + 주간 추정 BTC`를 기준으로 움직인다.
