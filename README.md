# Bitflow

비트코인 온체인 데이터 대시보드 + 자동 트윗 운영 도구입니다.

## Quick Start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

대시보드: `http://localhost:3000`

## 주요 스크립트

```bash
# 데이터 수집
npm run collect

# 고래 감지 (월 호출 한도 관리 포함)
npm run whale

# 시장 요약 JSON 생성
npm run summary

# OG 카드 이미지 생성 (/api/og 호출)
npm run og

# 트윗 원고 + 이미지 생성만 (권장 초기 검증)
npm run tweet:generate

# 트윗 게시 시도 (OPENCHROME_POST_CMD 필요)
npm run tweet
```

## 환경변수

`.env.local.example` 기준으로 설정합니다.

- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `WHALE_ALERT_API_KEY`, `COINGECKO_API_KEY`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `BITFLOW_OG_ENDPOINT` (기본: `http://127.0.0.1:3000/api/og`)
- `OPENCHROME_POST_CMD`:
  - 트윗 게시를 실제로 수행하는 외부 명령
  - 스크립트는 아래 env를 함께 전달합니다:
    - `BITFLOW_TWEET_TEXT`
    - `BITFLOW_TWEET_TEXT_FILE`
    - `BITFLOW_TWEET_IMAGE`

예시:

```bash
OPENCHROME_POST_CMD='node /absolute/path/to/post-with-openchrome.js'
```

## SEO 라우트

- 지표 상세: `/exchange-netflow`, `/whale-tracker`, `/mempool-fees`, `/fear-greed`, `/utxo-age`
- 용어집 인덱스: `/glossary`
- 용어집 상세: `/glossary/[slug]`
- `sitemap.xml`, `robots.txt` 자동 제공
