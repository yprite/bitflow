# 데스크톱 페이지 수정 계획

> 디자인 철학 문서 기반 현황 분석 및 개선 방향

---

## 0. 전제

이 문서는 "데스크톱을 더 화려하게 만든다"는 계획이 아니다.
반대로, 지금 데스크톱에 남아 있는 과장된 구조, 과도한 컴포넌트 감각, 설명적인 상태 UI를 제거하는 계획이다.

데스크톱은 모바일의 확장판이 아니다.
넓은 화면이 주어졌다고 해서 더 많은 카드, 더 많은 네비게이션, 더 많은 연출을 허용하지 않는다.
오히려 넓은 화면일수록 더 적게 말하고 더 많이 비워야 한다.

다음 셋 중 하나라도 남아 있으면 실패로 본다.

1. 사용자가 먼저 "레이아웃"을 본다.
2. 사용자가 먼저 "컴포넌트"를 본다.
3. 사용자가 먼저 "효과"를 본다.

---

## 1. 현황 진단

### 1-1. 구조 개요

현재 데스크톱 경험은 `/desktop` 경로를 중심으로 별도 분기되어 있으며, 두 개의 레이어가 혼재한다.
하나는 `desktop-shell`, `desktop-rail`, `desktop-surface` 기반의 기존 크롬 구조이고, 다른 하나는 `DesktopMagazinePage`, `DesktopOnchainMagazine`, `DesktopWeeklyMagazine` 기반의 매거진형 레이아웃이다.

| 영역 | 현재 상태 | 문제 |
|------|-----------|------|
| 데스크톱 진입 구조 | `/desktop/*` 전용 경로 분기 | 동일한 데스크톱 안에 크롬형 UI와 매거진형 UI가 공존해 시각 언어가 분산됨 |
| 좌측 레일 네비게이션 | `desktop-chrome.tsx` 기반 고정 레일 | 정보보다 레이아웃 구조가 먼저 보이며, 철학상 "UI는 드러나지 않아야 한다"에 역행 |
| 메인 콘텐츠 | `DesktopSurface`, `DesktopHero`, 카드 묶음 다수 사용 | 카드 개념이 강하게 인지되어 점·텍스트·여백으로 환원되지 않음 |
| 매거진 페이지 | 라이트/다크 섹션, 진행 표시, 스토리텔링 모션 사용 | 서사성은 강하나 철학의 고요함보다 연출이 먼저 느껴질 위험 |
| 상태 표시 | `OrbitalSilence`, `Load Error`, `SignalBadge` 사용 | 로딩/에러/상태를 명시적으로 구분하여 상태의 이원성 원칙과 충돌 |

### 1-2. 디자인 철학 위반 사항

| 위반 항목 | 위치 | 내용 |
|-----------|------|------|
| 컴포넌트 존재감 과다 | `src/components/desktop/desktop-ui.tsx`, `src/components/desktop/desktop-chrome.tsx` | Surface, Hero, StatCard가 UI 단위로 명확히 인지됨 |
| 레이아웃 구조의 과시 | `src/app/globals.css`의 `.desktop-shell`, `.desktop-frame`, `.desktop-rail` | 화면이 정보보다 프레임 구조를 먼저 드러냄 |
| 상태 삼분화 | `src/components/desktop/desktop-realtime-page.tsx`, `src/components/desktop/desktop-indicators-page.tsx` | 로딩, 에러, 정상 상태를 각각 다른 UI로 노출 |
| 모달 사용 | `src/components/desktop/desktop-home-page.tsx`의 `HomeIntroModal` | 정보 제공 목적 모달은 철학상 인라인으로 환원되어야 함 |
| 시그널 과노출 가능성 | `src/components/signal-badge.tsx`, 데스크톱 페이지 전반 | 색과 배지 형태로 상태를 전면화해 "색은 흔적" 원칙을 약화시킴 |
| 모션 중심 진입 | `DesktopMagazinePage`, `AmbientBackground`, `OrbitalSilence` | 첫 인상이 데이터보다 연출로 읽힐 수 있음 |

### 1-3. 데스크톱 특화 문제

1. **두 개의 데스크톱 언어 공존**: 레일 기반 "앱" 구조와 매거진 기반 "에디토리얼" 구조가 동시에 존재한다.
2. **프레임 우선 레이아웃**: 좌측 레일, 프레임, 서피스 경계가 정보보다 먼저 보인다.
3. **과도한 카드화**: 핵심 지표와 설명이 모두 카드 단위로 묶여, 사용자가 정보보다 컴포넌트를 인지한다.
4. **세로 리듬 불균형**: 일부 페이지는 `p-6`, `p-8`, `p-12`가 혼재하고 섹션 간 호흡 규칙이 통일되어 있지 않다.
5. **에러/로딩의 명시적 문장화**: 데스크톱에서는 특히 큰 빈 공간을 활용할 수 있는데도 텍스트 상태 메시지에 의존한다.
6. **스토리텔링과 분석의 경계 불명확**: 매거진형 페이지가 정보 소비보다 스크롤 경험을 우선시하는 구간이 있다.

---

## 2. 수정 계획

### 제거 원칙

이번 수정은 "추가"보다 "삭제"가 우선이다.

- 새 컴포넌트를 만들기 전에 기존 컴포넌트를 없앨 수 있는지 먼저 판단한다
- 새 스타일 토큰을 만들지 않는다
- 새 인터랙션을 도입하지 않는다
- 설명용 UI를 추가하지 않는다
- 장식적 배경, 과한 구분선, 강조용 박스는 기본적으로 제거한다

즉, 데스크톱 개편의 핵심은 "무엇을 더 넣을까"가 아니라 "무엇을 이제는 없앨까"다.

### Phase 1: 데스크톱 시각 언어 단일화

**목표**: 하나의 데스크톱은 하나의 문법만 가진다

#### 1-1. 크롬형과 매거진형의 기준 통합

| 항목 | 현재 | 변경 |
|------|------|------|
| `/desktop` 메인 경험 | 매거진형 중심, 일부 하위는 크롬형 유지 | 모든 데스크톱 페이지를 "정제된 리포트" 문법으로 통합 |
| 데스크톱 레일 | 구조적 내비게이션 프레임 | 정보 보조 장치 수준으로 축소하거나 상단/인라인 네비게이션으로 환원 |
| Surface/Hero/Card | 페이지마다 다르게 조합 | 공통 시각 규칙만 남기고 컴포넌트 존재감 최소화 |

#### 1-2. 레이아웃 원칙 재정의

```
대상: src/components/desktop/desktop-chrome.tsx
대상: src/app/globals.css
대상: src/components/desktop/desktop-ui.tsx
```

- 좌측 레일은 "기능 메뉴"가 아니라 "문맥 안내" 수준으로 축소한다
- 프레임 장식(`desktop-shell`, `desktop-frame`)은 제거하거나 약화한다
- 본문 폭은 읽기 기준으로 고정하되, 섹션 간 리듬으로 구조를 만든다
- 보더는 정보 경계일 때만 사용하고, 레이아웃 존재감을 만들기 위한 선은 제거한다
- "앱처럼 보이는 데스크톱"이 아니라 "정제된 분석 리포트처럼 보이는 데스크톱"으로 방향을 고정한다

#### 1-3. 데스크톱 route 역할 재정의

| 경로 | 역할 | 원칙 |
|------|------|------|
| `/desktop` | 오늘의 종합 브리핑 | 가장 조용한 첫 화면, 한 번에 읽히는 구조 |
| `/desktop/onchain` | 깊이 분석 | 수치와 근거 우선, 서사 최소화 |
| `/desktop/weekly` / `/desktop/weekly/[slug]` | 아카이브형 에디토리얼 | 읽기 흐름 우선, 장식보다 문단 리듬 |
| `/desktop/tools` | 실행 도구/유틸리티 | 기능적이어도 시각 언어는 동일 |
| `/desktop/contact`, `/desktop/privacy`, `/desktop/disclaimer` | 보조/법적 문서 | 가장 저밀도, 가장 적은 장식 |

```
대상: src/app/desktop/page.tsx
대상: src/app/desktop/onchain/page.tsx
대상: src/app/desktop/weekly/page.tsx
대상: src/app/desktop/weekly/[slug]/page.tsx
대상: src/app/desktop/tools/page.tsx
대상: src/app/desktop/contact/page.tsx
대상: src/app/desktop/privacy/page.tsx
대상: src/app/desktop/disclaimer/page.tsx
```

- 각 route는 "페이지 성격"은 다를 수 있어도 동일한 제품의 동일한 질감으로 읽혀야 한다
- 법적/보조 페이지도 예외가 아니다. 간단해야 하지만 따로 노는 UI여서는 안 된다

---

### Phase 2: 정보 구조를 점·텍스트·여백으로 환원

**목표**: 사용자가 컴포넌트를 보지 않고 상태를 보게 한다

#### 2-1. Desktop UI primitives 정비

| 대상 | 현재 | 변경 |
|------|------|------|
| `DesktopSurface` | 카드 역할이 명확함 | 배경/경계/패딩을 절제해 정보 영역으로만 기능 |
| `DesktopHero` | 히어로 블록 자체가 강조됨 | 상단 문맥 소개 영역으로 축소, 과도한 장식 제거 |
| `DesktopStatCard` | 지표별 카드 분절 | 카드보다 행(row) 또는 밀도 블록으로 재구성 |
| `DesktopSectionHeader` | 제목 장치로 사용 | headline + caption 규칙 내로 정리 |

#### 2-2. 카드 묶음에서 리포트 레이아웃으로 전환

```
대상: src/components/desktop/desktop-home-page.tsx
대상: src/components/desktop/desktop-realtime-page.tsx
대상: src/components/desktop/desktop-indicators-page.tsx
대상: src/components/desktop/desktop-onchain-magazine.tsx
```

- 카드 그리드 중심 배치 대신 텍스트 블록 + 지표 행 + 점 기반 요약 구조로 전환한다
- 하나의 섹션 안에서 3개 이상의 시각 스타일을 섞지 않는다
- 핵심 수치는 커지고, 보조 설명은 작아지며, 구획은 여백으로만 나눈다
- 같은 정보를 카드 여러 개로 쪼개지 않는다. 가능하면 한 블록 안에서 읽히게 만든다
- "이건 좋은 카드다"라는 평가를 받으면 실패다. "그냥 정보가 잘 보인다"가 목표다

#### 2-3. 페이지별 구조 목표

| 페이지 | 현재 | 변경 |
|------|------|------|
| `src/components/desktop/desktop-home-page.tsx` | 히어로, 모달, 배지, 로딩 연출 혼재 | 한 개의 조용한 브리핑 화면으로 압축 |
| `src/components/desktop/desktop-realtime-page.tsx` | stat card와 full-screen 상태 화면 중심 | 값, 기준 시점, 짧은 해설이 한 블록 안에서 읽히는 구조 |
| `src/components/desktop/desktop-indicators-page.tsx` | 다열 그리드와 분절된 카드 조합 | 비교가 필요한 경우만 2-3열, 나머지는 세로 리포트 흐름 |
| `src/components/desktop/desktop-onchain-magazine.tsx` | 매거진 연출과 분석 UI가 혼재 | 분석 리포트 중심, 매거진 장치는 보조 수준으로 축소 |
| `src/components/desktop/desktop-weekly-magazine.tsx` | 아카이브/타임라인 연출 우세 | 읽기 리듬 강화, 장식적 구분 최소화 |

#### 2-4. 데스크톱 클래스 치환 기준

| 대상 | 현재 | 변경 |
|------|------|------|
| 대형 패딩 | `p-12` | `p-6` 또는 `p-8`로 축소 |
| 기본 surface 패딩 | `p-6`, `p-8` 혼재 | 기본 `p-6`, 강조 구간만 `p-8` 허용 |
| 블록 간 간격 | `gap-3`, `gap-4` 중심 | `gap-6` 중심으로 재정렬 |
| 대시 지표 그리드 | `xl:grid-cols-4` | 비교 근거가 없으면 `xl:grid-cols-2` 또는 `xl:grid-cols-3` |
| 풀스크린 빈 상태 | `min-h-[620px]` 중심 표시 | 실제 콘텐츠 높이에 맞는 빈 영역으로 축소 |

```
대상: src/components/desktop/desktop-realtime-page.tsx
대상: src/components/desktop/desktop-indicators-page.tsx
대상: src/app/desktop/tools/page.tsx
대상: src/app/desktop/contact/page.tsx
대상: src/app/desktop/privacy/page.tsx
대상: src/app/desktop/disclaimer/page.tsx
```

---

### Phase 3: 상태 표현 단순화

**목표**: 상태는 존재하거나 비어 있다

#### 3-1. 로딩 상태 재정의

| 대상 | 현재 | 변경 |
|------|------|------|
| `OrbitalSilence` | 로딩 전용 연출 컴포넌트 | 점의 출현 또는 고정된 빈 골격으로 대체 |
| 대형 데이터 영역 | 중앙 정렬 로더 표시 | 최종 레이아웃을 먼저 확보하고 데이터만 나중에 채운다 |

#### 3-2. 에러 상태 제거

```
대상: src/components/desktop/desktop-realtime-page.tsx
대상: src/components/desktop/desktop-indicators-page.tsx
대상: src/components/desktop/desktop-magazine-page.tsx
```

- `Load Error` 같은 직접 문구는 제거한다
- 실패한 영역은 빈 상태 또는 마지막 정상 데이터 유지로 처리한다
- 재시도는 시스템이 수행하고 사용자는 방해받지 않는다
- 상태 UI는 친절해 보이려고 하지 않는다. 침묵이 기본이고, 데이터가 돌아오면 다시 나타나면 된다

#### 3-3. 시그널 배지 재설계

- `SignalBadge`는 독립 배지보다 텍스트/점/보더의 미세한 흔적으로 축소한다
- 시그널 색은 값, 점, 짧은 표시선에만 제한적으로 사용한다
- 배경색 기반 상태 강조는 금지한다
- 사용자가 "빨강/파랑 UI"를 기억하면 실패다. 사용자는 상태만 기억해야 한다

#### 3-4. 홈 인트로 모달 인라인화

```
대상: src/components/desktop/desktop-home-page.tsx
대상: src/components/home-intro-modal.tsx
```

- 데스크톱 홈에서 `HomeIntroModal`은 제거한다
- 소개 문구는 히어로 하단 또는 첫 번째 본문 블록의 caption 영역으로 흡수한다
- 데스크톱 첫 화면은 "무언가를 열어봐야 이해되는 구조"가 아니어야 한다

---

### Phase 4: 데스크톱 네비게이션 절제

**목표**: 네비게이션은 길을 알려주되 존재를 주장하지 않는다

#### 4-1. 네비게이션 밀도 조정

| 요소 | 현재 | 변경 |
|------|------|------|
| 좌측 메뉴 항목 수 | 개요, 온체인, 히스토리, 도구, 주간 리포트, 소개 | 상위 정보 구조 기준으로 재분류하거나 일부를 묶는다 |
| 활성 상태 | 링크 자체 스타일 강조 | 현재 위치를 작은 점, 얇은 선, 텍스트 굵기 변화로만 표현 |
| 보조 링크 | 푸터/하단 링크 분산 | 법적/보조 링크는 가장 하단의 저밀도 영역으로 정리 |

#### 4-2. 읽기 흐름 우선 설계

- 사용자의 시선이 "브랜드 → 현재 문맥 → 핵심 데이터" 순으로 흐르도록 재배치한다
- 사이드 레일이 본문보다 먼저 눈에 들어오면 실패로 간주한다
- 데스크톱의 넓은 폭은 정보 확장이 아니라 여백 확장에 우선 사용한다
- 네비게이션은 탐색 실패를 막기 위한 최소한이어야지, 화면의 캐릭터가 되어서는 안 된다

---

### Phase 5: 간격과 폭 체계 정리

**목표**: 넓은 화면일수록 더 많이 비운다

#### 5-1. 데스크톱 spacing scale 고정

| 대상 | 현재 | 변경 |
|------|------|------|
| 섹션 내부 패딩 | `p-5`, `p-6`, `p-8`, `p-12` 혼재 | 16px 또는 24px 두 단계로 제한 |
| 블록 간 간격 | `gap-2`, `gap-3`, `gap-4`, `gap-6` 혼재 | 인라인 8px, 컴포넌트 24px, 섹션 48px 중심으로 정리 |
| 페이지 상하 여백 | 페이지별 상이 | 매거진/리포트 페이지 공통 리듬으로 통일 |

#### 5-2. 읽기 폭 재정의

```
대상: src/components/desktop/*
대상: src/app/desktop/*
```

- 본문 최대 폭을 줄여 "읽는 화면"으로 만든다
- 통계/비교 구간만 예외적으로 넓히고, 기본 문단 영역은 좁게 유지한다
- `xl:grid-cols-*`는 정보 비교가 명확히 필요한 경우에만 허용한다
- "넓은 화면이니까 4열" 같은 기계적 확장은 금지한다. 필요가 증명되지 않으면 1열 또는 2열에 머문다

---

### Phase 6: 모션과 배경의 고요함 회복

**목표**: 연출이 아니라 침묵이 먼저 보여야 한다

#### 6-1. 배경 효과 절제

| 대상 | 현재 | 변경 |
|------|------|------|
| `AmbientBackground` | 전역 배경 레이어 | 존재감이 느껴지지 않을 수준으로 약화하거나 데스크톱 일부 구간에서만 제한 사용 |
| 매거진 다크/라이트 대비 | 섹션 성격을 강하게 규정 | 정보 맥락 전환이 명확한 경우만 유지 |

#### 6-2. 스토리텔링 모션 축소

```
대상: src/components/desktop/desktop-magazine-page.tsx
대상: src/components/desktop/desktop-weekly-magazine.tsx
대상: src/components/desktop/desktop-onchain-magazine.tsx
```

- 페이지 진입 애니메이션은 1회, 짧고 조용하게 제한한다
- 스크롤에 따라 반복적으로 주의를 끄는 모션은 제거한다
- 사용자가 움직임을 기억하지 못할 정도여야 한다
- 연출이 인상에 남으면 과한 것이다. 남아야 할 것은 정보의 온도감이지 모션 자체가 아니다

#### 6-3. 매거진 보조 컴포넌트 절제

```
대상: src/components/desktop/magazine/masthead.tsx
대상: src/components/desktop/magazine/light-section.tsx
대상: src/components/desktop/magazine/dark-section.tsx
대상: src/components/desktop/magazine/floating-progress.tsx
대상: src/components/desktop/magazine/timeline-item.tsx
대상: src/components/desktop/magazine/magazine-footer.tsx
```

- `Masthead`는 브랜딩 장치보다 문맥 소개 장치로 축소한다
- `FloatingProgress`는 읽기 흐름을 방해하면 제거한다
- `LightSection`/`DarkSection`의 대비는 정보 전환 근거가 있을 때만 남긴다
- `TimelineItem`은 장식적 타임라인보다 읽기 가능한 본문 블록으로 느껴져야 한다

---

### Phase 7: 정보 투명성 강화

**목표**: 모든 데이터의 근거는 한 단계 안에 있다

#### 7-1. 출처와 계산 근거 정리

| 대상 | 현재 | 변경 |
|------|------|------|
| 수치 카드/요약 블록 | 값 우선 표시 | 값 아래 또는 인접 위치에 출처/기준 시점/caption 배치 |
| 주간/온체인 분석 | 서사 중심 설명 | 핵심 수치의 계산 근거 링크 또는 짧은 근거 라인 추가 |

#### 7-2. 툴팁 의존 제거

- hover에만 의존하는 설명은 인라인 caption으로 이동한다
- 데스크톱에서도 "숨겨진 설명"보다 "항상 보이는 짧은 근거"를 우선한다

---

## 3. 제거 대상 명시

아래 항목은 "검토"가 아니라 기본적으로 제거 또는 약화 대상이다.

| 대상 | 조치 방향 |
|------|-----------|
| `desktop-shell`, `desktop-frame` | 프레임 존재감 제거 |
| `desktop-rail` | 축소 또는 재구성 |
| `DesktopSurface`의 강한 카드 감각 | 약화 |
| `DesktopHero`의 장식적 존재감 | 축소 |
| `DesktopStatCard` 남발 | 행 기반 정보 구조로 전환 |
| `SignalBadge`의 독립 배지성 | 제거 또는 미세 표현으로 축소 |
| `HomeIntroModal` | 인라인 전환 |
| `OrbitalSilence`의 명시적 로딩 연출 | 제거 또는 대체 |
| 강한 다크/라이트 섹션 전환 | 최소화 |
| "Load Error" 문구 중심 상태 화면 | 제거 |

---

## 4. 수정 우선순위

| 순위 | Phase | 영향도 | 난이도 | 근거 |
|------|-------|--------|--------|------|
| 1 | Phase 1: 시각 언어 단일화 | 높음 | 높음 | 데스크톱 전체의 방향을 결정하는 기준점 |
| 2 | Phase 2: 정보 구조 환원 | 높음 | 중간 | 철학 위반을 직접 줄이고 대부분의 화면 품질에 영향 |
| 3 | Phase 3: 상태 표현 단순화 | 높음 | 중간 | 로딩/에러/시그널의 톤을 근본적으로 바꿈 |
| 4 | Phase 5: 간격과 폭 체계 | 중간 | 낮음 | 넓은 화면의 인상을 빠르게 개선 가능 |
| 5 | Phase 4: 네비게이션 절제 | 중간 | 중간 | 데스크톱 구조의 존재감을 낮추는 핵심 작업 |
| 6 | Phase 6: 모션/배경 절제 | 중간 | 중간 | 고요함 회복에 중요하나 기능 영향은 제한적 |
| 7 | Phase 7: 정보 투명성 강화 | 중간 | 낮음 | 철학 완성도를 높이는 마감 단계 |

---

## 5. 수정 대상 파일 목록

### 핵심 파일 (필수 수정)

| 파일 | 수정 내용 |
|------|-----------|
| `src/components/desktop/desktop-chrome.tsx` | 데스크톱 네비게이션/프레임 존재감 축소 |
| `src/components/desktop/desktop-ui.tsx` | Surface/Hero/StatCard primitive 재정의 |
| `src/app/globals.css` | `.desktop-*` 레이아웃 및 시각 토큰 절제 |
| `src/components/desktop/desktop-home-page.tsx` | 메인 데스크톱 홈의 정보 구조 재배치 |
| `src/components/desktop/desktop-magazine-page.tsx` | 매거진 메인 연출/상태 표현 절제 |
| `src/components/desktop/desktop-realtime-page.tsx` | 로딩/에러/카드 구조 단순화 |
| `src/components/desktop/desktop-indicators-page.tsx` | 지표 그리드와 상태 표현 정리 |
| `src/components/desktop/desktop-onchain-magazine.tsx` | 온체인 분석 페이지 리포트화 |
| `src/components/signal-badge.tsx` | 시그널 표현 축소 또는 대체 |
| `src/components/home-intro-modal.tsx` | 데스크톱에서 인라인 설명 구조로 전환 |

### 영향 파일 (연쇄 수정)

| 파일 | 검토 이유 |
|------|-----------|
| `src/app/desktop/page.tsx` | 진입 구조 단순화 여부 검토 |
| `src/app/desktop/onchain/page.tsx` | 데스크톱 온체인 페이지 연결 방식 점검 |
| `src/app/desktop/weekly/page.tsx` | 주간 리포트 아카이브 문법 정리 |
| `src/app/desktop/weekly/[slug]/page.tsx` | 개별 리포트 상세 페이지 리듬 정리 |
| `src/app/desktop/tools/page.tsx` | utility 페이지 패딩/그리드/링크 톤 정리 |
| `src/app/desktop/contact/page.tsx` | 보조 페이지의 장식 최소화 |
| `src/app/desktop/privacy/page.tsx` | 보조 페이지의 위계/간격 정리 |
| `src/app/desktop/disclaimer/page.tsx` | 법적 페이지의 저밀도 문법 정리 |
| `src/components/desktop/desktop-weekly-magazine.tsx` | 매거진 문법과 데스크톱 공통 문법 정합성 확인 |
| `src/components/desktop/magazine/masthead.tsx` | 매거진 첫인상 과장 여부 점검 |
| `src/components/desktop/magazine/light-section.tsx` | 구획 대비 강도 점검 |
| `src/components/desktop/magazine/dark-section.tsx` | 다크 섹션 사용 근거 재검토 |
| `src/components/desktop/magazine/floating-progress.tsx` | 존재 이유 검증 또는 제거 |
| `src/components/desktop/magazine/timeline-item.tsx` | 타임라인 장식성 축소 |
| `src/components/desktop/magazine/magazine-footer.tsx` | 보조 링크 톤 정리 |
| `src/components/motion/ambient/AmbientBackground.tsx` | 전역 배경 존재감 축소 여부 검토 |
| `src/components/motion/storytelling/OrbitalSilence.tsx` | 데스크톱 상태 표현 대체 또는 사용 축소 |

---

## 6. 검증 기준

각 Phase 완료 시 아래 기준으로 검증한다:

- [ ] 첫 화면에서 레일, 프레임, 카드보다 데이터와 문맥이 먼저 보인다
- [ ] `desktop-shell`, `desktop-frame`, `desktop-rail`가 시각적 주인공이 아니다
- [ ] `HomeIntroModal`이 데스크톱 첫 화면 진입 흐름을 가로막지 않는다
- [ ] `Load Error` 같은 직접 상태 문구가 데스크톱 route에 남아 있지 않다
- [ ] `OrbitalSilence`가 중앙 full-screen 로더로 사용되지 않는다
- [ ] `p-12`는 제거되거나 예외 사유가 명확히 문서화된다
- [ ] `xl:grid-cols-4` 이상은 순수 비교 목적 구간 외에 사용하지 않는다
- [ ] 한 화면에서 시그널 색이 과하게 반복되지 않는다
- [ ] 출처, 기준 시점, 계산 근거가 한 단계 안에 닿는다
- [ ] 모션과 배경을 제거해도 화면 품질이 무너지지 않는다
- [ ] `/desktop`, `/desktop/onchain`, `/desktop/weekly`, `/desktop/tools`가 같은 제품의 같은 질감으로 읽힌다

---

## 7. 기대 효과

1. 데스크톱 전체가 하나의 시각 언어로 읽힌다.
2. 사용자는 프레임이 아니라 데이터와 리듬을 먼저 인지한다.
3. 넓은 화면이 "더 많은 카드"가 아니라 "더 많은 여백"으로 작동한다.
4. 로딩/에러/상태가 담담해지며, 제품의 철학과 실제 경험이 일치한다.
5. 매거진적 서사와 분석 도구적 정확성이 같은 톤 안에서 공존한다.

---

## 8. 코드 리뷰 결과 (2026-03-28)

> 디자인 철학 문서 기준으로 현재 데스크톱 코드를 전수 점검한 결과.
> 아래 위반 사항은 "해석의 여지"가 아니라 철학 문서의 명시 규칙에 어긋나는 항목이다.

---

### 8-1. 타이포그래피 위반

철학 허용 스케일: headline 20px, body 14px, data 13px, caption 11px. **이 4단계 외의 크기를 사용하지 않는다.**

| 파일 | 라인 | 현재 크기 | 허용 기준 | 비고 |
|------|------|-----------|-----------|------|
| `desktop-magazine-page.tsx` | 345 | `text-6xl` (60px) | headline 20px | BTC 가격 — 3배 초과 |
| `desktop-magazine-page.tsx` | 378 | `text-4xl` (36px) | headline 20px | 시그널 설명 — 거의 2배 |
| `masthead.tsx` | 32 | `text-[42px]` | headline 20px | 매거진 헤드라인 — 2배 초과 |
| `desktop-ui.tsx` | 51 | `text-[28px]` | headline 20px | DesktopHero 타이틀 |
| `desktop-ui.tsx` | 112 | `text-[22px]` | data 13px 또는 headline 20px | DesktopStatCard 값 |
| `desktop-ui.tsx` | 133 | `text-[18px]` | body 14px | DesktopTextCard 타이틀 |
| `desktop-ui.tsx` | 159 | `text-[18px]` | body 14px | DesktopLinkCard 타이틀 |
| `desktop-ui.tsx` | 202 | `text-[24px]` | headline 20px | DesktopEmptyState 타이틀 |
| `indicator-card.tsx` | 42 | `text-2xl` (24px) | data 13px | 지표 값 표시 |
| `desktop-weekly-report-view.tsx` | 123 | `text-[18px]` | body 14px | NewsCard 타이틀 |
| `desktop-weekly-magazine.tsx` | 57 | `text-xl` (20px) | headline 20px (허용) | 최신호 제목 — 경계선 |
| `desktop-weekly-report-view.tsx` | 202 | `text-[15px]` | body 14px | 서머리 본문 — 비허용 크기 |

**font-weight 위반**: 철학은 Bold와 Regular만 허용한다.

| 위반 값 | 사용 위치 |
|---------|-----------|
| `font-extrabold` | `desktop-magazine-page.tsx:345`, `desktop-magazine-page.tsx:378` |
| `font-medium` | `desktop-ui.tsx:162` |

**letter-spacing 위반**: 철학은 caption에만 `0.02em` 허용. 나머지는 기본값 유지.

| 현재 값 | 사용 위치 | 문제 |
|---------|-----------|------|
| `tracking-[3px]` | `desktop-magazine-page.tsx` 전반 (섹션 kicker) | 절대값 사용, 비허용 |
| `tracking-[0.2em]` | `magazine-layout.tsx:68` (브랜드명) | 비허용 |
| `tracking-[0.18em]` | `desktop-ui.tsx` (.desktop-kicker CSS) | 비허용 |
| `tracking-[0.14em]` | `desktop-chrome.tsx:43`, `floating-progress.tsx:78` | 비허용 |
| `tracking-[-0.04em]` | `masthead.tsx:32` | 비허용 |
| `tracking-[-0.03em]` | `desktop-ui.tsx:51`, `desktop-ui.tsx:112`, `desktop-ui.tsx:202` | 비허용 |
| `tracking-tighter` | `desktop-magazine-page.tsx:345` | Tailwind 프리셋, 비허용 |

**조치**: 모든 타이포는 4단계 스케일로 환원. letter-spacing은 caption 11px에만 `tracking-[0.02em]` 허용. font-weight는 `font-bold`와 기본(Regular)만 사용.

---

### 8-2. 컬러 위반

철학: 시그널 색상은 2개 — `signal-heat` (#e53935)과 `signal-cool` (#1e88e5). **green, yellow은 존재하지 않는다.** 한 화면에 시그널 색상은 동시에 최대 2곳.

| 위반 항목 | 파일 | 내용 |
|-----------|------|------|
| 4-tone 시스템 | `desktop-ui.tsx:8-19` | `positive → dot-blue`, `negative → dot-red`, `neutral → dot-sub`, `accent → dot-accent` — 사실상 4가지 시그널 색 |
| dot-green, dot-yellow 존재 | `tailwind.config.ts` | Tailwind 팔레트에 `dot-green`, `dot-yellow` 정의됨 — 철학상 존재 불가 |
| SignalBar 3색 동시 사용 | `signal-bar.tsx:10-13` | `bg-dot-blue`, `bg-dot-muted`, `bg-dot-red` 동시 노출 — 2곳 제한 위반 |
| 이벤트 색상 3종 | `desktop-magazine-page.tsx:202-208` | `border-l-dot-red`, `border-l-dot-blue`, `border-l-dot-muted` — 이벤트 타입별 색 분리 |
| IndicatorCard 11개 동시 | `desktop-magazine-page.tsx:403-419` | 11개 카드가 각자 tone 색상 보유 — 한 화면에 다수 시그널 색 동시 노출 |
| 배경색 기반 상태 | `desktop-weekly-report-view.tsx:78-80` | ArchiveCard active 상태에 `bg-dot-accent/[0.04]` — 배경색 사용 금지 위반 |
| bg-white/40 | `desktop-ui.tsx` 전반 | 카드 배경이 `bg-white/40` — surface는 `#ffffff`여야 함, 반투명 불가 |
| border 불투명도 변형 | `desktop-ui.tsx` 전반 | `border-dot-border/35`, `/45`, `/60` — 1px solid `border` (#d1d5db) 단일 사용이 원칙 |

**조치**: tone 시스템을 `heat`/`cool`/`(부재)` 3원으로 단순화. `dot-green`, `dot-yellow` 삭제. SignalBar는 점의 밀도/개수로 전환. `bg-white/40` → `bg-white`. border 불투명도 변형 제거.

---

### 8-3. Masthead 과잉 연출

| 위반 항목 | 파일:라인 | 내용 |
|-----------|-----------|------|
| 72vh 최소 높이 | `masthead.tsx:22` | `min-h-[72vh]` — 첫 화면의 72%를 정보가 아닌 여백+장치로 점유 |
| 전체 페이지 3곳 사용 | `desktop-magazine-page.tsx`, `desktop-onchain-magazine.tsx`, `desktop-weekly-magazine.tsx` | 모든 매거진 페이지마다 72vh 마스트헤드 반복 |
| 에디션 + 메타 + 분리선 | `masthead.tsx:23-27` | `magazine-masthead-bar`, `magazine-masthead-divider` — 장식적 헤더 바 구조 |
| py-24 | `masthead.tsx:22` | 96px 상하 패딩 — 간격 스케일(최대 64px) 초과 |

**판단**: Masthead는 "에디토리얼 쇼케이스"로 기능하고 있으며, 정보 전달보다 연출이 우선이다. 철학의 "사용자가 먼저 '효과'를 본다" 실패 조건에 해당.

**조치**: `min-h-[72vh]` 제거. 마스트헤드를 "문맥 안내 헤더"로 축소 — 에디션, 날짜, 현재 가격/헤드라인만 본문 도입 수준으로 배치. 72vh 대신 콘텐츠 높이에 맞춤.

---

### 8-4. 모션 과잉

| 위반 항목 | 파일 | 내용 |
|-----------|------|------|
| ScrollReveal 전역 사용 | `desktop-magazine-page.tsx` 전체 | 거의 모든 요소에 ScrollReveal 적용, 60~80ms 간격 스태거 |
| ScrollReveal 온체인 | `desktop-onchain-magazine.tsx` | 12개 이상의 ScrollReveal, delay 40~500ms 범위 |
| ScrollReveal 위클리 | `desktop-weekly-magazine.tsx` | 아카이브 아이템마다 60ms 간격 캐스케이드 |
| NumberCounter | `desktop-magazine-page.tsx:338-344` | BTC 가격, D-day 카운트 등 숫자 애니메이션 |
| DotAssemblyReveal | `desktop/tools/page.tsx:73,107,150,171` | 4개 섹션에 각각 다른 delay/duration으로 등장 연출 |
| FloatingProgress | 모든 매거진 페이지 | 우측 고정 네비게이션 점 — 스크롤 추적 모션 상시 작동 |
| IntersectionObserver lazy | `desktop-magazine-page.tsx:428-436` | 차트 섹션 lazy load용 observer — 기능적이나 함께 사용되는 ScrollReveal과 중복 |

**철학 기준**: "사용자가 움직임을 기억하지 못할 정도여야 한다." 현재는 스크롤할 때마다 요소가 등장하며, 이것 자체가 "경험"으로 기억된다.

**조치**: ScrollReveal은 페이지 진입 시 above-the-fold 요소에만 1회 허용하고, 스크롤 영역의 반복 등장 모션은 전면 제거. NumberCounter는 정적 텍스트로 대체. DotAssemblyReveal 제거. FloatingProgress는 읽기 흐름 방해 여부 기준으로 존치/제거 판단.

---

### 8-5. 간격 스케일 위반

철학 허용: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

| 위반 값 | 사용 위치 | 문제 |
|---------|-----------|------|
| `py-24` (96px) | `masthead.tsx:22` | 최대 64px 초과 |
| `py-14` (56px) | `light-section.tsx:13`, `dark-section.tsx:13` | 비허용 (48 또는 64여야 함) |
| `py-12` (48px) | `magazine-footer.tsx:15` | 허용 |
| `gap-[3px]` | `signal-bar.tsx:17` | 비허용 (4px여야 함) |
| `p-5` (20px) | `desktop-ui.tsx:130`, `desktop-weekly-report-view.tsx:280`, `magazine-footer.tsx:19` | 비허용 (16 또는 24여야 함) |
| `p-3` (12px) | `desktop/tools/page.tsx:41-53` | 허용 |
| `gap-3` (12px) | `desktop-magazine-page.tsx:249`, `desktop-magazine-page.tsx:403` | 허용 |
| `space-y-5` (20px) | `desktop/tools/page.tsx:33` | 비허용 (16 또는 24여야 함) |
| `space-y-3` (12px) | 다수 | 허용 |
| `mb-3` (12px) | `desktop-magazine-page.tsx:379` | 허용 |
| `mb-4` (16px) | `desktop-magazine-page.tsx:375` | 허용 |
| `mb-6` (24px) | 섹션 kicker 전반 | 허용 |
| `mt-2` (8px) | 다수 | 허용 |

**조치**: `py-24` → `py-16` (64px 한도 내). `py-14` → `py-12` (48px) 또는 `py-16` (64px). `p-5` → `p-4` (16px). `gap-[3px]` → `gap-1` (4px). `space-y-5` → `space-y-6` (24px).

---

### 8-6. 상태 표현 위반

철학: "데이터가 있으면 표시된다. 데이터가 없으면 비워진다. 로딩, 에러, 성공을 구분하지 않는다."

| 위반 항목 | 파일:라인 | 현재 상태 |
|-----------|-----------|-----------|
| 명시적 로딩 메시지 | `desktop-magazine-page.tsx:303-308` | "오늘의 데이터를 정리하는 중입니다." |
| 명시적 에러 메시지 | `desktop-magazine-page.tsx:311-319` | "데이터를 아직 표시할 수 없습니다." |
| 차트 로딩 메시지 | `desktop-magazine-page.tsx:443-445` | "차트 데이터를 정리하는 중입니다." |
| 차트 에러 메시지 | `desktop-magazine-page.tsx:473-476` | "차트 데이터를 불러올 수 없습니다." |
| 히트맵 로딩/안내 | `desktop-magazine-page.tsx:491-493` | "히트맵 데이터 로딩 중..." / "스크롤하여 데이터 로드" |
| 빈 이벤트 메시지 | `desktop-magazine-page.tsx:214` | "예정된 이벤트가 없습니다" |
| 빈 리포트 메시지 | `desktop-weekly-magazine.tsx:68` | "최신 리포트가 없습니다" |
| DesktopEmptyState | `desktop-ui.tsx:191-207` | `No Data` kicker + 제목 + 본문의 3단 빈 상태 연출 |

**조치**: 로딩/에러 분기를 제거하고, 최종 레이아웃 골격을 먼저 렌더한 뒤 데이터만 나중에 채운다. 빈 상태는 해당 영역이 비어 있는 것 자체로 표현. "스크롤하여 데이터 로드" 같은 행동 유도 문구 삭제.

---

### 8-7. 컴포넌트 존재감

철학: "컴포넌트는 존재하지 않는다. 점, 여백, 텍스트만 존재한다. 사용자가 '이건 카드다'라고 느끼는 순간 실패다."

| 위반 항목 | 파일 | 내용 |
|-----------|------|------|
| desktop-surface ::before | `globals.css:16-24` | 좌측 2px accent 바 + 상하 border — 카드 존재감을 만드는 장식 |
| DesktopHero 2-column grid | `globals.css` (.desktop-hero) | `grid-template-columns: 1fr 280px` — "사이드바가 있는 히어로 컴포넌트"로 인지됨 |
| DesktopStatCard border+bg | `desktop-ui.tsx:110` | `border border-dot-border/35 bg-white/40` — 명확한 카드 단위 |
| DesktopTextCard border+bg | `desktop-ui.tsx:130` | 동일 — 카드 단위로 인지 |
| NewsCard border+hover | `desktop-weekly-report-view.tsx:115-116` | `border border-dot-border/35 bg-white/40 hover:border-dot-accent/30` |
| ArchiveCard border+active bg | `desktop-weekly-report-view.tsx:77-81` | 활성 상태에서 배경+보더 동시 변경 |
| Tools sidebar 카드 3개 | `desktop/tools/page.tsx:86-102` | 3개의 앵커 카드가 명확한 카드 레이아웃 |
| ToolsGuideContent 3-column | `desktop/tools/page.tsx:40-59` | `dot-grid-sparse` 배경 + border — 장식적 가이드 카드 |
| 풋터 링크 카드 | `magazine-footer.tsx:19` | `desktop-surface block p-5` — 네비게이션을 카드로 감쌈 |

**조치**: `desktop-surface::before`의 좌측 accent 바 제거. 카드 border/bg 최소화하여 여백으로 구획. DesktopHero의 sidebar 패턴 제거. 풋터 링크는 텍스트 링크로 환원.

---

### 8-8. 두 개의 크롬 공존 (미해결)

| 항목 | `desktop-chrome.tsx` | `magazine-layout.tsx` |
|------|---------------------|----------------------|
| 네비 항목 수 | 6개 (개요, 온체인, 히스토리, 도구, 주간 리포트, 소개) | 4개 (개요, 온체인, 주간 리포트, 도구) |
| 레이아웃 방식 | header + main 수직 | fixed topbar + full content |
| 활성 상태 | 텍스트 색상만 변경 | 하단 underline (::after) |
| 컨텍스트 표시 | 없음 | eyebrow + title |
| 사용처 | 일부 하위 경로 (tools 등) | `/desktop` layout으로 모든 route 래핑 |

**현재 상태**: `magazine-layout.tsx`가 `/desktop/layout.tsx`에서 모든 route를 래핑하므로 사실상 MagazineLayout이 주 크롬이다. 그러나 `desktop-chrome.tsx`가 코드에 잔존하며 네비 항목도 불일치.

**조치**: `desktop-chrome.tsx`의 제거 확정. 네비 항목을 4개(개요, 온체인, 주간 리포트, 도구)로 단일화. `/desktop/indicators` redirect가 올바르게 작동하는지 확인.

---

### 8-9. 페이지별 질감 불일치

철학: "각 route는 동일한 제품의 동일한 질감으로 읽혀야 한다."

| 페이지 | 현재 질감 | 불일치 근거 |
|--------|-----------|-------------|
| `/desktop` (매거진) | 72vh 마스트헤드 → LightSection 반복 → 풋터 | 스크롤 매거진 + 풀블리드 섹션 |
| `/desktop/onchain` (매거진) | 72vh 마스트헤드 → 2-column 그리드 → 풋터 | 동일 매거진 문법이나 내부가 카드 그리드 |
| `/desktop/weekly` (매거진) | 72vh 마스트헤드 → 타임라인 → 풋터 | 매거진 + 타임라인 |
| `/desktop/weekly/[slug]` (크롬형) | DesktopHero → DesktopSurface 스택 + 사이드바 | 완전히 다른 문법 — "앱 대시보드" 느낌 |
| `/desktop/tools` (크롬형) | DesktopHero+사이드바 → DesktopSurface 스택 | 앱 대시보드 + DotAssemblyReveal 모션 |
| `/desktop/contact`, `/desktop/privacy`, `/desktop/disclaimer` | 미확인, magazine-content 래핑 추정 | 보조 페이지들의 질감 통일 여부 미검증 |

**가장 심각한 불일치**: `/desktop/weekly/[slug]`과 `/desktop/tools`는 DesktopHero+사이드바+DesktopSurface 스택으로 구성되어 매거진 페이지와 완전히 다른 "앱 UI" 질감을 보인다.

**조치**: 모든 페이지를 "정제된 리포트" 단일 문법으로 통합. `/desktop/weekly/[slug]`의 Hero+사이드바 구조 해체. `/desktop/tools`의 Hero 사이드바와 DotAssemblyReveal 제거.

---

### 8-10. 장식적 요소 잔존

| 항목 | 파일 | 내용 |
|------|------|------|
| `dot-grid-sparse` 배경 | `desktop/tools/page.tsx:41,47,53` | 도구 가이드 카드에 할프톤 점 배경 |
| `magazine-masthead-divider` | `masthead.tsx:25` | 에디션과 메타 사이 장식 분리선 |
| `magazine-indicator-strip` | `desktop-magazine-page.tsx:356-369` | 마스트헤드 하단 지표 띠 — 별도 레이아웃 장치 |
| border-l-[2px] 이벤트 | `desktop-magazine-page.tsx:221` | 이벤트별 좌측 색 바 — 이벤트 타입 강조 장식 |
| border-l-2 최신호 | `desktop-weekly-magazine.tsx:52` | 최신 리포트 좌측 강조선 |
| border-l 타임라인 | `desktop-weekly-magazine.tsx:80` | 아카이브 좌측 연결선 |
| TimelineItem dot | `timeline-item.tsx:14` | 5px 정사각형 점 — 타임라인 장식 |
| ArchiveCard 스타일 분기 | `desktop-weekly-report-view.tsx:77-96` | active/inactive 상태별 전체 스타일 분기 |

**조치**: `dot-grid-sparse` 배경 제거. 장식 분리선/강조선은 여백으로 대체. 타임라인 점은 철학의 "점" 개념에 부합하면 유지하되 크기/밀도 규칙 내로 조정. indicator-strip은 본문 내 인라인 수치로 환원.

---

### 8-11. 수정 우선순위 업데이트

기존 Phase 1-7 순서에 코드 리뷰 결과를 반영한 세부 우선순위:

| 순위 | 작업 | 근거 |
|------|------|------|
| **P0** | 타이포 스케일 통일 (8-1) | 4단계 외 크기가 20곳 이상 — 가장 넓은 위반, 가장 빠른 교정 가능 |
| **P0** | Masthead 72vh 제거 (8-3) | 첫 화면 인상을 결정하며, 연출이 정보를 완전히 가림 |
| **P1** | ScrollReveal 전면 정리 (8-4) | 모든 매거진 페이지에 걸쳐 있어 수정 범위가 넓지만 기계적 제거 가능 |
| **P1** | 상태 표현 단순화 (8-6) | 로딩/에러/빈 상태 분기 제거 — 각 페이지에서 독립적으로 수행 가능 |
| **P1** | 컬러 tone 시스템 단순화 (8-2) | 4-tone → 2-signal 전환은 desktop-ui.tsx 중심으로 파급 |
| **P2** | desktop-chrome.tsx 제거 확정 (8-8) | 미사용 크롬 파일 정리 |
| **P2** | 간격 스케일 정리 (8-5) | 비허용 값 치환 — 기계적 수정 |
| **P2** | 컴포넌트 존재감 약화 (8-7) | surface ::before, border/bg 조합 절제 |
| **P3** | 페이지별 질감 통합 (8-9) | `/desktop/weekly/[slug]`, `/desktop/tools`를 리포트 문법으로 전환 |
| **P3** | 장식 요소 제거 (8-10) | dot-grid, divider, indicator-strip 등 정리 |

---

### 8-12. 검증 체크리스트 추가

기존 검증 기준(섹션 6)에 추가:

- [ ] 모든 텍스트 크기가 20px / 14px / 13px / 11px 중 하나다
- [ ] font-weight가 Bold 또는 Regular만 사용된다
- [ ] letter-spacing이 caption 11px의 `0.02em` 외에 사용되지 않는다
- [ ] 시그널 색상이 `signal-heat`과 `signal-cool` 2개만 존재한다
- [ ] `dot-green`, `dot-yellow` 토큰이 Tailwind 설정에서 제거되었다
- [ ] `bg-white/40`, `border-dot-border/35` 등 불투명도 변형이 제거되었다
- [ ] Masthead의 `min-h-[72vh]`가 콘텐츠 높이 기반으로 변경되었다
- [ ] ScrollReveal이 above-the-fold 1회 외에 사용되지 않는다
- [ ] NumberCounter, DotAssemblyReveal이 제거되었다
- [ ] `desktop-surface::before`의 좌측 accent 바가 제거되었다
- [ ] `/desktop/weekly/[slug]`과 `/desktop/tools`가 매거진 페이지와 동일한 질감이다
- [ ] `desktop-chrome.tsx`가 사용되지 않거나 제거되었다
- [ ] 간격 값이 `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` 스케일만 사용한다
- [ ] 빈 상태에서 "로딩 중", "에러", "데이터 없음" 같은 문구가 노출되지 않는다
