# BitFlow On-Chain Worker

이 디렉터리는 비트코인 노드 데이터 적재와 지표 계산을 담당하는 Python 워커용 스캐폴드다.

## 구조

```text
python/
├── .env.example
├── pyproject.toml
└── src/bitflow_onchain/
    ├── clients/
    │   ├── bitcoin_rpc.py
    │   └── postgres.py
    ├── pipelines/
    │   ├── backfill.py
    │   ├── metrics.py
    │   └── realtime.py
    ├── transformers/
    │   └── normalize.py
    ├── config.py
    ├── main.py
    └── models.py
```

## 역할 분리

- `clients/bitcoin_rpc.py`: `bitcoind` JSON-RPC 접근
- `clients/postgres.py`: Supabase Postgres 적재
- `transformers/normalize.py`: 블록/트랜잭션을 테이블 단위 레코드로 정규화
- `pipelines/backfill.py`: 과거 블록 백필
- `pipelines/metrics.py`: 일별 지표와 엔티티 순유입 계산
- `pipelines/realtime.py`: ZMQ 기반 실시간 소비자와 알림 생성

## 실행 모델

이 워커는 Supabase REST API가 아니라 `Supabase Postgres DSN`으로 직접 적재하는 것을 전제로 한다.

```text
bitcoind/electrs -> python worker -> supabase postgres -> vercel web
```

이유는 아래와 같다.

- 대량 upsert와 배치 적재는 REST보다 Postgres 직결이 단순하다.
- 정규화 테이블과 serving 테이블을 같은 트랜잭션 안에서 다루기 쉽다.
- 웹은 기존 `@supabase/supabase-js` 흐름을 그대로 유지할 수 있다.

## 현재 워커가 하는 일

- `backfill`: 블록, tx, input, output, spent edge를 Supabase에 적재
- `metrics`: `created_utxo_count`, `spent_utxo_count`, `spent_btc`, `dormant_reactivated_btc`, `active_supply_ratio`, `spent_btc_age_band` 계산
- `metrics`: `btc_entity_labels`가 있으면 `btc_entity_flow_daily`도 갱신
- `realtime`: 새 블록을 받아 정규화 테이블을 최신화하고 큰 이동/휴면 코인 재활성화 알림을 적재

## 추천 실행 순서

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
PYTHONPATH=src python -m bitflow_onchain.main backfill --start-height 0 --end-height 1000
PYTHONPATH=src python -m bitflow_onchain.main metrics --date 2026-03-15
PYTHONPATH=src python -m bitflow_onchain.main realtime
```

## 배포 권장

- 개발: 로컬에서 실행
- 운영: 작은 VPS 또는 별도 워커 인스턴스에서 systemd/cron으로 상시 실행
- 웹: Vercel에서 Supabase serving 테이블만 조회

## 로컬 디스크 가드

- `BITFLOW_RAW_RETENTION_BLOCKS`: 로컬 Postgres raw 블록 보존 범위. 기본값은 `14400` 블록이다.
- `BITFLOW_ENABLE_PREVOUT_SNAPSHOT=0`: 기본값. 최근 `getblock ... 3`의 `prevout` 정보를 신뢰하고 장기 snapshot 테이블을 키지 않는다.
- `BITFLOW_ONCHAIN_GUARD_MAX_DB_GB=180`: 로컬 on-chain DB가 이 크기를 넘기면 자동 가드가 DB를 재생성한다.
- `BITFLOW_ONCHAIN_GUARD_MIN_FREE_GB=80`: 디스크 여유가 이 값 아래로 내려가도 자동 가드가 동작한다.
- `BITFLOW_ONCHAIN_GUARD_FORCE_SKIP_PREVOUT_SNAPSHOT=1`: emergency reset 시 snapshot export를 생략한다. 로컬 디스크를 우선 살리는 기본값이다.

- `com.bitflow.onchain-retention`: 15분마다 raw 보존 범위를 정리한다.
- `com.bitflow.onchain-db-guard`: 15분마다 DB 크기와 free disk를 확인하고 임계치 초과 시 catchup/realtime을 내린 뒤 DB를 재생성하고 다시 올린다.
