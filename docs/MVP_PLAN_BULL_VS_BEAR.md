# 삼성전자 Bull vs Bear MVP 계획서

> 목표: `DAU 100`을 가장 빨리 검증할 수 있는 형태로, 다종목 여론판이 아니라 `삼성전자 단일 전장`부터 시작한다.
> 핵심 원칙: **재미가 최우선**이다. 설문조사가 아니라 도파민이 터지는 참여 경험을 만든다.

---

## 1. 왜 삼성전자부터인가

**한 문장:** 한국 증시에서 설명 비용이 가장 낮고, 매일 의견이 갈리며, 반복 방문 동기를 만들기 가장 쉬운 종목이 삼성전자다.

### 선택 이유

- **대중성**: 보유자와 비보유자 모두 의견이 있다.
- **반복성**: 하루짜리 이벤트 종목이 아니라 매일 해석이 갈린다.
- **확장성**: 반도체, HBM, AI, 환율, 외국인 수급, 지수 흐름과 연결된다.
- **콜드 스타트 대응**: 종목 설명 없이 바로 진입 가능하다.

### 이번 MVP에서 버리는 것

- 다종목 랭킹
- 종목 간 비교
- 자유 텍스트 한마디
- 좋아요 시스템
- 복잡한 실시간 소켓 구조

---

## 2. 문제 정의

현재 제품은 읽기 전용 레이더에 가깝다.
이번 MVP는 `삼성전자에 대해 오늘 사람들은 황소인가 곰인가`를 가장 빠르게 확인하고, 바로 한 표를 던지게 만드는 것이 목적이다.

핵심 전환은 다음이다.

- 읽기 전용 대시보드
- `->`
- 참여형 단일 종목 심리판

---

## 3. 목표 상태 (To-Be)

### MVP 한 문장

사용자는 홈에 들어오자마자 삼성전자의 줄다리기 바를 보고, 한 표를 던지고, 바가 움직이며 내 포지션을 알려주는 경험을 한다.

### 이번 MVP의 핵심 루프

1. 홈 진입 → 줄다리기 바로 "지금 분위기" 즉시 파악
2. 한 번 탭해서 Bull/Bear 투표
3. 바가 흔들리며 즉시 반영 + "역행자입니다 🏴‍☠️" 포지션 피드백
4. 장중에 마음이 바뀌면 의견 변경 → 바가 반대로 밀림
5. 다음 날 방문 → "🔄 반전!" 배지, 변화 확인

### DAU 100 관점의 제품 가설

- 삼성전자 하나만으로도 `매일 볼 이유`를 만들 수 있다.
- 다종목보다 단일 전장이 초반 참여 밀도를 높인다.
- 의견 변경 허용이 장중 재방문 동기를 만든다.
- 재미 장치(줄다리기 바, 극단값 배지, 포지션 피드백)가 투표를 "행위"에서 "경험"으로 바꾼다.

---

## 4. MVP 범위

### 포함

- 삼성전자 단일 종목 Bull/Bear 투표
- 서버 발급 익명 세션 기반 식별
- `KST 시장일` 기준 1인 1표, 같은 날 의견 변경 가능 (UPSERT)
- 줄다리기 바 (spring 애니메이션)
- 극단값 배지 (🔥 압도적 / ⚔️ 팽팽 / 🔄 반전 / ⚡ 급변)
- 투표 후 포지션 피드백 ("다수파에 합류" / "역행자입니다")
- 참여자 수 인격화 카피 ("347명이 싸우는 중")
- 전일 대비 / 최근 1시간 기준 심리 변화 표시
- Bull 근거 vs Bear 근거 편가르기 쟁점 카드
- OG 이미지 자동 생성 (공유/유입용, 기존 `/api/og` 확장)
- 홈 중심 진입 화면
- 장마감 요약 한 줄

### 제외

- 다종목 랭킹
- 댓글/한마디/UGC
- 푸시 알림
- 소셜 로그인
- 복잡한 Realtime 소켓

---

## 5. 재미의 장치 (Phase 1 필수)

기능이 아니라 **재미**가 DAU를 만든다. 아래 요소는 Phase 1에 반드시 포함한다. 모두 구현 비용이 낮다.

### 5.1 줄다리기 바 애니메이션

- 투표하면 바가 0.2초 안에 흔들리며 한쪽으로 밀린다
- 의견 변경하면 바가 반대 방향으로 밀리는 연출
- 숫자만 바뀌는 것과 바가 밀리는 것은 체감이 완전히 다르다
- CSS transition + spring animation으로 구현 (추가 라이브러리 불필요)

### 5.2 극단값 배지

평범한 비율(55:45)은 조용하게 두고, 극단적인 상태만 강조한다. 섹션 10의 감지 규칙을 UI 배지로 표현한다.

| 조건 | 배지 | 느낌 |
|------|------|------|
| 80%+ 쏠림 | 🔥 압도적 황소 / 압도적 곰 | "거의 한쪽이네" |
| 48~52% | ⚔️ 팽팽한 대치 | "한 표가 판을 가른다" |
| 50% 경계 돌파 | 🔄 반전! | "뒤집혔다!" |
| 1시간 내 8%p+ 변동 | ⚡ 급변 중 | "무슨 일이야?" |

### 5.3 투표 후 포지션 피드백

투표 직후 한 줄로 내 위치를 알려준다. API 응답에 `positionLabel` 필드로 포함.

- 다수파(60%+ 진영) 투표 → "다수에 합류했습니다"
- 소수파(40%- 진영) 투표 → "역행자입니다 🏴‍☠️"
- 팽팽할 때(48~52%) 투표 → "당신의 한 표가 판세를 바꿨습니다"

### 5.4 참여자 수 인격화

차가운 데이터를 뜨거운 현장으로 바꾸는 카피. 포맷 함수 하나면 된다.

- "347명 참여" ❌
- "347명이 싸우는 중" ✅
- "오늘 Bull 진영에 212명, Bear 진영에 135명" ✅

### 5.5 투표 버튼 마이크로 인터랙션

- 버튼 누르는 순간 가벼운 pulse 효과
- 결과 반영 시 숫자 카운트업 애니메이션
- 의견 변경 시 이전 선택 해제 → 새 선택 활성화 전환 연출

---

## 6. 제품 구조

### 6.1 메인 화면

홈을 곧 삼성전자 심리판으로 사용한다.

구성 요소:

1. **Hero + 줄다리기 바**
   - `삼성전자 지금 시장은 Bull인가 Bear인가`
   - 줄다리기 바 (Bull 쪽 ← → Bear 쪽, spring 애니메이션)
   - 극단값 배지 (🔥 / ⚔️ / 🔄 / ⚡)
   - "1,247명이 싸우는 중"

2. **원탭 투표 영역**
   - `🐂 황소다` 버튼 / `🐻 곰이다` 버튼
   - 투표 후 → 포지션 피드백 한 줄 ("역행자입니다 🏴‍☠️")
   - 의견 변경 안내 ("마음이 바뀌면 다시 투표할 수 있습니다")
   - 투표/변경 즉시 바 애니메이션 반영

3. **오늘의 전선 (Bull 근거 vs Bear 근거)**
   ```
   🐂 Bull 근거              🐻 Bear 근거
   "HBM 수주 기대감"         "외국인 연속 순매도"
   "반도체 업황 반등 신호"    "환율 리스크 확대"
   ```
   - 같은 정보를 양쪽 진영으로 나눠서 보여준다
   - 뉴스 요약이 아니라 편가르기 형태
   - MVP에서는 운영자가 수동 입력 (DB `tone` 필드로 분류)

4. **심리 변화 영역**
   - 전일 종가 대비 Bull 비율 변화
   - 최근 1시간 변화
   - 반전 여부

5. **재방문 장치**
   - `🔄 오늘 처음 Bear 우세 전환`
   - `🔥 Bull 60% 재돌파`
   - `장마감 기준 Bull 우세 유지`

### 6.2 상세 페이지

상세 페이지는 있어도 되지만 MVP 1차 핵심은 아니다.

- 홈에서 충분히 투표 가능해야 한다.
- 상세는 해설과 근거를 보는 보강 수단으로 둔다.

---

## 7. 데이터 모델

MVP는 삼성전자 하나만 쓰지만, 테이블 구조는 종목 추가가 가능한 수준까지만 일반화한다.

```sql
-- 익명 세션
CREATE TABLE anonymous_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 투표 기록 (의견 변경 시 UPSERT)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_slug TEXT NOT NULL,
  session_id UUID NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('bull', 'bear')),
  market_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stock_slug, session_id, market_date)
);

-- 일별 집계
CREATE TABLE vote_daily_aggregates (
  stock_slug TEXT NOT NULL,
  market_date DATE NOT NULL,
  bull_count INT NOT NULL DEFAULT 0,
  bear_count INT NOT NULL DEFAULT 0,
  total_count INT NOT NULL DEFAULT 0,
  bull_ratio NUMERIC(5,4) NOT NULL DEFAULT 0.5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (stock_slug, market_date)
);

-- 시간 단위 스냅샷
CREATE TABLE vote_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_slug TEXT NOT NULL,
  bucket_at TIMESTAMPTZ NOT NULL,
  bull_count INT NOT NULL,
  bear_count INT NOT NULL,
  total_count INT NOT NULL,
  bull_ratio NUMERIC(5,4) NOT NULL,
  delta_1h NUMERIC(5,4),
  is_flip BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stock_slug, bucket_at)
);

-- 수동 운영용 쟁점 카드
CREATE TABLE briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_slug TEXT NOT NULL,
  market_date DATE NOT NULL,
  slot SMALLINT NOT NULL CHECK (slot BETWEEN 1 AND 3),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  tone TEXT NOT NULL CHECK (tone IN ('bull', 'bear', 'neutral')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stock_slug, market_date, slot)
);

CREATE INDEX idx_votes_stock_market_date ON votes (stock_slug, market_date);
CREATE INDEX idx_snapshots_stock_bucket ON vote_snapshots (stock_slug, bucket_at);
```

### 설계 원칙

- MVP 쿼리는 `stock_slug = 'samsung'`만 사용한다.
- `market_date`는 DB 기본값이 아니라 API 서버가 `Asia/Seoul` 기준으로 계산한다.
- `1인 1표/시장일`을 DB UNIQUE 제약으로 강제한다.
- 의견 변경은 `ON CONFLICT (stock_slug, session_id, market_date) DO UPDATE SET side = $new_side, updated_at = now()`로 처리한다.
- 의견 변경 시 집계도 즉시 갱신한다 (이전 side -1, 새 side +1).
- `voter_id`를 클라이언트가 보내는 구조는 쓰지 않는다.

---

## 8. 사용자 식별 전략

### 원칙

로그인 없이 참여시키되, 클라이언트 fingerprint에 의존하지 않는다.

### 방식

1. 첫 방문 시 서버가 익명 세션 쿠키 발급
2. 쿠키 기준으로 세션 생성 또는 조회
3. 투표 시 서버에서 세션 확인
4. 세션당 종목당 `KST 시장일` 기준 1표, 의견 변경은 UPSERT로 허용
5. 기본 rate limit 적용

### 왜 이렇게 가는가

- localStorage 기반 식별보다 우회가 어렵다.
- 소셜 로그인보다 훨씬 가볍다.
- MVP에서 필요한 수준의 신뢰를 확보할 수 있다.

### 의견 변경 정책

- 같은 시장일 내 Bull ↔ Bear 변경 가능
- 변경 시 집계 즉시 반영 (이전 -1, 새 +1)
- 변경 횟수 제한 없음 (MVP 단계, 어뷰징 시 제한 추가)
- 변경 시 줄다리기 바가 반대로 밀리는 애니메이션

---

## 9. API 설계

```txt
POST /api/samsung/vote
  Body: { side: 'bull' | 'bear' }
  Response: {
    mySide,
    changedFrom,          -- 의견 변경 시 이전 side (null이면 신규)
    bullCount,
    bearCount,
    bullRatio,
    totalCount,
    marketDate,
    positionLabel,        -- "다수에 합류했습니다" / "역행자입니다 🏴‍☠️"
    participantLabel,     -- "347명이 싸우는 중"
    badge                 -- "overwhelming_bull" / "tight_battle" / null
  }

GET /api/samsung/sentiment
  Response: {
    bullCount,
    bearCount,
    bullRatio,
    totalCount,
    mySide,
    marketDate,
    deltaVsPrevClose,
    delta1h,
    isFlip,
    badge,                -- "overwhelming_bull" / "tight_battle" / "flip" / "surge" / null
    participantLabel,     -- "1,247명이 싸우는 중"
    sampleState,          -- "sufficient" / "low" / "empty"
    updatedAt
  }

GET /api/samsung/snapshots?hours=24
  Response: {
    snapshots: [{ bucketAt, bullRatio, totalCount, isFlip }]
  }

GET /api/samsung/briefing
  Response: {
    bullIssues: [{ title, summary }],
    bearIssues: [{ title, summary }],
    closingNote,
    updatedAt
  }
```

### API 원칙

- 홈 렌더에 필요한 읽기 API는 3개 이하여야 한다 (sentiment + briefing, snapshots는 선택적).
- 투표 API 하나에 신규 투표와 의견 변경을 모두 처리한다 (UPSERT).
- 재미 요소 데이터(badge, positionLabel, participantLabel)를 API 응답에 포함시켜 클라이언트 로직을 줄인다.
- briefing 응답은 `bullIssues` / `bearIssues`로 분리하여 편가르기 UI를 바로 렌더할 수 있게 한다.

---

## 10. 업데이트 전략

### 기본 원칙

DAU 100 단계에서는 완전한 Realtime보다 안정성과 단순함이 더 중요하다.

### 권장 방식

| 방식 | 적용 대상 | 이유 |
|------|-----------|------|
| Optimistic UI + Vote response | 투표 직후 내 화면 | 바 애니메이션의 즉시성 확보 |
| Polling (30~60초) | 현재 심리 수치 | 100 DAU 단계에서 충분 |
| Hourly cron | 스냅샷 저장 | 변화 추적 최소 단위 |
| 수동 입력 | 쟁점 카드 / 장마감 요약 | 자동화보다 운영 검증 우선 |

### Realtime을 지금 안 넣는 이유

- 초반엔 동시 접속 밀도가 낮다.
- polling만으로도 제품 가설을 검증할 수 있다.
- 운영 복잡도와 디버깅 비용을 줄일 수 있다.

---

## 11. 심리 변화 감지 규칙

`민심 급변`은 표본 수 기준 없이 쓰면 오탐이 많다.
그래서 이벤트 문구를 아래처럼 제한한다. 이 규칙은 섹션 5.2의 극단값 배지 UI와 1:1로 매핑된다.

### 반전 → 🔄 배지

- 조건: 직전 스냅샷 대비 `bull_ratio`가 50% 경계를 넘음
- 추가 조건: 총투표 수 30 이상

### 급변 → ⚡ 배지

- 조건: 최근 1시간 `bull_ratio` 변화 절대값 8%p 이상
- 추가 조건: 최근 1시간 순증 투표 10 이상

### 팽팽함 → ⚔️ 배지

- 조건: `bull_ratio`가 48~52%
- 추가 조건: 총투표 수 20 이상

### 압도적 → 🔥 배지

- 조건: `bull_ratio`가 80% 이상 또는 20% 이하
- 추가 조건: 총투표 수 20 이상

### 표본 부족

- 조건: 총투표 수 20 미만
- 배지 대신 표본 상태별 UX 적용 (섹션 14 참조)

---

## 12. OG 이미지 & 유입 전략

OG 이미지는 Phase 1 필수다. 공유 안 되면 유입 없고, 유입 없으면 DAU 0이다.

### OG 이미지 자동 생성

기존 `/api/og` 엔드포인트를 확장한다. 완전히 새로 만드는 것이 아니다.

- 링크 공유 시 미리보기: "삼성전자 오늘 Bull 62% | 1,247명 참전 중"
- 줄다리기 바 시각화 포함
- 극단값 배지 포함 시 더 자극적 ("🔥 압도적 황소 82%")

### 장마감 공유 콘텐츠

- 매일 장마감 후 OG 이미지가 그날 최종 심리를 반영
- 운영자가 커뮤니티에 링크 공유 시 미리보기만으로 클릭 유도
- 이미지 안에 서비스 URL 포함

### 유입 채널 계획

1. 기존 BitFlow 홈 트래픽에서 삼성전자 심리판으로 유도
2. 장마감 후 OG 링크를 하루 1회 커뮤니티 공유
3. 장중 공유는 `반전`이나 `급변`이 있을 때만 제한적으로 실행
4. 재방문은 북마크와 직접 방문에 기대고, 알림은 아직 붙이지 않는다

### SEO 최소 세팅

- 기존 stocks/samsung 페이지의 메타 태그 최적화
- "삼성전자 전망", "삼성전자 매수 매도" 키워드 타겟

---

## 13. 구현 페이즈

### Phase 1: 핵심 루프 + 재미 장치 (6~8일)

**목표:** 홈에서 삼성전자 심리를 보고, 투표하고, 재밌는 반응을 받는 경험 완성.

| 태스크 | 설명 | 예상 공수 |
|--------|------|-----------|
| 익명 세션 발급 | 서버 쿠키 + 세션 테이블 | 0.5일 |
| KST 시장일 유틸 | `Asia/Seoul` 기준 날짜 계산 | 0.5일 |
| DB 마이그레이션 | votes + aggregates + briefings | 0.5일 |
| POST /api/samsung/vote | 투표 UPSERT + 의견 변경 + 집계 갱신 + positionLabel | 1일 |
| GET /api/samsung/sentiment | 집계 + badge + participantLabel 조회 | 0.5일 |
| 줄다리기 바 컴포넌트 | spring 애니메이션 + 극단값 배지 | 1일 |
| 투표 컴포넌트 | Bull/Bear 버튼 + Optimistic UI + 포지션 피드백 + 의견 변경 | 1일 |
| OG 이미지 확장 | 기존 `/api/og` 에 심리 데이터 반영 | 0.5일 |
| 참여자 카피 + 배지 로직 | labels.ts + sentiment-rules.ts | 0.5일 |
| 기본 분석 이벤트 | pageview / vote / opinion_change / position_label | 0.5일 |

**검증 기준:**

- 홈에서 바로 투표 가능
- 투표 직후 줄다리기 바가 spring 애니메이션으로 움직임
- 극단값일 때 🔥⚔️🔄⚡ 배지 표시
- 투표 후 "다수파/소수파/판세 변경" 포지션 피드백 표시
- 의견 변경 가능하고 바가 반대로 밀림
- "347명이 싸우는 중" 카피 표시
- 카카오톡/트위터 공유 시 OG 미리보기 정상 노출

---

### Phase 2: 변화 감지 + 재방문 + 운영 루프 (4~5일)

**목표:** 오늘 다시 들어올 이유를 만들고, 실제로 굴릴 수 있는 상태를 만든다.

| 태스크 | 설명 | 예상 공수 |
|--------|------|-----------|
| Hourly snapshot cron | 시간 단위 스냅샷 저장 | 0.5일 |
| 변화 계산 로직 | 반전 / 급변 / 팽팽 / 압도적 계산 | 1일 |
| GET /api/samsung/snapshots | 최근 변화 조회 | 0.5일 |
| 심리 변화 카드 | 전일 대비 / 1시간 대비 / 반전 표시 | 1일 |
| 쟁점 입력 소스 + 편가르기 UI | briefings 테이블 조회 + Bull/Bear 양쪽 레이아웃 | 1일 |
| 장마감 요약 + OG 갱신 | 수동 입력 + 장마감 시점 OG 반영 | 0.5일 |
| rate limit / 로그 점검 | abuse 기본 방어 | 0.5일 |

**검증 기준:**

- 표본 조건을 만족하는 변화만 배지 노출
- Bull 근거와 Bear 근거가 양쪽으로 나뉘어 표시
- 장중 변화 배지가 홈에 반영
- 장마감 공유 시 OG가 최종 심리 반영
- 운영자가 쟁점과 마감 요약을 15분 내 갱신 가능
- rate limit 로그를 확인할 수 있음

---

## 14. Phase 진입 / 중단 기준

### Phase 2 착수 조건

- 내부 QA 완료
- 투표 + 의견 변경 + 배지 + 포지션 피드백 동작 확인
- OG 이미지 공유 테스트 완료
- 운영자가 쟁점 카드 입력 방식을 이해하고 반복 가능

### 기능 확장 중단 조건

- 출시 후 7거래일 평균 DAU가 20 미만
- 홈 방문 대비 투표 전환율이 10% 미만
- 운영자가 쟁점/마감 요약 갱신을 2주 연속 못 지킴

위 조건이면 새 기능을 붙이지 않고, 첫 화면 메시지와 유입 채널부터 수정한다.

---

## 15. 성공 지표

목표는 `기능 완성`이 아니라 `4~6주 내 DAU 100`이다.

### 출시 후 2주 목표

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 7일 평균 DAU | 30~50 | analytics |
| 홈 방문 대비 투표 전환율 | 15~20% | pageview -> vote |
| 일일 투표 수 | 10~20 | votes count |
| 의견 변경률 | 5%+ | changed votes / total votes |
| D1 재방문율 | 10%+ | cohort |
| 운영 갱신 실행률 | 80%+ | trading day checklist |
| OG 링크 클릭 유입 | 일 5+ | referrer 분석 |

### 4~6주 목표

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 7일 평균 DAU | 100 | analytics |
| 홈 방문 대비 투표 전환율 | 20%+ | pageview -> vote |
| 일일 투표 수 | 25~40 | votes count |
| 의견 변경률 | 10%+ | changed votes / total votes |
| D1 재방문율 | 15%+ | cohort |
| 7일 내 2회 이상 방문 비율 | 25%+ | returning users |
| 직접/재방문 유입 비중 | 30%+ | referrer |

### 지표 원칙

- 의견 변경도 투표 수에 포함하지 않는다 (순수 투표자 수 기준).
- 의견 변경률은 별도 보조 지표로 장중 재방문 동기를 검증한다.

### 보조 지표

- 표본 부족 상태 비율
- rate limit 차단 비율
- 의견 변경 남용 비율 (일 3회+ 변경)
- 극단값 배지 노출 수
- 포지션 피드백별 분포 (다수파/소수파/판세변경)

---

## 16. 콜드 스타트 전략

### 원칙

가짜 활기를 만들지 않되, 표본 부족 상태를 **참여 유도 장치**로 활용한다.

### 표본 상태별 UX

| 총투표 수 | 표시 방식 |
|-----------|-----------|
| 0~9명 | 줄다리기 바 숨김. "첫 투표의 주인공이 되세요" + 카운터만 크게 |
| 10~19명 | 줄다리기 바 표시 + "아직 전장이 뜨거워지는 중" |
| 20명+ | 정상 모드. 배지 + 포지션 피드백 + 편가르기 전부 활성화 |

### 허용 가능한 운영 개입

- 오늘의 전선 카드 작성 (Bull/Bear 근거)
- 장마감 요약 문구 작성
- 커뮤니티에 OG 링크 공유

### 하지 말아야 할 것

- 운영진 시드 투표
- 허구의 Bull/Bear 비율 표시
- 실제 사용량보다 과장된 실시간 표현

---

## 17. 운영 계약

### 운영 부담 가정

MVP는 자동화보다 수동 운영을 전제로 한다.

### 일일 운영 루틴

1. 장 시작 전 쟁점 카드 2~3개 입력 (Bull/Bear 분류): 5~10분
2. 장중 업데이트는 큰 변화가 있을 때만 1회: 5분
3. 장마감 요약 한 줄 입력: 5분
4. rate limit / 오류 로그 확인: 5분

### 총 운영 시간

- 거래일 기준 15~25분/일

### 운영 불가 시 대응

- 2주 연속 루틴 유지가 안 되면 장중 업데이트를 제거한다.
- 그래도 어렵다면 쟁점 카드를 하루 1회 고정 업데이트로 축소한다.

---

## 18. 리스크와 대응

### 18.1 어뷰징

| 리스크 | 대응 |
|--------|------|
| 동일 사용자 반복 투표 | 세션 쿠키 + UNIQUE 제약 (의견 변경은 UPSERT) |
| 의견 변경 남용 (Bull↔Bear 반복) | MVP에서는 허용. 일 3회+ 변경은 보조 지표로 모니터링 |
| 쿠키 삭제 후 재진입 | rate limit + 이상 패턴 확인 |
| 봇 요청 | IP / UA 기준 기본 차단 |

### 18.2 지표 착시

| 리스크 | 대응 |
|--------|------|
| 표본이 적은데 비율만 강조 | 표본 상태별 UX 분리 (0~9, 10~19, 20+) |
| 과한 DAU 목표 | 출시 2주 목표와 4~6주 목표 분리 |
| 의견 변경을 투표로 이중 카운트 | 순수 투표자 수 기준, 변경은 별도 지표 |

### 18.3 제품 리스크

| 리스크 | 대응 |
|--------|------|
| 한 종목이라 금방 지루함 | 의견 변경 + 변화 배지 + 전선 카드 + 마감 요약 |
| 투표했는데 재미없음 | 줄다리기 애니메이션 + 포지션 피드백 + 극단값 배지 |
| 공유가 안 됨 | OG 이미지 Phase 1 필수 |
| 운영 피로 누적 | 입력 횟수와 문구 수를 제한 |
| 성급한 확장 욕심 | DAU 기준 전까지 다종목/UGC 금지 |

---

## 19. 파일 구조 계획

```txt
src/
├── app/
│   ├── page.tsx                            # 삼성전자 심리판 홈
│   ├── samsung/page.tsx                    # 선택: 상세 해설 페이지
│   └── api/
│       ├── samsung/
│       │   ├── vote/route.ts               # POST 투표 (UPSERT + 포지션 피드백)
│       │   ├── sentiment/route.ts          # GET 집계 + 배지 + 카피
│       │   ├── snapshots/route.ts          # GET 변화 데이터
│       │   └── briefing/route.ts           # GET 오늘의 전선 (Bull/Bear 분리)
│       └── og/route.tsx                    # GET OG 이미지 (기존 확장)
│
├── components/
│   └── samsung/
│       ├── tug-of-war-bar.tsx              # 줄다리기 바 (spring 애니메이션)
│       ├── bull-bear-vote-panel.tsx         # 투표 버튼 + 포지션 피드백
│       ├── sentiment-badge.tsx             # 극단값/반전/팽팽/압도 배지
│       ├── hero-sentiment-board.tsx        # Hero (바 + 배지 + 카피)
│       ├── sentiment-change-card.tsx       # 심리 변화 카드
│       ├── battle-briefing.tsx             # Bull/Bear 편가르기 전선 카드
│       └── cold-start-prompt.tsx           # 표본 부족 시 참여 유도
│
├── lib/
│   └── samsung/
│       ├── anonymous-session.ts            # 쿠키 기반 세션 관리
│       ├── market-day.ts                   # KST 시장일 계산
│       ├── vote-service.ts                 # 투표 UPSERT + 집계 갱신
│       ├── sentiment-service.ts            # 집계 조회 + 배지 계산
│       ├── snapshot-service.ts             # 스냅샷 저장/조회
│       ├── briefing-service.ts             # 쟁점 조회 (Bull/Bear 분리)
│       ├── sentiment-rules.ts              # 반전/급변/팽팽/압도 규칙
│       └── labels.ts                       # participantLabel, positionLabel 생성
│
└── hooks/
    ├── use-samsung-vote.ts                 # 투표 + 의견 변경 + Optimistic UI
    └── use-samsung-sentiment.ts            # 30~60초 폴링

supabase/
├── migrations/
│   ├── 002_vote_tables.sql
│   ├── 003_snapshot_tables.sql
│   └── 004_briefings.sql
└── functions/
    └── samsung-snapshot-cron/index.ts
```

---

## 20. 일정 요약

| 페이즈 | 기간 | 핵심 산출물 |
|--------|------|-------------|
| Phase 1: 핵심 루프 + 재미 장치 | 6~8일 | 투표 + 줄다리기 바 + 배지 + 포지션 피드백 + 의견 변경 + OG |
| Phase 2: 변화 감지 + 편가르기 + 운영 | 4~5일 | 스냅샷 + 반전/급변 + Bull/Bear 전선 카드 + 장마감 |

**총 예상: 약 2주**

---

## 21. Post-MVP 확장

다음 조건을 만족하기 전에는 검토하지 않는다.

- 최근 14일 중 10일 이상 운영 루틴 유지
- 최근 7일 평균 DAU 100 달성
- 투표 전환율 20% 이상 유지

그 이후 검토 항목:

- SK하이닉스 추가 (테이블 변경 없이 데이터만 추가)
- 삼성전자 vs SK하이닉스 비교 전장
- 한마디 외침 (30자 UGC)
- 소셜 로그인 + 적중률 트래킹
- 푸시/텔레그램 알림
- 다종목 랭킹

---

## 22. 리뷰 요청 포인트

1. 재미 장치(줄다리기 바, 배지, 포지션 피드백)가 Phase 1에 적절히 포함되었는가?
2. 의견 변경 허용이 재방문 장치로 충분한가, 어뷰징 리스크를 과소평가하고 있는가?
3. OG 이미지를 Phase 1에 포함시킨 우선순위가 맞는가?
4. Bull/Bear 편가르기 쟁점 카드가 수동 운영과 양립 가능한가?
5. 2페이즈 구조(기존 3페이즈에서 축소)가 적절한가?
6. 콜드 스타트 시 표본 상태별 UX가 충분한가?
7. 심리 변화 배지 규칙이 너무 느슨하거나 빡빡하지 않은가?
8. Post-MVP로 미룬 범위 중 당겨야 할 것이 있는가?
