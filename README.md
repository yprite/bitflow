# Bitflow — 비트코인 기상청

실시간 김치프리미엄, 펀딩비, 공포탐욕지수 등 11개 시장 지표를 수집·분석하여 복합 시그널로 변환하는 암호화폐 대시보드입니다. 텔레그램 봇을 통한 실시간 알림과 다양한 분석 도구를 제공합니다.

## 핵심 기능

### 실시간 대시보드 (`/`)

11개 지표를 60초 간격으로 수집하여 하나의 복합 시그널(극과열 → 과열 → 중립 → 침체 → 극침체)로 표시합니다.

| 지표 | 설명 |
|------|------|
| 김치프리미엄 | 업비트 BTC/KRW vs 글로벌 BTC/USDT + 환율 기반 |
| 펀딩비 | BTCUSDT 무기한 선물 펀딩비 |
| 공포탐욕지수 | alternative.me API |
| USDT 프리미엄 | 원화 기준 USDT 프리미엄 |
| BTC 도미넌스 | 비트코인 시장 점유율 |
| 롱숏 비율 | 선물 시장 포지션 비율 |
| 미결제약정 | 선물 오픈 인터레스트 |
| 청산량 | 선물 청산 규모 |
| 스테이블코인 시총 | 스테이블코인 총 시가총액 |
| 거래량 변화 | 거래량 증감률 |
| Strategy BTC 보유량 | 기관 비트코인 보유 현황 |

### 지표 히스토리 (`/indicators`)

- 30일간 김프·펀딩비·공포탐욕 추이 차트
- 비트코인 월간/분기별 수익률 히트맵
- 통계 요약 (평균, 최소, 최대, 표준편차, 중앙값)

### 분석 도구 (`/tools`)

- **멀티코인 프리미엄 히트맵**: 50개 이상 코인의 국내외 가격 차이 시각화
- **차익거래 계산기**: 매수·매도 방향별 수익성 분석 (수수료, 출금비, 슬리피지 포함)

### 텔레그램 봇

| 명령어 | 설명 |
|--------|------|
| `/start` | 봇 소개 및 사용법 |
| `/kimp` | 현재 김프 즉시 조회 |
| `/alert 3.0` | 김프 3.0% 이상 알림 설정 |
| `/alert off` | 알림 해제 |
| `/status` | 내 알림 설정 현황 |

### 관리자 대시보드 (`/admin`)

일별 페이지뷰, 디바이스/브라우저 분포, 리퍼러, UTM 캠페인, 기능 사용 통계 등 성장 지표를 확인할 수 있습니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript 5, React 18 |
| 스타일링 | Tailwind CSS 3.4 |
| DB | Supabase (PostgreSQL) |
| 캐시/저장소 | Vercel KV (Redis) |
| 테스트 | Vitest 4 |
| 배포 | Vercel |

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지 및 API
│   ├── page.tsx            # 메인 대시보드
│   ├── indicators/         # 지표 히스토리 페이지
│   ├── tools/              # 히트맵, 차익거래 계산기
│   ├── alert/              # 텔레그램 알림 설정
│   ├── admin/              # 관리자 대시보드
│   └── api/                # API 라우트
│       ├── kimp/           # 11개 지표 통합 엔드포인트
│       ├── indicators/     # 히스토리 데이터
│       ├── multi-kimp/     # 멀티코인 프리미엄
│       ├── cron/           # 스케줄 작업 (김프 수집, 알림 체크)
│       └── telegram/       # 텔레그램 웹훅
├── components/             # React 컴포넌트
│   ├── dashboard.tsx       # 대시보드 컨테이너
│   ├── data-provider.tsx   # 전역 데이터 컨텍스트
│   ├── kimp-card.tsx       # 김프 카드
│   ├── signal-badge.tsx    # 복합 시그널 뱃지
│   ├── motion/             # 도트 기반 애니메이션 시스템
│   └── indicators/         # 차트 컴포넌트
├── lib/                    # 핵심 비즈니스 로직
│   ├── kimp.ts             # 김프 계산 + 11개 지표 수집
│   ├── market-insights.ts  # 시그널 해석 + 투자 인사이트
│   ├── kimp-history.ts     # Supabase 히스토리 관리
│   ├── events.ts           # 이벤트 트래킹
│   └── telegram.ts         # 텔레그램 메시지 포맷
└── supabase/migrations/    # DB 마이그레이션 SQL
```

## 시작하기

### 설치 및 실행

```bash
npm install
cp .env.local.example .env.local
# .env.local 편집 후:
npm run dev
```

`http://localhost:3000`에서 대시보드를 확인할 수 있습니다.

### 환경변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `TELEGRAM_BOT_TOKEN` | 텔레그램 봇 토큰 (BotFather 발급) | 봇 사용 시 |
| `TELEGRAM_WEBHOOK_SECRET` | 웹훅 인증 시크릿 | 선택 |
| `KV_REST_API_URL` | Vercel KV URL | 알림 기능 사용 시 |
| `KV_REST_API_TOKEN` | Vercel KV 토큰 | 알림 기능 사용 시 |
| `SUPABASE_URL` | Supabase 프로젝트 URL | 히스토리/분석 사용 시 |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | 히스토리/분석 사용 시 |
| `ADMIN_SECRET` | 관리자 대시보드 인증키 | 관리자 페이지 사용 시 |
| `CRON_SECRET` | 스케줄 호출 인증 시크릿 | 외부 스케줄러 사용 시 |

### NPM 스크립트

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm start            # 프로덕션 서버
npm run lint         # ESLint 검사
npm test             # 테스트 실행
npm run test:watch   # 테스트 워치 모드
```

## 외부 서비스 설정

### 텔레그램 봇

1. [@BotFather](https://t.me/BotFather)에서 `/newbot`으로 봇을 생성하고 토큰을 발급받습니다.
2. 토큰을 `TELEGRAM_BOT_TOKEN` 환경변수에 설정합니다.
3. 배포 후 웹훅을 등록합니다:

```
https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://{DOMAIN}/api/telegram/webhook&secret_token={WEBHOOK_SECRET}
```

4. 등록 확인:

```
https://api.telegram.org/bot{TOKEN}/getWebhookInfo
```

### Supabase

김프 히스토리 저장과 이벤트 분석에 사용됩니다.

1. [Supabase](https://supabase.com)에서 프로젝트를 생성합니다.
2. `supabase/migrations/` 폴더의 SQL 파일을 순서대로 실행합니다:
   - `001_kimp_history.sql` — 김프 히스토리 테이블
   - `002_events.sql` — 이벤트 트래킹 + 분석 RPC
   - `003_growth_analytics.sql` — 성장 지표
3. `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`를 환경변수에 설정합니다.

### Vercel KV

텔레그램 알림 설정을 저장하는 데 사용됩니다.

1. [Vercel 대시보드](https://vercel.com/dashboard)에서 프로젝트의 Storage 탭으로 이동합니다.
2. KV 스토어를 생성하면 `KV_REST_API_URL`, `KV_REST_API_TOKEN`이 자동 연결됩니다.

## 스케줄링 (Cron)

자동 데이터 수집과 알림 체크를 위해 외부 스케줄러가 필요합니다.

| 엔드포인트 | 주기 | 설명 |
|-----------|------|------|
| `/api/cron/collect-kimp` | 10분 | 김프 히스토리 수집 |
| `/api/cron/check-alerts` | 적절한 간격 | 텔레그램 알림 임계값 체크 |

모든 cron 호출에는 `Authorization: Bearer {CRON_SECRET}` 헤더가 필요합니다.

## 김프 계산식

```
김프(%) = ((업비트_KRW / (글로벌_USDT × USD_KRW환율)) - 1) × 100
```

## 데이터 소스

| 데이터 | API |
|--------|-----|
| 업비트 BTC/KRW | `api.upbit.com/v1/ticker` |
| 글로벌 BTC/USDT | `api.coingecko.com/api/v3/simple/price` |
| USD/KRW 환율 | `open.er-api.com/v6/latest/USD` |
| 공포탐욕지수 | `api.alternative.me/fng/` |
| 펀딩비 | `okx.com/api/v5/public/funding-rate` |
| 멀티코인 시세 | `api.coingecko.com/api/v3/coins/markets` |

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.
