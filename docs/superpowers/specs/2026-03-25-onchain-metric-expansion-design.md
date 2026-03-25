# Onchain Metric Expansion Design

작성일: 2026-03-25

## 1. 배경

현재 Bitflow의 온체인 화면은 `active supply`, `dormant reactivation`, `entity flow`, `whale alert`, `fee/tempo` 중심으로 구성되어 있다. 기본 온체인 화면은 이미 동작하지만, 지표 수가 제한적이고 일부 카드는 해석 레이어가 얕아서 더 깊은 분석으로 확장하기 어렵다.

이번 작업의 목표는 해석 개선 자체보다 먼저 `온체인 지표 확장`에 있다. 다만 단순히 카드 수만 늘리는 방식이 아니라, 이후에 데이터를 다시 가공하고 전문가용 분석으로 확장할 수 있도록 `데이터 통제력`이 높은 구조를 함께 만든다.

## 2. 이번 스펙의 목표

- 비트코인 온체인 지표 카탈로그를 현재보다 크게 확장한다.
- 확장 대상은 `공급/보유 구조 -> 주체별 압력 -> 실현 가치/손익` 순서로 둔다.
- 가능한 한 `Python worker + Supabase` 내부 계산으로 재현 가능한 지표를 우선한다.
- 현재 raw 정규화 테이블은 유지하고, 필요한 `상태/집계 테이블`만 추가하는 중간 확장 전략을 쓴다.
- 확장된 지표는 공개 `/onchain` 화면까지 반영한다.
- 지표는 `core`와 `proxy/experimental`로 명확히 구분한다.

## 3. 짧은 로드맵

- `1단계`: 온체인 지표 확장
- `2단계`: 사용자 피드백과 사용 데이터 기반 재정리
- `3단계`: 일반 사용자용 / 전문가용 분리

이번 스펙은 `1단계`만 다룬다.

## 4. 비목표

- 네트워크 구조 계열(`difficulty`, `hashrate`, `mempool`, `fee volatility`)을 이번 확장의 중심축으로 다루지 않는다.
- 일반 사용자용과 전문가용 화면을 이번에 분리하지 않는다.
- 지표 해석 UX를 대규모로 재설계하지 않는다.
- raw-normalized layer를 전면 개편하지 않는다.

## 5. 설계 원칙

- `데이터 통제력 우선`: 외부 API 실시간 호출보다 내부 저장 후 재사용 가능한 구조를 우선한다.
- `raw 유지`: `btc_blocks`, `btc_outputs`, `btc_inputs`, `btc_spent_edges`는 source of truth로 유지한다.
- `상태 우선`: 공개 지표 전에 재계산 가능한 상태 테이블을 만든다.
- `카탈로그 기반`: 지표를 하드코딩 enum이 아니라 메타데이터 기반으로 관리한다.
- `구분 명확화`: 코어 지표와 프록시 지표를 화면과 API에서 구분한다.
- `날짜 범위 재계산 가능`: 특정 날짜 범위만 다시 계산해도 같은 결과가 나와야 한다.

## 6. 데이터 계층

### 6.1 Raw-normalized layer

기존 테이블을 그대로 유지한다.

- `btc_blocks`
- `btc_txs`
- `btc_outputs`
- `btc_inputs`
- `btc_spent_edges`
- `btc_entity_labels`

이 계층은 source of truth이자 검산 기준으로 사용한다.

### 6.2 State / research layer

이번 확장의 핵심은 아래 상태성 테이블을 추가하는 것이다.

#### `btc_reference_prices`

일자별 BTC 기준 가격 저장용 테이블이다.

용도:

- `realized_cap`
- `realized_price`
- `MVRV`
- `SOPR`

원칙:

- 외부 가격 소스를 런타임에 즉시 읽어 계산하지 않는다.
- 일자별 참조값을 내부 테이블로 적재한 뒤 후속 계산이 이 값을 사용한다.
- 기준 통화는 `USD`로 고정한다.
- 기준 날짜는 `UTC day`로 고정한다.
- 기본 소스는 `CoinGecko daily close`로 두고, 최신일이 아직 마감되지 않은 경우에만 `Coinbase spot`을 임시 보조값으로 허용한다.
- `Coinbase spot`으로 채운 최신일 데이터는 `provisional` 상태로 표시하고, 이후 `CoinGecko daily close`가 들어오면 교체한다.
- 필요한 날짜의 참조 가격이 없으면 valuation 계열 지표를 강제로 forward-fill 하지 않고 해당 날짜를 `unavailable` 처리한다.

#### `btc_daily_supply_bands`

일자별 살아 있는 공급을 연령 버킷별로 저장한다.

예상 버킷:

- `lt_1d`
- `1d_1w`
- `1w_1m`
- `1m_3m`
- `3m_6m`
- `6m_12m`
- `1y_2y`
- `2y_5y`
- `5y_plus`

용도:

- `HODL waves`
- `old supply share`
- `reactivated old supply`
- `illiquid supply proxy`
- `active/inactive supply decomposition`

#### `btc_daily_realized_state`

실현 가치 계열 계산을 위한 일별 상태 테이블이다.

최소 저장 성격:

- live supply
- realized cap numerator
- spent value cost basis
- spent value at realization

용도:

- `realized_cap`
- `realized_price`
- `MVRV`
- `SOPR`
- 이후 `STH/LTH SOPR`

#### `btc_entity_balance_daily`

기존 `btc_entity_flow_daily`가 보여주지 못하는 누적 압력을 보기 위한 일별 상태 테이블이다.

최소 저장 성격:

- entity별 estimated balance
- received / sent / netflow
- role classification
  예: `exchange`, `miner`, `custody`, `unknown`
- coinbase-derived inflow / outflow

용도:

- `exchange pressure`
- `miner distribution`
- `concentration`
- `miner balance proxy`

엔티티 역할 분류 원칙:

- 역할의 authoritative source는 `btc_entity_labels`다.
- 역할은 `exchange`, `miner`, `custody`, `unknown` 네 가지로 제한한다.
- 역할 값은 `label_type='role'` 또는 동일 의미의 metadata 필드에서 읽는다.
- 하나의 entity에 역할 후보가 여러 개 있으면 `exchange -> miner -> custody -> unknown` 우선순위로 하나만 선택한다.
- 역할이 명시되지 않은 entity는 `unknown`으로 취급한다.
- `core` 역할 기반 지표는 명시적 역할이 있는 entity만 사용한다.
- `coinbase-derived` 지표는 role label과 무관하게 계산할 수 있으므로 core로 유지한다.
- miner label 의존이 큰 흐름과 잔고 계열은 `proxy/experimental`로 둔다.

### 6.3 Serving layer

공개/관리자 화면은 여전히 `btc_daily_metrics`를 표준 서빙 레이어로 쓴다. 다만 현재처럼 일부 metric id만 고정 관리하는 구조에서 벗어나, 카탈로그 기반 지표 정의를 함께 둔다.

## 7. 지표 카탈로그 설계

현재 `OnchainMetricId`는 6개 하드코딩 union 타입이다. 이번 확장에서는 고정 enum 중심 구조를 버리고 `지표 정의 카탈로그` 중심으로 바꾼다.

호환성 원칙:

- 이번 1차는 `breaking API change`가 아니라 `additive refactor`로 진행한다.
- 기존 6개 metric key는 그대로 유지한다.
- 현재 `/api/onchain/metrics?metric=<existing_key>` 계약은 계속 유효해야 한다.
- `summary` 응답도 기존 소비자가 깨지지 않도록 기본 구조를 유지한 채 그룹/메타데이터를 추가한다.
- 신규 지표만 카탈로그에서 확장하고, 기존 key는 카탈로그 안의 안정된 canonical id로 편입한다.

각 지표는 최소한 아래 메타데이터를 가진다.

- `key`
- `label`
- `family`
- `tier`
- `visibility`
- `unit`
- `defaultWindow`
- `interpretationHint`
- `status`

권장 값:

- `family`
  - `supply`
  - `entity-pressure`
  - `valuation`
- `tier`
  - `core`
  - `proxy`
- `visibility`
  - `public`
  - `expert`
- `status`
  - `stable`
  - `experimental`

이 구조를 통해 이후 `일반 사용자용 / 전문가용` 분리를 코드 분기보다 데이터 정의 중심으로 할 수 있게 한다.

## 8. 이번 1차 확장 지표 범위

### 8.1 공급/보유 구조

이번 확장의 중심축이다.

`core`

- `active_supply_ratio_7d`
- `active_supply_ratio_30d`
- `active_supply_ratio_90d`
- `active_supply_ratio_180d`
- `supply_age_share`
- `coin_days_destroyed`
- `dormancy`
- `liveliness`

`proxy/experimental`

- `illiquid_supply_proxy`
- `reactivated_old_supply_share`

### 8.2 주체별 압력

`core`

- `exchange_netflow_7d`
- `exchange_netflow_30d`
- `entity_flow_concentration`
- `coinbase_spent_btc`
- `miner_distribution_btc`

`proxy/experimental`

- `miner_balance_proxy`
- `miner_to_exchange_flow_proxy`

핵심 원칙:

- 정확성을 강하게 주장해야 하는 코어 지표는 raw 또는 coinbase-derived 기준으로 계산한다.
- 라벨링과 휴리스틱 의존이 큰 값은 `proxy/experimental`로 분리한다.

### 8.3 실현 가치/손익

`core`

- `realized_cap`
- `realized_price`
- `mvrv`
- `sopr`

`proxy/experimental`

- `sth_sopr`
- `lth_sopr`

## 9. 파이프라인 계산 방식

계산 플로우는 아래 순서를 따른다.

1. `raw ingest`
기존과 동일하게 블록, tx, input, output, spent edge를 적재한다.

2. `reference refresh`
일자별 BTC 기준 가격을 `btc_reference_prices`에 적재한다.

3. `state build`
대상 날짜 범위에 대해 아래 상태를 계산한다.

- `btc_daily_supply_bands`
- `btc_daily_realized_state`
- `btc_entity_balance_daily`

4. `metric materialize`
상태 테이블에서 공개용 지표를 `btc_daily_metrics`로 산출한다.

5. `serve`
웹과 API는 가능한 한 `btc_daily_metrics`와 일부 요약용 상태 테이블만 읽는다.

원칙:

- 모든 단계는 날짜 범위 기반으로 재계산 가능해야 한다.
- 같은 날짜 범위를 두 번 계산해도 결과가 동일해야 한다.
- 신규 지표 추가는 raw 개편보다 state/materialize 단계 확장으로 처리할 수 있어야 한다.

## 10. API 변경

### `GET /api/onchain/summary`

기존 summary 응답은 유지하되 아래 개념을 추가한다.

- `metricGroups`
- `featuredMetrics`
- `experimentalMetrics`

공개 화면이 코어 지표와 실험 지표를 구분해 그릴 수 있어야 한다.

### `GET /api/onchain/metrics`

현재는 `metric=<key>` 단건 조회 중심이다. 이를 확장해 아래 필터를 허용한다.

- `metric`
- `family`
- `tier`
- `visibility`
- `days`

### `GET /api/onchain/catalog`

신규 엔드포인트다.

목적:

- 공개 화면과 관리자 화면이 같은 지표 정의를 공유한다.
- 지표 메타데이터를 런타임에 조회할 수 있게 한다.

### `GET /api/admin/onchain`

현재 런타임/퍼블리시 상태 확인 중심이다. 아래 운영 메타를 추가한다.

- 최근 계산 성공 일시
- metric coverage
- stable / experimental 비중
- state table freshness
- family별 산출 상태

## 11. 공개 `/onchain` 화면 구조

이번 확장 결과는 공개 `/onchain` 화면까지 반영한다. 다만 모든 지표를 동등한 카드로 나열하지 않는다.

### 상단

기존 `Briefing`과 `Regime` 중심 구조를 유지한다.

### 구역 1. Supply Structure

배치 대상:

- active supply
- HODL wave
- coin days destroyed
- dormancy
- liveliness

### 구역 2. Holder / Entity Pressure

배치 대상:

- exchange pressure
- entity concentration
- miner distribution
- miner proxy 계열

### 구역 3. Valuation

배치 대상:

- realized price
- MVRV
- SOPR

### 구역 4. Experimental

배치 대상:

- illiquid supply proxy
- miner balance proxy
- STH/LTH SOPR

표시 원칙:

- `core`는 기본 노출
- `proxy/experimental`은 별도 섹션 또는 접기 영역에 분리 노출
- 카드에는 숫자뿐 아니라 `의미`, `proxy 여부`, `과해석 경고`를 함께 표시

## 12. 오류 처리

- `core` 지표 계산 실패는 해당 날짜 범위를 실패로 기록하고 관리자 화면에서 즉시 드러나게 한다.
- `proxy/experimental` 실패는 전체 summary를 깨지 않고 해당 지표만 `unavailable` 처리한다.
- 각 지표는 아래 메타를 가질 수 있어야 한다.
  - `sourceState`
  - `tier`
  - `status`
  - `latestCalculatedAt`
  - `coverageDays`

공개 화면의 기본 원칙:

- `stable/core`는 계속 표시
- `proxy/experimental`은 실패 시 숨기거나 준비 중 상태로 내린다

## 13. 검증과 테스트

### 단위 테스트

- supply band 계산
- coin days destroyed 계산
- dormancy 계산
- liveliness 계산
- realized price 계산
- MVRV 계산
- SOPR 계산

### 스냅샷 테스트

고정 블록 구간 또는 고정 날짜 구간에 대해 metric 출력이 안정적으로 유지되는지 확인한다.

### 불변식 검증

- age band 합계가 live supply와 크게 어긋나지 않는지
- realized price = realized cap / live supply 관계가 맞는지
- entity inflow / outflow / netflow 부호가 일관적인지

### 재계산 테스트

같은 날짜 범위를 두 번 돌려도 결과가 동일해야 한다.

### API 테스트

- `metric`
- `family`
- `tier`
- `visibility`
- `days`

필터가 기대대로 동작하는지 확인한다.

## 14. 구현 범위 요약

이번 스펙은 아래 범위를 포함한다.

- 상태/집계 테이블 추가
- worker 계산 단계 확장
- 지표 카탈로그 구조 도입
- `/api/onchain/*` 확장
- `/api/admin/onchain` 운영 정보 확장
- 공개 `/onchain` 화면에 신규 지표 반영

이번 스펙은 아래 범위를 포함하지 않는다.

- 일반 사용자용 / 전문가용 UI 분리
- 네트워크 구조 계열 중심 재설계
- 전체 온체인 해석 UX 재작성

## 15. 설계 한 줄 요약

이번 확장은 `지표를 많이 붙이는 것`이 목적이지만, 방식은 `재현 가능한 상태를 먼저 쌓고 그 위에 공개 지표를 올리는 구조`로 간다. 이렇게 해야 이후 피드백 정리와 일반/전문가 분리가 같은 데이터 기반 위에서 가능해진다.
