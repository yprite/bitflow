# BitFlow Radar

한국 주식 투자자를 위한 장중 이슈 레이더입니다.

BitFlow는 모든 종목 데이터를 다 쌓아두는 포털이 아니라, 지금 시장에서 놓치면 아쉬운 테마, 종목, 이벤트를 30초 안에 파악하게 만드는 모바일 우선 제품을 목표로 합니다.

현재 홈은 아래 질문에 빠르게 답하도록 설계되어 있습니다.

- 지금 어디에 수급과 관심이 붙는가
- 왜 이 종목과 테마가 움직이는가
- 내일까지 이어질 체크포인트가 있는가

현재 구현 범위는 다음과 같습니다.

- 홈: 실시간 지수, 랭킹, 테마, 일정 중심 시장 레이더
- 종목 상세: `왜 움직이는지`, `다음 체크포인트`, `뉴스/공시 타임라인`
- 팔로우: 관심 테마 저장까지 구현, 알림 연결은 다음 단계

레포에는 이전 비트코인 온체인/자동화 자산도 함께 남아 있습니다. 제품 포지셔닝은 한국 주식 레이더를 우선 기준으로 정리 중입니다.

## Quick Start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

앱: `http://localhost:3000`

## 주요 스크립트

```bash
# 데이터 수집
npm run collect

# 고래 감지 (레거시 온체인 자산)
npm run whale

# 시장 요약 JSON 생성
npm run summary

# OG 카드 이미지 생성 (/api/og 호출)
npm run og

# 트윗 원고 + 이미지 생성만
npm run tweet:generate

# 트윗 게시 시도 (OPENCHROME_POST_CMD 필요)
npm run tweet
```

## 환경변수

`.env.local.example` 기준으로 설정합니다.

- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `WHALE_ALERT_API_KEY`, `COINGECKO_API_KEY`, `DART_API_KEY`
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

`DART_API_KEY`는 선택사항입니다. 설정하면 종목 상세 페이지의 공시 타임라인이 OpenDART 공식 공시로 대체되고, 없으면 뉴스 RSS와 편집 fallback으로 안전하게 동작합니다.

## 현재 우선순위

- 홈 첫 화면에서 제품 가치가 바로 보이게 만들기
- `팔로우 -> 알림 -> 재방문` 루프 붙이기
- 설명 없는 랭킹보다 `왜 움직이는지`와 `내일 일정`을 먼저 보여주기

## SEO 라우트

- 종목 상세: `/stocks/[slug]`
- 지표 상세: `/exchange-netflow`, `/whale-tracker`, `/mempool-fees`, `/fear-greed`, `/utxo-age`
- 용어집 인덱스: `/glossary`
- 용어집 상세: `/glossary/[slug]`
- `sitemap.xml`, `robots.txt` 자동 제공
