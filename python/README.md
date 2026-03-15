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
