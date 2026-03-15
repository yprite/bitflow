# Bitcoin On-Chain Remaining Work

작성일: 2026-03-15

## 1. 운영 전 필수 작업

- Supabase에 [004_btc_onchain.sql](/Users/yonghun/.openclaw/workspace/bitflow/supabase/migrations/004_btc_onchain.sql)를 실제 적용
- Supabase Postgres direct connection string을 `BITFLOW_PG_DSN`으로 발급
- Bitcoin Core를 `txindex=1`, ZMQ, 충분한 디스크 용량 기준으로 운영
- Python 워커를 로컬이 아니라 VPS/systemd 기준으로 상시 실행

## 2. Python 워커에서 아직 남은 것

- `btc_descriptor_watchlists` 기반 스캔 자동화
- mempool `rawtx`를 알림뿐 아니라 별도 큐나 테이블로 보존할지 결정
- 리오그 발생 시 영향받은 `btc_daily_metrics`, `btc_entity_flow_daily`, `btc_alert_events` 재계산 자동화
- 백필 성능 개선: RPC fallback 최소화, bulk insert 튜닝, 병렬 배치
- 운영 로깅과 장애 알림 추가

## 3. Vercel 웹 쪽 남은 작업

- `src/app/api/onchain/summary/route.ts`
- `src/app/api/onchain/metrics/route.ts`
- `src/app/api/onchain/alerts/route.ts`
- `src/app/onchain/page.tsx` 또는 기존 홈 대시보드에 온체인 카드 추가
- `btc_daily_metrics`를 읽는 차트 컴포넌트 추가
- `btc_entity_flow_daily` 기반 거래소 순유입/순유출 카드 추가
- `btc_alert_events` 피드 UI 추가

## 4. 보안과 정책

- Supabase RLS 정책 정의
- 웹에서 service role key가 브라우저로 노출되지 않도록 서버 전용 경로만 사용
- Python 워커용 DB 자격 증명 회전 전략 수립

## 5. 검증 작업

- 샘플 블록 단위로 BTC explorer와 교차검증
- 같은 날짜 재계산 시 지표 값이 동일한지 검증
- 리오그/중복 적재/idempotency 테스트
- 태깅된 엔티티 순유입 수치 검증
- 알림 dedupe 동작 검증

## 6. 권장 다음 순서

1. Supabase 마이그레이션 적용
2. Python 워커로 genesis 이후 일부 구간 백필
3. 일별 지표 결과 검산
4. Next.js API route 추가
5. `/onchain` 페이지와 카드/차트 연결
