# 김치프리미엄 트래커 + 텔레그램 알림 봇

실시간 김치프리미엄, 해외 선물 펀딩비, 공포탐욕지수를 한눈에 보고, 텔레그램으로 알림을 받을 수 있는 대시보드입니다.

## 주요 기능

- **실시간 김프**: 업비트 BTC/KRW vs 해외 BTC/USDT + 환율 기반 계산
- **펀딩비**: BTCUSDT 무기한 펀딩비
- **공포탐욕지수**: alternative.me API
- **복합 시그널**: 김프 + 펀딩비 + 공포탐욕 조합 → 과열 / 중립 / 침체
- **텔레그램 봇**: 김프 조회, 임계값 알림 설정

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# .env.local 파일을 편집하여 환경변수 설정
npm run dev
```

앱: `http://localhost:3000`

## 환경변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `TELEGRAM_BOT_TOKEN` | 텔레그램 봇 토큰 | 봇 사용 시 |
| `TELEGRAM_WEBHOOK_SECRET` | 웹훅 인증 시크릿 | 선택 |
| `KV_REST_API_URL` | Vercel KV URL | 알림 기능 사용 시 |
| `KV_REST_API_TOKEN` | Vercel KV 토큰 | 알림 기능 사용 시 |
| `CRON_SECRET` | 스케줄 호출 인증 시크릿 | 외부 스케줄러 사용 시 |

## 텔레그램 봇 설정

### 1. 봇 생성

1. 텔레그램에서 [@BotFather](https://t.me/BotFather)를 검색합니다.
2. `/newbot` 명령으로 새 봇을 생성합니다.
3. 봇 이름과 username을 설정합니다.
4. 발급된 토큰을 `TELEGRAM_BOT_TOKEN`에 설정합니다.

### 2. 웹훅 설정

배포 후 아래 URL을 브라우저에서 호출하여 웹훅을 등록합니다:

```
https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook?url=https://{YOUR_DOMAIN}/api/telegram/webhook&secret_token={YOUR_WEBHOOK_SECRET}
```

- `{YOUR_BOT_TOKEN}`: BotFather에서 발급받은 토큰
- `{YOUR_DOMAIN}`: Vercel 배포 도메인
- `{YOUR_WEBHOOK_SECRET}`: 직접 생성한 시크릿 문자열

### 3. 웹훅 확인

```
https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getWebhookInfo
```

### 4. 봇 명령어

| 명령어 | 설명 |
|--------|------|
| `/start` | 봇 소개 및 사용법 |
| `/kimp` | 현재 김프 즉시 조회 |
| `/alert 3.0` | 김프 3.0% 이상 알림 설정 |
| `/alert off` | 알림 해제 |
| `/status` | 내 알림 설정 현황 |

## Vercel KV 설정

1. [Vercel 대시보드](https://vercel.com/dashboard)에서 프로젝트를 선택합니다.
2. Storage 탭에서 KV 스토어를 생성합니다.
3. 환경변수(`KV_REST_API_URL`, `KV_REST_API_TOKEN`)가 자동으로 연결됩니다.

## 알림 스케줄링

자동 알림 체크는 현재 Vercel Cron을 사용하지 않습니다. 필요하면 외부 스케줄러에서 `/api/cron/check-alerts`를 호출하고 `Authorization: Bearer {CRON_SECRET}` 헤더를 함께 보내면 됩니다.

## 김프 계산식

```
김프(%) = ((업비트_KRW / (해외_USDT × USD_KRW환율)) - 1) × 100
```

## 데이터 소스

| 데이터 | API |
|--------|-----|
| 업비트 BTC/KRW | `api.upbit.com/v1/ticker` |
| 해외 BTC/USDT | `api.coingecko.com/api/v3/simple/price` |
| USD/KRW 환율 | `open.er-api.com/v6/latest/USD` |
| 공포탐욕지수 | `api.alternative.me/fng/` |
| 펀딩비 | `www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP` |

## 기술 스택

- Next.js 14 (App Router)
- Tailwind CSS
- Vercel KV (Redis)
- Telegram Bot API
