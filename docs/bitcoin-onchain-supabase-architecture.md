# BitFlow Bitcoin On-Chain Architecture

작성일: 2026-03-15

## 1. 기본 원칙

이 프로젝트에서 비트코인 온체인 데이터는 `웹 서버가 직접 노드에 붙는 구조`로 처리하지 않는다.

권장 흐름은 아래와 같다.

```text
bitcoind / electrs
  -> Python ingest worker
  -> Supabase Postgres
  -> Vercel API / web UI
```

핵심 이유는 세 가지다.

- 노드와 인덱서 작업은 CPU, 디스크, 장시간 연결이 필요하다.
- Vercel 서버리스는 무거운 백필과 실시간 소비자를 맡기기 어렵다.
- 웹이 읽어야 하는 데이터는 전체 체인이 아니라 가공된 serving 테이블이다.

## 2. Supabase를 어디에 쓰는가

Supabase는 이 구조에서 `serving DB`이자 `운영용 Postgres`로 쓴다.

- Python은 Supabase의 Postgres DSN으로 직접 접속해 적재한다.
- Next.js는 기존처럼 Supabase service role로 읽는다.
- 프런트는 `btc_daily_metrics`, `btc_entity_flow_daily`, `btc_alert_events` 같은 가벼운 테이블만 본다.

즉, 질문 그대로 `로컬 또는 VPS에서 돌고 있는 Python이 분석 결과를 Supabase에 저장하고, Vercel에 배포된 웹이 그 결과를 읽어 보여주는 구조`가 맞다.

## 3. 데이터 계층 분리

초기에는 하나의 Supabase Postgres 안에서 아래 세 계층으로 분리한다.

### Raw-normalized layer

- `btc_blocks`
- `btc_txs`
- `btc_inputs`
- `btc_outputs`
- `btc_spent_edges`
- `btc_sync_state`

이 계층은 재현성과 리오그 대응을 위한 기준 데이터다.

### Research layer

- `btc_descriptor_watchlists`
- `btc_entity_labels`

이 계층은 주소 문자열보다 `scriptPubKey`, descriptor, entity 추정에 가까운 레이어다.

### Serving layer

- `btc_daily_metrics`
- `btc_entity_flow_daily`
- `btc_alert_events`

웹, 텔레그램, 관리자 화면은 이 계층을 우선 조회한다.

## 4. Python 프로세스 역할

Python 쪽은 최소 3개 프로세스로 나눈다.

### 1) Backfill

- height 범위로 블록을 읽는다.
- 블록, tx, vin, vout, spent edge를 정규화한다.
- `btc_sync_state`로 마지막 적재 높이를 관리한다.

### 2) Metrics

- raw-normalized layer를 기준으로 일별 지표를 계산한다.
- 결과를 `btc_daily_metrics`, `btc_entity_flow_daily`에 upsert한다.
- 재계산 가능하도록 날짜 범위 기반으로 동작한다.

### 3) Realtime

- Bitcoin Core ZMQ로 새 블록/트랜잭션 이벤트를 받는다.
- 새 블록 확정 시 raw layer를 보강하고, 필요한 알림을 평가한다.
- 결과를 `btc_alert_events`에 적재한다.

## 5. 웹에서 읽는 방식

Vercel 웹은 아래 두 방식만 쓴다.

- `from('btc_daily_metrics')` 같은 직접 조회
- `rpc('get_btc_metric_series')` 같은 얇은 집계 함수

웹이 직접 `bitcoind` RPC를 치거나, 블록 JSON을 파싱하거나, 리오그를 처리하지 않는다.

## 6. 운영 단계별 권장안

### MVP

- Python 워커는 로컬 개발 환경 또는 작은 VPS에서 실행
- Supabase 하나에 raw + serving을 같이 저장
- 웹은 serving 테이블만 사용

### 데이터가 커진 뒤

- raw-normalized layer를 별도 Postgres로 분리
- serving layer만 Supabase로 계속 미러링
- 웹은 변경 없이 Supabase만 읽음

즉, 초반에는 Supabase 하나로 시작하고, 나중에 무거운 원본 데이터만 떼어내는 전략이 가장 덜 꼬인다.

## 7. 폴더 원칙

`python/`은 앱 코드와 분리한다.

- `src/bitflow_onchain/clients`: Bitcoin RPC, Postgres 연결
- `src/bitflow_onchain/transformers`: 블록/tx 정규화
- `src/bitflow_onchain/pipelines`: backfill, metrics, realtime
- `src/bitflow_onchain/main.py`: 실행 진입점

이 구조면 웹 코드와 온체인 워커를 독립적으로 배포하고 테스트할 수 있다.
