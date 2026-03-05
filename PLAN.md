# Bitflow - 비트코인 온체인 데이터 대시보드

## 프로젝트 개요

한국 비트코인 투자자를 위한 온체인 데이터 대시보드.
매일 30초 안에 시장 상태를 파악할 수 있는 한 페이지 대시보드 + 트위터 자동 운영.

- 목표 월수익: 50만원 (광고 수익)
- 운영 방식: 반자동 (데이터 수집/게시 자동, 장애 대응/Mac 관리는 수동)
- 월 운영비: ~1,500원 (도메인만)

### 수익 근거

```
보수적 시나리오 (RPM ₩4,000):
  필요 월 PV: 12.5만
  세션당 PV: 2.5 → 필요 월 UV: 5만 → 필요 일 UV: ~1,650

낙관적 시나리오 (RPM ₩6,000):
  필요 월 PV: 8.3만
  세션당 PV: 2.5 → 필요 월 UV: 3.3만 → 필요 일 UV: ~1,100

RPM 산출 근거:
  AdSense CTR: 1.5~2.5% (금융 니치 한국 평균)
  CPC: ₩300~600 (한국 크립토 키워드)
  RPM = CTR × CPC × 1,000
  하한: 0.015 × 300 × 1,000 = ₩4,500 → 보수적 ₩4,000
  상한: 0.025 × 600 × 1,000 = ₩15,000 → 낙관적으로도 ₩6,000 사용

목표 일 UV: 1,100~1,650명
검증 시점: 3개월 차에 실제 RPM/CTR 측정 후 목표 재조정
```

### 수익-KPI 연결

```
12개월 목표: 월 50만원
필요 조건: 일 UV 1,100명 (RPM ₩6,000) ~ 1,650명 (RPM ₩4,000)

KPI 경로:
  9개월 차 일 UV 1,000명 도달 시:
    RPM ₩4,000 → 월 30만원 (목표 미달, 레퍼럴 수익으로 보전)
    RPM ₩6,000 → 월 45만원 (목표 근접)
  12개월 차 일 UV 1,300명 도달 시:
    RPM ₩4,000 → 월 39만원 + 레퍼럴 ~10만원 = 약 50만원
    RPM ₩6,000 → 월 58만원 (목표 초과)
```

### KPI 미달 시 운영 룰

```
3개월 차 리뷰 (Week 12):
  측정: 실제 RPM, 일 UV, 트위터 팔로워, 페이지별 유입 비중
  판정 기준과 액션:

  [RPM < ₩3,000]
    실험 A: 광고 배치 변경 (상단 → 인피드, 사이드바 추가) — 2주 A/B
    실험 B: 상세 페이지 콘텐츠 보강 (체류시간↑ → RPM↑) — 2주
    판정: 4주 후 RPM ₩3,000 미달 지속 시 수익 목표를 30만원으로 하향

  [일 UV < 200] (= 3개월 목표 미달)
    실험 A: SEO 키워드 재선정 (Search Console 데이터 기반) — 4주 관찰
    실험 B: 트위터 포스팅 포맷 변경 (이미지→스레드, 해시태그 실험) — 2주
    판정: 8주 후(5개월 차) UV < 200 지속 시 프로젝트 피벗 or 중단 결정

  [트위터 팔로워 < 500]
    실험: 한국 크립토 커뮤니티(디시, 클리앙) 직접 홍보 2주
    판정: 팔로워 성장률 주 5% 미만이면 트위터 의존도 낮추고 SEO 집중

6개월 차 리뷰 (Week 24):
  [AdSense 미승인]
    콘텐츠 페이지 20개 이상 확보 후 재신청
    2회 거절 시 대안 광고 네트워크(카카오 애드핏, 데이블) 전환

  [일 UV < 300]
    프로젝트 ROI 재평가. 투입 시간 대비 전망 판단.
    중단 기준: 6개월 누적 투입 시간 > 200시간 & 월수익 전망 < 10만원
```

---

## 1. 기술 스택

| 구분 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 14 (App Router) | ISR, API Route, OG 이미지 생성 |
| 호스팅 | Vercel (무료) | Next.js 최적 배포, 무료 SSL |
| DB | Supabase (PostgreSQL 무료) | 시계열 데이터 저장, 무료 500MB |
| 차트 | Lightweight Charts (TradingView OSS) | 금융 차트 특화, 경량 |
| 스타일링 | Tailwind CSS | 빠른 UI 개발 |
| OG 이미지 | @vercel/og (Satori) | 트위터 카드 자동 생성 |
| 트위터 자동화 | OpenChrome (브라우저 자동화) | API 승인 불필요, 로그인 세션 재활용 |
| 스케줄링 | launchd (macOS) | 절전 복귀 후 missed job 재실행 지원 |

### 스케줄링: launchd

```
~/Library/LaunchAgents/
├── kr.bitflow.collect-data.plist    # 매 1시간
├── kr.bitflow.post-tweet.plist      # 매일 08:00, 20:00
├── kr.bitflow.whale-detect.plist    # 매일 08:00, 14:00, 20:00
└── kr.bitflow.weekly-report.plist   # 일요일 10:00
```

### 로컬 의존성 한계

**LaunchAgents는 사용자 로그인 세션에 의존합니다.**
재부팅 후 자동 로그인이 설정되어 있지 않으면 스케줄이 실행되지 않음.

**필수 설정:**
- macOS 자동 로그인 활성화 (시스템 설정 → 사용자 및 그룹 → 자동 로그인)
- 에너지 절약 → "네트워크 접근 시 깨우기" 활성화
- caffeinate 또는 pmset으로 장시간 절전 방지 (선택)

### 보안 트레이드오프

자동 로그인 + 상시 브라우저 세션 + .env.local에 서비스 키 보관은 보안 리스크를 높임.

```
리스크 (영향도: 높음):
  - Mac 물리적 접근 시 모든 서비스 키 노출
  - SUPABASE_SERVICE_KEY는 DB 전체 읽기/쓰기/삭제 권한 보유
    → 유출 시 onchain_metrics 전체 삭제, 데이터 조작 가능
  - 트위터 로그인 세션이 항상 열려 있음
  - .env.local 평문 저장

수용 근거:
  - 개인 Mac, 1인 운영, 물리적 접근 통제 가능
  - DB 데이터는 공개 API에서 재수집 가능 (비가역 손실 아님)
  - 트위터 계정 탈취 시 영향: 스팸 트윗 (복구 가능)
  - 금전 거래 권한을 가진 키는 없음

완화 조치:
  - FileVault 디스크 암호화 활성화 (macOS 기본 제공) — 필수
  - .env.local 파일 권한 600 (소유자만 읽기/쓰기) — 필수
  - Mac 잠금 화면 비밀번호 설정 (절전 복귀 시) — 필수
  - Supabase RLS(Row Level Security) 활성화: service_key 외 접근 차단 — 필수
  - 향후 VPS 이전 시 Vault/SOPS 등 시크릿 매니저 도입
```

**수용 가능한 이유:**
- 50만원 목표에서 간헐적 데이터 공백은 치명적이지 않음
- 대시보드는 "마지막 업데이트 시각"을 명시하여 stale 데이터 구분
- 하루 이상 Mac 꺼짐이 예상되면 수동으로 collect-data.js 1회 실행
- 향후 트래픽 증가 시 VPS(월 ₩5,000~10,000)로 이전 가능

---

## 2. 데이터 소스

### 정규 스케줄 (Source of Truth)

| 지표 | API | 무료 한도 | 수집 주기 | 데이터 해상도 |
|------|-----|----------|----------|-------------|
| BTC 가격/시총 | CoinGecko | 분당 10~30회 | 1시간 | 시간별 |
| 공포/탐욕 지수 | Alternative.me | 무제한 (일 1회 갱신) | 1일 (08:00) | 일별 |
| 거래소 잔고/넷플로우 | Blockchain.com | 관대 | 1시간 | 시간별 |
| 고래 대형 이체 | Whale Alert | **월 100회** | **하루 3회** (08:00, 14:00, 20:00) | 이벤트 |
| 멤풀/수수료 | Mempool.space | 무제한 | 1시간 | 시간별 |
| UTXO 연령 분포 | Blockchain.com | 관대 | 1일 (08:00) | 일별 |

**Whale Alert 스케줄 통일:**
- launchd: 하루 3회 (08:00, 14:00, 20:00) 고정
- 월 사용량: 3회/일 × 30일 = 월 90회 (한도 100회 내)
- 각 호출에서 `since` 파라미터로 이전 호출 이후 트랜잭션만 조회

### Whale Alert API 한도 관리 (동시 실행 방어)

```
문제: 수동 실행 + 스케줄 실행이 겹치면 한도 초과 가능.
    supabase-js는 BEGIN/COMMIT/FOR UPDATE를 직접 지원하지 않음.

해결: 로컬 파일 락 (flock) + DB 카운터 이중 방어

whale-detect.js 실행 흐름:
1. flock으로 $BITFLOW_HOME/.whale-detect.lock 획득 시도
   → 이미 락 보유 중 → 즉시 종료 (다른 인스턴스 실행 중)
2. DB에서 이번 달 api_usage 카운트 조회:
   SELECT COUNT(*) FROM api_usage
   WHERE api_name = 'whale_alert' AND month_key = '2026-03'
3. count >= 90 → 락 해제, 종료 ("한도 도달")
4. count < 90 →
   INSERT INTO api_usage (api_name, month_key) VALUES ('whale_alert', '2026-03')
5. Whale Alert API 호출
6. 실패 시: 해당 api_usage 행 삭제 (실패는 카운트 안 함)
7. 락 해제

동시 실행 시:
- flock이 OS 레벨에서 단일 실행 보장
- DB 카운터는 flock 내부에서만 읽기/쓰기하므로 경쟁 조건 없음
- supabase-js 제약에 무관하게 동작
```

### 데이터 해상도와 DB 저장 전략

**모든 타임스탬프는 UTC로 저장. 표시 시 KST 변환.**

```
DB 세션 타임존: UTC (Supabase 기본값, 변경하지 않음)

수집 시 truncate:
  시간별: collected_at = date_trunc('hour', NOW() AT TIME ZONE 'UTC')
  일별:   collected_at = date_trunc('day', NOW() AT TIME ZONE 'Asia/Seoul')
                         AT TIME ZONE 'Asia/Seoul'
          → KST 기준 "오늘"의 시작(00:00 KST = 전일 15:00 UTC)을 UTC로 저장

이유:
  - 시간별은 타임존 무관 (UTC 시간 경계)
  - 일별은 한국 사용자 기준 "하루"여야 하므로 KST 날짜 경계 사용
  - TIMESTAMPTZ로 저장하므로 UTC↔KST 변환은 조회 시 자동

예시:
  2026-03-02 08:00 KST에 공포/탐욕 수집 시:
  → collected_at = '2026-03-01T15:00:00Z' (KST 3/2 00:00의 UTC 표현)
  → 같은 날 20:00 KST에 다시 수집해도 같은 collected_at → UNIQUE 위반 → DO UPDATE
```

UNIQUE 제약 `(metric_name, collected_at)`.
일별 소스는 하루에 1행만 저장되므로 시간별 차트에서 평탄 구간이 생기지 않음 (일별 차트에만 사용).

### 수집 Upsert 전략

```
기존: ON CONFLICT DO NOTHING — 초기 오수집 값을 정정할 수 없음

변경: ON CONFLICT DO UPDATE (조건부 upsert)

INSERT INTO onchain_metrics (collected_at, metric_name, value, resolution, metadata)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (metric_name, collected_at)
DO UPDATE SET
  value = EXCLUDED.value,
  metadata = EXCLUDED.metadata,
  created_at = NOW()
WHERE
  -- 이상치가 아닌 값만 덮어쓰기
  (EXCLUDED.metadata IS NULL OR NOT (EXCLUDED.metadata->>'rejected')::boolean)
  -- 기존 값이 이상치였으면 무조건 덮어쓰기
  OR (onchain_metrics.metadata->>'rejected')::boolean;

효과:
  - 정상 값 → 정상 값: 최신 값으로 갱신 (장애 복구/재수집 반영)
  - 정상 값 → 이상치: 덮어쓰지 않음 (기존 정상 값 보호)
  - 이상치 → 정상 값: 덮어쓰기 (복구)
  - 이상치 → 이상치: 덮어쓰기 (최신 이상치 정보)
```

### Whale Alert 한도 소진 시

**MVP에서는 fallback 없이 "데이터 없음" 표시.**

```
한도 소진 시 동작:
1. whale_transactions 테이블에 신규 데이터 추가 중단
2. 대시보드 고래 피드에 "이번 달 데이터 수집 한도 도달" 메시지 표시
3. 기존 수집 데이터는 그대로 표시
4. 다음 달 1일에 카운터 자동 리셋

향후 검토 (트래픽 증가 시):
- Whale Alert 유료 플랜 ($79/월, 3,000회/월)
- 자체 멤풀 모니터링 (풀노드 필요)
```

### MVP에서 제외하는 지표

- **MVRV 비율**: Realized Value를 정확히 계산하려면 풀노드 or Glassnode 유료 필요.
  → **MVP에서 완전 제외.**
- **NVT Ratio**: 정확한 NVT는 온체인 전송량(transaction volume in USD) 데이터 필요.
  CoinGecko가 제공하는 거래량(trading volume)은 거래소 거래량이며 온체인 전송량이 아님.
  이 데이터로 계산한 값을 "NVT"라고 표기하면 지표 오인.
  → **MVP에서 제외.** 4번째 카드는 **멤풀 수수료(Mempool Fees)**로 대체.
  (Mempool.space API로 무료 취득 가능, 네트워크 혼잡도의 직관적 지표)
- 장기보유자(LTH) 정확 수치: Glassnode 유료
  → "1년 이상 미이동 UTXO 비율"로 대체. **표기를 "장기 미이동 비율"로 명확히 구분.**
- 개별 거래소별 넷플로우: CryptoQuant 유료
  → 전체 거래소 합산 넷플로우로 시작

---

## 3. 대시보드 페이지 구조

### 3.1 메인 대시보드 (`/`)

유일한 핵심 페이지. 한 화면에 모든 정보.

```
┌─────────────────────────────────────────────┐
│  시장 상태 신호등 + 자동 요약 (2~3문장)        │
├──────────────────┬──────────────────────────┤
│  거래소 순유입/유출 │  장기 미이동 UTXO 비율    │
│  [7일 미니차트]    │  [7일 미니차트]           │
├──────────────────┼──────────────────────────┤
│  멤풀 수수료       │  공포/탐욕 지수           │
│  [24h 추이 차트]   │  [게이지 차트]            │
├──────────────────┴──────────────────────────┤
│  고래 이동 피드 (최근 24h, 최대 10건)          │
├─────────────────────────────────────────────┤
│  마지막 업데이트: 2026-03-02 14:00 KST       │
│  데이터 출처: CoinGecko, Blockchain.com, ...  │
│  면책 조항 + 쿠키/광고 고지                    │
└─────────────────────────────────────────────┘
```

### 3.2 지표 상세 페이지 (SEO 유입용)

각 지표별 고정 URL. 대시보드 카드 클릭 시 이동.

- `/exchange-netflow` - 거래소 유출입 실시간
- `/whale-tracker` - 고래 지갑 추적
- `/mempool-fees` - 멤풀 수수료 (네트워크 혼잡도)
- `/fear-greed` - 공포 탐욕 지수
- `/utxo-age` - 장기 미이동 UTXO 분포

각 페이지 구성:
- 실시간 차트 (30일/90일/1년)
- 지표 설명 (500자) — 데이터 출처와 계산 방법 명시
- 현재 수치의 의미 (자동 생성 텍스트)
- 관련 지표 링크

### 3.3 용어 해설 페이지 (SEO 롱테일)

- `/glossary/mvrv` - "MVRV 비율이란?"
- `/glossary/nvt` - "NVT Ratio 뜻"
- `/glossary/sopr` - "SOPR 지표 뜻"
- `/glossary/exchange-netflow` - "거래소 유출 의미"
- 등 20~30개

---

## 4. 시장 상태 자동 판정 로직

### 점수 시스템

각 지표별 -1, 0, +1 점수 부여 후 합산. **3개 지표** (멤풀 수수료는 점수에 포함하지 않음 — 방향성 해석이 모호).

```
거래소 넷플로우 (netflow = 유입 - 유출, 양수 = 순유입):
  netflow < -2,000 BTC (순유출) → +1 (축적 — 거래소에서 빠져나감)
  -2,000 ≤ netflow ≤ 2,000     →  0 (중립)
  netflow > 2,000 BTC (순유입)  → -1 (매도 압력 — 거래소로 들어옴)

장기 미이동 UTXO (1년 이상 비율, 7일 변화율):
  변화율 > +0.1%p  → +1 (장기보유 증가)
  -0.1%p ~ +0.1%p  →  0 (중립, 데드존)
  변화율 < -0.1%p  → -1 (장기보유 이탈)
  ※ 데드존 임계값 0.1%p는 과거 데이터 분석 후 조정

공포/탐욕:
  < 25 (극도의 공포)  → +1 (역발상 구간)
  25 ~ 75            →  0
  > 75 (극도의 탐욕)  → -1 (주의)

합산 (범위: -3 ~ +3):
  +2 이상  → 🟢 축적 국면
  -1 ~ +1 → 🟡 중립
  -2 이하  → 🔴 주의 구간
```

### 데이터 이상치 방어

API 오류나 일시적 스파이크가 신호등 점수를 오염시키는 것을 방지:

```
1. 범위 검증 (hard reject):
   - 넷플로우: |값| > 100,000 BTC → 이상치, 이전 값 유지
   - 공포/탐욕: 0~100 범위 벗어남 → 이상치
   - UTXO 비율: 0~100% 범위 벗어남 → 이상치
   - 이상치 감지 시 metadata에 { "rejected": true, "reason": "out_of_range" } 기록

2. 급변 완화 (단일 포인트 스파이크 방어):
   - 넷플로우: 직전 3개 시간별 값의 중앙값(median)과 비교
   - 비교 규칙: |새 값 - median| > max(|median| × 10, 500)
     → 절대 최소 임계치 500 BTC를 추가하여 median이 0 근처일 때 과민 반응 방지
     → median이 100이면 임계치 = max(1000, 500) = 1000
     → median이 10이면 임계치 = max(100, 500) = 500
   - 경고 플래그 데이터는 저장하되 신호등 계산에서 제외 (직전 유효 값 사용)
   - 다음 수집에서 같은 방향이면 유효화 (지속적 변화 = 진짜)

3. 최소 데이터 요건:
   - 점수 계산에 3개 지표 중 2개 이상 유효 데이터 필요
   - 1개 이하만 유효 → 신호등 "⚪ 데이터 부족" 표시
```

### 자동 요약 텍스트 생성

규칙 기반 템플릿 조합 (LLM 미사용, 비용 0원).

```
예시 출력:
"거래소에서 3일 연속 BTC 순유출 중. 1년 이상 미이동 UTXO 비율 상승.
 전반적으로 축적 국면의 신호가 감지됩니다."
```

---

## 5. 트위터 자동화

### 콘텐츠 유형

| 유형 | 빈도 | 트리거 |
|------|------|--------|
| 일일 시장 요약 카드 | 2회/일 (08:00, 20:00) | launchd |
| 고래 이동 속보 | 하루 최대 1회 (대형 이벤트만) | whale-detect → post-tweet |
| 주간 온체인 리포트 | 1회/주 (일요일) | launchd |

### Stale 데이터 게시 방지

트윗 게시 전 **원본 데이터 시점**으로 신선도를 검증:

```
post-tweet.js 실행 시:
1. onchain_metrics에서 각 지표의 최신 행 조회
2. 신선도 판정 기준 (source_timestamp 기반):

   시간별 지표 (넷플로우, 멤풀):
     - metadata.source_timestamp가 있으면 그 값 사용 (API 원본 시점)
     - 없으면 collected_at 사용 (수집 시점, fallback)
     - 현재 시각과의 차이 > 3시간 → stale

   일별 지표 (공포/탐욕, UTXO):
     - metadata.source_date (API 응답의 날짜 필드) 사용
     - 없으면 collected_at 사용
     - KST 기준 "오늘" 또는 "어제"가 아님 → stale

   예시: Alternative.me API 장애로 어제 값이 오늘도 반환되는 경우
     - collected_at = 오늘 08:00 (방금 수집) → 신선해 보임
     - metadata.source_date = 어제 → stale 판정 ✓

3. 시간별 지표 중 1개 이상 stale → 게시 스킵
   일별 지표 전부 stale → 게시 스킵
4. 스킵 시 tweet_log에 status='skipped_stale' + error_message에 어떤 지표가 stale인지 기록
5. 텔레그램 알림
```

collect-data.js는 API 응답에서 원본 타임스탬프를 추출하여 metadata에 저장:

```javascript
// 예시: Alternative.me 공포/탐욕
const response = await fetch('https://api.alternative.me/fng/');
const data = await response.json();
const sourceTimestamp = data.data[0].timestamp; // Unix timestamp

await upsert({
  metric_name: 'fear_greed',
  value: data.data[0].value,
  metadata: {
    source_timestamp: sourceTimestamp,         // API 원본 시점
    source_date: data.data[0].time_until_update ? 'today' : null,
    value_classification: data.data[0].value_classification
  }
});
```

whale-detect.js도 동일:
- Whale Alert 데이터가 8시간 이상 미갱신 시 트윗 발행하지 않음

### 장애 알림 채널

```
macOS Notification Center 단독 의존은 외출 시 감지 불가.

알림 계층:
1. macOS Notification Center (즉시, 로컬)
2. 텔레그램 봇 알림 (즉시, 외부) — 무료, 구현 간단
   → @BotFather로 봇 생성 → 개인 chat_id로 메시지 발송
   → 구현: fetch('https://api.telegram.org/bot{TOKEN}/sendMessage', ...)

알림 대상 이벤트:
  - 트윗 게시 실패 (재시도 포함)
  - stale 데이터로 트윗 스킵
  - Whale Alert 월 한도 90% 도달 (81회)
  - collect-data.js 연속 2회 이상 실패
  - 연속 3시간 이상 데이터 미갱신

텔레그램 봇 토큰:
  .env.local에 TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 추가
```

### 트위터 카드 이미지

@vercel/og로 자동 생성. 대시보드와 동일 데이터.

```
┌──────────────────────────────┐
│  🟢 축적 국면                 │
│                               │
│  거래소: -2,340 BTC (24h)     │
│  장기 미이동: ▲ 증가 중        │
│  멤풀 수수료: 12 sat/vB       │
│  공포/탐욕: 45 (공포)          │
│                               │
│  bitflow.kr                  │
└──────────────────────────────┘
```

### 자동 게시 흐름 (OpenChrome)

```
1. node scripts/post-tweet.js
   a. 데이터 신선도 검증 — source_timestamp 기반 (stale → 스킵 + 텔레그램 알림)
   b. generate-summary.js로 텍스트 생성
   c. /api/og 호출로 이미지 파일 저장

2. OpenChrome으로 twitter.com 열기
3. 새 트윗 작성 버튼 클릭
4. 텍스트 입력
5. 이미지 파일 첨부
6. 게시 버튼 클릭
7. 성공/실패를 tweet_log에 기록
8. 실패 시 텔레그램 알림
```

### 트위터 자동화 장애 대응

**리스크:** 브라우저 자동화는 트위터의 봇 감지에 취약.
계정 잠금, CAPTCHA 챌린지, UI 변경 시 전체 파이프라인 중단.

**대응 계층:**
1. 게시 실패 시 자동 재시도 1회 (5분 후)
2. 재시도 실패 시 텔레그램 + macOS 알림
3. 연속 2회 이상 실패 시 자동 게시 일시 중단 + 수동 확인 필요
4. Fallback: 수동 게시 (post-tweet.js --generate-only 플래그로 텍스트+이미지만 생성)
5. 장기 대안: 트위터 API 유료 플랜 ($100/월) — 트래픽이 수익을 정당화할 때

**현실적 기대:**
트위터 자동화는 "되면 좋고, 안 되면 수동" 수준으로 의존도를 설계.
핵심 가치는 대시보드 자체이며, 트위터는 유입 부스터.

---

## 6. 자동화 파이프라인

### launchd 설정

모든 plist에 공통 환경변수:
```xml
<key>EnvironmentVariables</key>
<dict>
  <key>BITFLOW_HOME</key>
  <string>/Users/yonghun/.openclaw/workspace/bitflow</string>
  <key>TZ</key>
  <string>Asia/Seoul</string>
  <key>PATH</key>
  <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
</dict>
```

**API 키는 환경변수에 포함하지 않음.** 별도 시크릿 관리 참조 (아래 6.2).

| Job | 주기 | 스크립트 |
|-----|------|---------|
| collect-data | 매 1시간 | scripts/collect-data.js |
| post-tweet | 매일 08:00, 20:00 | scripts/post-tweet.js |
| whale-detect | 매일 08:00, 14:00, 20:00 | scripts/whale-detect.js |
| weekly-report | 일요일 10:00 | scripts/weekly-report.js |

### 6.2 시크릿 관리

```
$BITFLOW_HOME/.env.local (gitignore 대상, 파일 권한 600)
├── SUPABASE_URL=https://xxx.supabase.co
├── SUPABASE_SERVICE_KEY=eyJ...
├── WHALE_ALERT_API_KEY=xxx
├── COINGECKO_API_KEY=xxx (무료 티어도 키 필요)
├── TELEGRAM_BOT_TOKEN=xxx
└── TELEGRAM_CHAT_ID=xxx

로드 방식:
  모든 스크립트 진입점에서 dotenv.config({ path: '.env.local' })
  launchd plist에는 키 값을 넣지 않음

키 로테이션:
  - Supabase: 대시보드에서 키 재생성 → .env.local 업데이트
  - Whale Alert/CoinGecko: 계정 설정에서 키 재발급 → .env.local 업데이트
  - 로테이션 주기: 보안 이벤트 발생 시 즉시, 그 외 6개월 권장

백업:
  .env.local은 Git에 커밋하지 않음
  별도 안전한 위치에 수동 백업 (macOS Keychain 또는 1Password 등)
```

### 스크립트 구조

```
scripts/
├── collect-data.js      # API 호출 → Supabase 저장 (upsert, 이상치 검증, source_timestamp 추출)
├── generate-summary.js  # 시장 상태 판정 + 요약 텍스트
├── generate-og.js       # OG 이미지 갱신 트리거
├── post-tweet.js        # source_timestamp 기반 stale 검증 → OpenChrome 게시 (--generate-only 지원)
├── whale-detect.js      # flock 락 + API 한도 체크 → 고래 이동 감지 → 트윗
├── weekly-report.js     # 주간 요약 생성 + 트윗
├── notify.js            # 텔레그램 + macOS 알림 공통 모듈
└── setup.js             # 초기 셋업 (logs/ 생성, launchd 등록, .env.local 검증, macOS 설정 안내)
```

---

## 7. DB 스키마 (Supabase)

```sql
-- 시계열 온체인 데이터 (upsert 수집)
-- 모든 타임스탬프는 UTC 저장. 일별은 KST 날짜 경계를 UTC로 변환하여 저장.
CREATE TABLE onchain_metrics (
  id BIGSERIAL PRIMARY KEY,
  collected_at TIMESTAMPTZ NOT NULL,     -- 시간별: date_trunc('hour', UTC), 일별: KST 날짜 시작의 UTC
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  resolution TEXT NOT NULL DEFAULT 'hourly',  -- 'hourly' | 'daily'
  metadata JSONB,                        -- source_timestamp, 이상치 플래그 등
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_metric_time UNIQUE (metric_name, collected_at)
);

CREATE INDEX idx_metrics_name_time ON onchain_metrics (metric_name, collected_at DESC);

-- 고래 이동 기록
CREATE TABLE whale_transactions (
  id BIGSERIAL PRIMARY KEY,
  tx_hash TEXT UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  amount_btc NUMERIC NOT NULL,
  from_type TEXT,
  from_name TEXT,
  to_type TEXT,
  to_name TEXT,
  tweeted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 트윗 기록
CREATE TABLE tweet_log (
  id BIGSERIAL PRIMARY KEY,
  tweeted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tweet_type TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'success',  -- 'success', 'failed', 'retry_failed', 'skipped_stale'
  error_message TEXT
);

-- Whale Alert API 호출 카운터
CREATE TABLE api_usage (
  id BIGSERIAL PRIMARY KEY,
  api_name TEXT NOT NULL,
  called_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  month_key TEXT NOT NULL,
  success BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_api_usage_month ON api_usage (api_name, month_key);
```

### 수집 Upsert 전략

```sql
INSERT INTO onchain_metrics (collected_at, metric_name, value, resolution, metadata)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (metric_name, collected_at)
DO UPDATE SET
  value = EXCLUDED.value,
  metadata = EXCLUDED.metadata,
  created_at = NOW()
WHERE
  -- 새 값이 정상이면 덮어쓰기
  (EXCLUDED.metadata IS NULL OR NOT COALESCE((EXCLUDED.metadata->>'rejected')::boolean, false))
  -- 또는 기존 값이 이상치면 무조건 덮어쓰기
  OR COALESCE((onchain_metrics.metadata->>'rejected')::boolean, false);
```

효과:
- 정상 → 정상: 최신 값으로 갱신 (장애 복구/재수집 반영)
- 정상 → 이상치: 덮어쓰지 않음 (기존 정상 값 보호)
- 이상치 → 정상: 덮어쓰기 (복구)
- 이상치 → 이상치: 덮어쓰기 (최신 이상치 정보)

### 일별 vs 시간별 소스 구분

```javascript
const METRIC_CONFIG = {
  'btc_price':         { resolution: 'hourly', truncate: 'hour' },
  'exchange_netflow':  { resolution: 'hourly', truncate: 'hour' },
  'mempool_fees':      { resolution: 'hourly', truncate: 'hour' },
  'fear_greed':        { resolution: 'daily',  truncate: 'day_kst' },
  'utxo_age_1y':       { resolution: 'daily',  truncate: 'day_kst' },
};

function getCollectedAt(truncate) {
  const now = new Date();
  if (truncate === 'hour') {
    now.setMinutes(0, 0, 0);
    return now.toISOString();
  }
  if (truncate === 'day_kst') {
    const kst = new Date(now.getTime() + 9 * 3600 * 1000);
    kst.setHours(0, 0, 0, 0);
    return new Date(kst.getTime() - 9 * 3600 * 1000).toISOString();
  }
}
```

---

## 8. SEO 전략

### 타겟 키워드

| 키워드 | 예상 경쟁도 | 페이지 |
|--------|-----------|--------|
| 비트코인 거래소 유출 | 낮음 | /exchange-netflow |
| 비트코인 고래 지갑 추적 | 낮음 | /whale-tracker |
| 비트코인 멤풀 수수료 | 낮음 | /mempool-fees |
| 비트코인 공포 탐욕 지수 | 중간 | /fear-greed |
| MVRV 비율이란 | 낮음 | /glossary/mvrv |
| 비트코인 온체인 데이터 | 중간 | / |

### 기술적 SEO

- 각 페이지 정적 생성 (ISR, 1시간 revalidate)
- JSON-LD Dataset 스키마 적용
- sitemap.xml 자동 생성
- 지표별 고유 meta description (데이터 포함)

---

## 9. 수익화

### 광고 배치

```
[대시보드 상단]  ← 배너 광고 (728x90)
[지표 카드 사이] ← 네이티브 광고 (카드 형태)
[상세 페이지]    ← 본문 중간 + 하단 광고
[사이드바]       ← 거래소 레퍼럴 배너 (선택)
```

### 수익원 우선순위

1. Google AdSense (기본)
2. 거래소 레퍼럴 링크 (바이낸스, 바이빗 등)
3. 향후: 거래소/지갑 직접 광고

---

## 10. 개발 로드맵

### Phase 1: 기반 구축 (Week 1)
- [ ] Next.js 프로젝트 초기화
- [ ] Supabase 프로젝트 생성 + 테이블 세팅 (UNIQUE 제약, resolution 컬럼, UTC 저장, RLS 활성화)
- [ ] .env.local 템플릿 + .gitignore 설정 + 파일 권한 600
- [ ] 데이터 수집 스크립트 (collect-data.js: upsert, KST 날짜 경계, 이상치 검증, source_timestamp 추출)
- [ ] Whale Alert flock 락 + DB 카운터 한도 관리
- [ ] 텔레그램 봇 알림 모듈 (notify.js)
- [ ] API Route: 데이터 조회 엔드포인트
- [ ] Vercel 배포 세팅
- [ ] setup.js: logs/ 생성, launchd 등록, .env.local 검증, FileVault 확인, macOS 설정 안내
- [ ] **자동 테스트:** 이상치 검증 (범위+급변+0근처), 한도 카운터, upsert 4가지 케이스, KST 날짜 경계, stale 판정 (source_timestamp 기반)
- [ ] **Phase 1 수동 검증:** collect-data.js 실행 → DB 저장 → 재실행 시 upsert 동작 → 이상치 reject → flock 동시 실행 방어

### Phase 2: 대시보드 UI (Week 2~3)
- [ ] 메인 대시보드 레이아웃
- [ ] 지표 카드 컴포넌트 (차트 포함)
- [ ] 시장 상태 신호등 + 자동 요약
- [ ] 고래 이동 피드
- [ ] "마지막 업데이트 시각" 표시 (stale 데이터 구분)
- [ ] 반응형 (모바일 대응)
- [ ] 다크 테마 (금융 데이터 사이트 표준)
- [ ] **자동 테스트:** 신호등 점수 계산 유닛 테스트 (경계값, 이상치 입력, 데이터 부족 케이스)
- [ ] **Phase 2 수동 검증:** Lighthouse 성능 80+ / 모바일 깨짐 없음 / 차트 렌더링

### Phase 3: SEO 페이지 (Week 3)
- [ ] 지표 상세 페이지 5개 (데이터 출처/계산 방법 명시)
- [ ] 용어 해설 페이지 10개 (우선)
- [ ] sitemap.xml + robots.txt
- [ ] JSON-LD 구조화 데이터
- [ ] meta 태그 최적화
- [ ] **Phase 3 검증:** Google Rich Results Test 통과 / sitemap 정상 / 각 페이지 meta 확인

### Phase 4: 트위터 자동화 (Week 4)
- [ ] OG 이미지 자동 생성 API
- [ ] 시장 요약 텍스트 생성 (generate-summary.js)
- [ ] source_timestamp 기반 stale 검증 로직
- [ ] OpenChrome 트위터 게시 스크립트 (post-tweet.js + --generate-only 플래그)
- [ ] 게시 실패 시 재시도 + 텔레그램 알림
- [ ] 고래 감지 + 자동 트윗 (whale-detect.js, flock + 한도 체크)
- [ ] launchd plist 설정 (KST 타임존, BITFLOW_HOME 명시)
- [ ] **자동 테스트:** stale 판정 유닛 (source_timestamp 있음/없음/지연), 요약 텍스트 스냅샷
- [ ] **Phase 4 수동 검증:** post-tweet.js 실행 → 트윗 성공 / stale 스킵 / --generate-only / 텔레그램 알림

### Phase 5: 안정화 + 수익화 (Week 5)
- [ ] 에러 핸들링 + 구조화 로깅
- [ ] 데이터 소스 장애 시 graceful degradation (해당 카드 "데이터 없음" 표시)
- [ ] Google AdSense 신청
- [ ] Google Search Console 등록
- [ ] 면책 조항 + 개인정보처리방침 + 쿠키 동의 배너 + 광고 추적 고지
- [ ] FileVault + .env.local 권한 + RLS 최종 확인
- [ ] **Phase 5 검증:** 48시간 무인 운영 테스트 (launchd → DB 적재 → 트윗 게시 → 텔레그램 알림 → 로그)

---

## 11. 리스크 관리

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| API 무료 티어 축소 | 중 | 높음 | 대체 API 목록 사전 확보 |
| 약세장 트래픽 감소 | 높음 | 중 | 50만원 목표라 생존 가능 |
| OpenChrome 트위터 차단 | 중~높음 | 높음 | 재시도→텔레그램 알림→수동 전환 |
| Mac 재부팅/로그아웃 | 중 | 중 | 자동 로그인 + launchd missed job |
| AdSense 승인 거절 | 중 | 중 | 콘텐츠 보강 후 재신청 |
| Whale Alert 한도 초과 | 낮음 | 중 | flock 단일 실행 + DB 카운터. 초과 시 "데이터 없음" |
| stale 데이터 자동 트윗 | 낮음 | 중 | source_timestamp 기반 신선도 검증 + 스킵 |
| .env.local / SERVICE_KEY 유출 | 낮음 | **높음** | FileVault + 권한 600 + RLS + 즉시 키 로테이션 |
| 데이터 이상치 → 오탐 트윗 | 중 | 중 | 범위 검증 + 급변 완화(절대 최소 임계치) + 최소 데이터 요건 |

---

## 12. 법적 고려사항

- 모든 페이지 하단에 면책 조항 표시:
  "본 사이트는 투자 조언을 제공하지 않습니다. 모든 데이터는 참고용이며, 투자 결정은 본인의 책임입니다."
- 개인정보처리방침 (AdSense 필수 요건)
- **쿠키 동의 배너**: AdSense 사용 시 GDPR/한국 개인정보보호법상 쿠키 수집 고지 필요
- **광고 추적 고지**: Google 광고가 사용자 행동을 추적한다는 고지
- 데이터 출처 명시 (API 제공자 attribution)
- 지표 표기 시 정확한 명칭 사용 (추정치를 원본 지표 이름으로 표기하지 않음)

---

## 13. 성공 지표

| 시점 | 지표 | 목표 | 검증 방법 | 미달 시 조치 |
|------|------|------|----------|-------------|
| 1개월 | 트위터 팔로워 | 300명 | Twitter Analytics | 콘텐츠/해시태그 전략 재검토 |
| 3개월 | 일 UV | 200명 | Vercel Analytics | KPI 운영 룰 참조 (UV<200 실험 수행) |
| 3개월 | 트위터 팔로워 | 1,000명 | Twitter Analytics | 포스팅 포맷 변경 실험 2주 |
| 3개월 | 실제 RPM | ₩3,000 이상 | AdSense | 광고 배치 A/B 2주 → 4주 후 재판정 |
| 6개월 | 일 UV | 500명 | Vercel Analytics | 용어 해설 콘텐츠 추가 |
| 6개월 | 애드센스 승인 | 완료 | - | 재신청 or 대안 네트워크 전환 |
| 9개월 | 일 UV | 1,000명 | Vercel Analytics | 커뮤니티 홍보 강화 |
| 12개월 | 월 수익 | 50만원 | AdSense + 레퍼럴 | RPM×PV 역산, 부족분은 레퍼럴로 보전 |
