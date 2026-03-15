# Bitcoin On-Chain Handoff

작성일: 2026-03-15

## 현재 상태

비트코인 온체인 파이프라인은 `bitcoind/electrs -> Python worker -> Supabase Postgres -> Vercel web` 구조로 정리되어 있다.

이번 세션에서 완료한 범위:

- Supabase serving/raw 구조 문서 추가
- Python 워커 스캐폴드가 아니라 실제 적재 흐름까지 구현
- 온체인 정규화/serving 테이블용 Supabase 마이그레이션 초안 추가
- 남은 작업 목록 문서 추가

## 핵심 파일

- 아키텍처 문서: [docs/bitcoin-onchain-supabase-architecture.md](/Users/yonghun/.openclaw/workspace/bitflow/docs/bitcoin-onchain-supabase-architecture.md)
- 남은 작업: [docs/bitcoin-onchain-remaining-work.md](/Users/yonghun/.openclaw/workspace/bitflow/docs/bitcoin-onchain-remaining-work.md)
- 마이그레이션: [supabase/migrations/004_btc_onchain.sql](/Users/yonghun/.openclaw/workspace/bitflow/supabase/migrations/004_btc_onchain.sql)
- Python 실행 진입점: [python/src/bitflow_onchain/main.py](/Users/yonghun/.openclaw/workspace/bitflow/python/src/bitflow_onchain/main.py)
- 블록 적재 공용 로직: [python/src/bitflow_onchain/pipelines/ingestion.py](/Users/yonghun/.openclaw/workspace/bitflow/python/src/bitflow_onchain/pipelines/ingestion.py)
- DB 적재/집계: [python/src/bitflow_onchain/clients/postgres.py](/Users/yonghun/.openclaw/workspace/bitflow/python/src/bitflow_onchain/clients/postgres.py)
- 실시간 소비자: [python/src/bitflow_onchain/pipelines/realtime.py](/Users/yonghun/.openclaw/workspace/bitflow/python/src/bitflow_onchain/pipelines/realtime.py)
- 실행 가이드: [python/README.md](/Users/yonghun/.openclaw/workspace/bitflow/python/README.md)

## Python 워커가 현재 하는 일

- `backfill`
  블록을 읽어 `btc_blocks`, `btc_txs`, `btc_inputs`, `btc_outputs`, `btc_spent_edges`에 적재
- `metrics`
  일별 `created_utxo_count`, `spent_utxo_count`, `spent_btc`, `dormant_reactivated_btc`, `active_supply_ratio`, `spent_btc_age_band` 계산
- `metrics`
  `btc_entity_labels`가 있으면 `btc_entity_flow_daily`도 계산
- `realtime`
  ZMQ `rawblock` 수신 시 새 블록 적재, `rawtx` 수신 시 큰 미확정 이동 알림 생성
- `alerts`
  `new_block`, `large_confirmed_spend`, `dormant_reactivation`, `mempool_large_tx`를 `btc_alert_events`에 적재

## 확인된 제약

- 이 로컬 셸 환경에는 `psycopg`, `pyzmq`가 아직 설치되어 있지 않았다.
- 그래서 실제 DB/ZMQ 연결 실행은 아직 못 했고, 문법 체크와 정규화 스모크 테스트만 수행했다.

실행 전 필요:

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
```

## 검증 완료 항목

- `python3 -m compileall python/src` 통과
- 샘플 블록으로 `normalize_block_bundle()` 스모크 테스트 통과
  결과: tx 2개, input 2개, output 2개, spent edge 1개, fee 계산 정상

## 다음 세션에서 바로 할 일

1. Supabase에 `004_btc_onchain.sql` 적용
2. `python/.env`에 Bitcoin RPC, ZMQ, `BITFLOW_PG_DSN` 설정
3. Python 의존성 설치
4. 소규모 백필 실행

```bash
cd python
source .venv/bin/activate
PYTHONPATH=src python -m bitflow_onchain.main backfill --start-height 0 --end-height 1000
PYTHONPATH=src python -m bitflow_onchain.main metrics --date 2026-03-15
```

5. Supabase 테이블에 데이터가 들어가는지 확인
6. 이후 Next.js 쪽 `/api/onchain/*`와 `/onchain` 페이지 구현 시작

## 다음 우선순위

- Supabase RLS 정책 정리
- 리오그 발생 시 serving 테이블 재계산 자동화
- `btc_descriptor_watchlists` 활용 로직 추가
- Vercel API route 추가
- 온체인 카드/차트 UI 추가

## 주의사항

- 현재 git 상태에는 온체인 작업과 별개로 사용자 변경으로 보이는 파일이 있다.
- 확인된 예: `src/lib/kimp.ts`, `src/lib/types.ts`, `src/lib/strategy-capital.ts`
- 다음 세션에서도 이 파일들은 건드리기 전에 기존 변경을 먼저 확인할 것

## 한 줄 요약

DB 스키마 초안과 Python 워커 기본 구현은 들어갔고, 다음 단계는 `Supabase 적용 -> 실제 백필 실행 -> 웹 API/페이지 연결`이다.
