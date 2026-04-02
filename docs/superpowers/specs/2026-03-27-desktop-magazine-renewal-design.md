# Desktop Magazine Renewal — Design Spec

**Date**: 2026-03-27
**Status**: Draft
**Scope**: Desktop pages full renewal — halftone theme preserved, content/layout/UX redesigned

---

## Problem

Desktop pages were built mobile-first, resulting in:
- Wasted space on wide screens (1440px fixed, but content feels sparse)
- Mobile card-list layout ported directly — vertical stacking without leveraging width
- No dashboard-like information density — hard to grasp key metrics at a glance
- Awkward navigation — 280px fixed sidebar feels forced on desktop

## Direction

**Magazine / Editorial** — data presented as storytelling, reading-experience-first. Retro newspaper aesthetic that naturally extends the existing halftone theme.

**Apple-style scroll-driven animations** — sections come alive as the user scrolls. Parallax dot-grid backgrounds, staggered reveal animations, number counter effects.

## Architecture

### Page Structure: 3 Magazine Pages + Supporting Pages

Current 13 routes consolidated into 3 magazine pages. Legal/utility pages preserved as-is.

**Magazine Pages (redesigned):**

| Page | Route | Edition Name | Purpose |
|------|-------|-------------|---------|
| Main Magazine | `/desktop` | Bitflow Daily | All indicators, charts, events, tools in one scroll narrative |
| On-chain Deep Dive | `/desktop/onchain` | Bitflow On-chain | Network regime, metrics, entity flows |
| Weekly Archive | `/desktop/weekly` | Bitflow Weekly | Latest issue highlight + timeline archive |

**Route Migration Table:**

| Existing Route | Fate | Notes |
|---------------|------|-------|
| `/desktop` (home) | → Main Magazine | Redesigned |
| `/desktop/realtime` | → Redirect to `/desktop` | Already redirects, keep as-is |
| `/desktop/indicators` | → Merged into Main Magazine Section 4-5 | Charts + heatmap absorbed |
| `/desktop/onchain` | → On-chain Deep Dive | Redesigned |
| `/desktop/tools` | → Preserved + linked from Main Magazine Section 7 | Section 7 shows tool link cards; clicking navigates to this page. Page itself gets `MagazineLayout` wrapper. |
| `/desktop/weekly` | → Weekly Archive | Redesigned |
| `/desktop/weekly/[slug]` | → Preserved | Report detail view, gets `MagazineLayout` wrapper |
| `/desktop/alert` | → Preserved | Alert setup page, gets `MagazineLayout` wrapper |
| `/desktop/about` | → Accessible via footer | Gets `MagazineLayout` wrapper |
| `/desktop/contact` | → Accessible via footer | Gets `MagazineLayout` wrapper |
| `/desktop/disclaimer` | → Accessible via footer | Gets `MagazineLayout` wrapper |
| `/desktop/privacy` | → Accessible via footer | Gets `MagazineLayout` wrapper |

Supporting pages (`tools`, `weekly/[slug]`, `alert`, `about`, `contact`, `disclaimer`, `privacy`) keep their existing content but switch from `DesktopChrome` to `MagazineLayout` wrapper for consistent minimal navigation.

### Navigation

- **Remove**: 280px fixed sidebar (`DesktopChrome` rail)
- **Add**: Minimal top bar — logo only, no nav links (3 pages accessible via footer cross-links and floating progress bar)
- **Add**: Floating progress bar — thin vertical bar on the right side, appears after scrolling past hero. Shows current section, clickable for smooth scroll navigation. Hidden during hero.

### Animation System

Two primary animation techniques, both driven by scroll position:

1. **Scroll-triggered Reveal** — Elements fade-in + slide-up as they enter the viewport. Staggered delays for grid items (left→right, top→bottom). Used for: indicator cards, event cards, timeline items, tool cards.

2. **Parallax + Number Counter** — Multi-layer dot-grid backgrounds scroll at different speeds. Key numbers animate from 0 to actual value with easing. Used for: hero section, chart sections, entity flow section.

Implementation approach: Intersection Observer API (primary) + `requestAnimationFrame` scroll listener for parallax. CSS `animation-timeline: scroll()` as progressive enhancement where supported. No heavy animation libraries — keep bundle lean.

**`prefers-reduced-motion`**: When enabled, all scroll animations are disabled. Elements render in their final state immediately. Number counters show final values without animation. Parallax layers remain static.

---

## Page Designs

### 1. Main Magazine (`/desktop`)

Full-screen scroll narrative. 8 sections, alternating light/dark backgrounds for rhythm.

#### Section 1: Masthead Hero (viewport 100vh)
- **Layout**: Full-screen, light background (`dot-bg`)
- **Top bar**: "BITFLOW DAILY" + divider line + "Vol. XXX — YYYY.MM.DD"
- **Center**: BTC price (large, 64px+), 24h change
- **Bottom**: Indicator strip — 5 key metrics (KIMP, Fear&Greed, Funding, Dominance, Liquidation) in connected cells
- **Animation**: Parallax 2-layer dot-grid, number counter on price and metrics
- **Scroll-out behavior**: Hero scrolls away naturally (no sticky). As the user scrolls, the hero content gains subtle `translateY` parallax offset (content moves slower than scroll), creating depth. The hero simply scrolls out of view — no collapse or sticky transformation.
- **Background**: `dot-bg` with 2 parallax dot layers (12px sparse, 24px ultra-sparse)

#### Section 2: Today's Headline (scroll reveal)
- **Layout**: Centered text, white background
- **Content**: "Today's Signal" eyebrow → one-sentence market summary (large text) → brief paragraph explanation → signal bar (11 colored segments) + count label
- **Data source**: Reuses existing `data.signal` from `useData()` hook. The one-sentence summary and paragraph are template-generated from signal data (same logic as current `SignalBadge` briefing, not AI-generated). Signal bar is a new visual replacing `SignalBadge` component — same data, different presentation.
- **Animation**: Text fade-in + slide-up, signal bar segments reveal sequentially left→right, briefing text typing effect

#### Section 3: Market Thermometer (staggered reveal + counter)
- **Layout**: "Market Thermometer" eyebrow → 2-column grid of indicator cards
- **Cards**: Each shows indicator name (KR + EN), value (large number), tone label + color
- **Content**: All 11 indicators — Fear&Greed, KIMP, Funding, BTC Dominance, Liquidation, Volume, Stablecoin Supply, Strategy, USDT Premium, Long-Short Ratio, Open Interest
- **Animation**: Cards appear with staggered delay (top→bottom, left→right), numbers count up from 0

#### Section 4: Chart Deep Dive (dark + parallax)
- **Layout**: Dark background transition (`dot-accent`), "Deep Dive Charts" eyebrow
- **Content**:
  - KIMP chart (full width) — `KimpChart` component
  - 2-column grid: Funding rate history (`FundingRateHistoryChart`) + Fear&Greed history (`FearGreedHistoryChart`)
  - KIMP stats summary (`KimpStatsCard`) — displayed as inline stat row below KIMP chart
- **Excluded from main page**: `ExchangeRateChart` and `KimpCorrelationChart` move to `/desktop/tools` (they are analysis tools, not daily briefing data)
- **Animation**: Parallax dot-grid (light dots on dark), chart lines draw-in from left→right
- **Charts**: Reuse existing chart components, restyle for dark background

#### Section 5: BTC Returns Heatmap (full width)
- **Layout**: Light background, "Returns Heatmap" eyebrow
- **Content**: Month × Year heatmap grid, existing component
- **Animation**: Cells fade-in sequentially (top-left → bottom-right), hover popover for detail

#### Section 6: Event Calendar (reveal)
- **Layout**: "Upcoming Events" eyebrow → horizontal card row
- **Cards**: Each event with color-coded left border (blue=FOMC, yellow=CPI, green=ETF), name, date, D-day count
- **Animation**: Cards staggered slide-in from left, D-day number counter

#### Section 7: Tools (reveal)
- **Layout**: "Tools" eyebrow → 3-column card grid
- **Cards**: Link cards to `/desktop/tools` detail page. Each card shows icon + tool name + brief description
- **Tool categories**: Bitcoin utilities (Tx estimator, Fee calculator, Unit converter, UTXO planner, Stuck Tx rescue, Tx tracker), Analysis (Exchange rate chart, KIMP correlation, Arbitrage)
- **Click behavior**: Navigate to `/desktop/tools` page with the relevant tool section scrolled into view
- **Animation**: Scale-in reveal, hover enlarge + shadow

#### Section 8: Footer (dark)
- **Layout**: Dark background, 2 cross-links centered
- **Content**: "온체인 딥다이브 →" | "주간 아카이브 →"
- **Animation**: Fade-in, underline animation on hover

---

### 2. On-chain Deep Dive (`/desktop/onchain`)

Same magazine scroll experience, focused on network data.

#### Section 1: Masthead
- **Format**: Same masthead layout as main
- **Edition**: "BITFLOW ON-CHAIN" + divider + "YYYY.MM.DD · Block #XXX"
- **Headline**: One-sentence regime summary (e.g., "네트워크는 축적 국면")
- **Subhead**: Supporting detail

#### Section 2: Regime Analysis (scroll reveal)
- **Layout**: 2-column cards
- **Content**: Current regime (Accumulation/Distribution/Transition) with description + Whale activity summary
- **Animation**: Fade-in + slide-up

#### Section 3: On-chain Metrics Grid (staggered reveal + counter)
- **Layout**: 3-column grid
- **Content**: Dormancy, Flow pressure, Age bands, Support/Resistance, Fee pressure, Block tempo, Halving countdown, and additional network metrics
- **Animation**: Staggered reveal, number counter

#### Section 4: Entity Flow (dark + parallax)
- **Layout**: Dark background, centered flow diagram
- **Content**: Exchange inflow/outflow + Institution inflow/outflow as circular nodes with connection lines
- **Animation**: Parallax dot-grid, nodes scale-in, connection lines draw animation

#### Section 5: Footer
- **Content**: "← 메인 매거진" | "주간 아카이브 →"

---

### 3. Weekly Archive (`/desktop/weekly`)

Lightest page — focused on reading and browsing past issues.

#### Section 1: Masthead
- **Edition**: "BITFLOW WEEKLY" + divider + "Archive · 총 XX호"
- **Headline**: "주간 리포트 아카이브"

#### Section 2: Latest Issue Highlight
- **Layout**: Large card with left border accent
- **Content**: Volume number, week label, headline, excerpt, "전문 읽기 →" link
- **Animation**: Fade-in

#### Section 3: Archive Timeline (staggered reveal)
- **Layout**: Vertical timeline with left border + dot markers
- **Content**: Past issues listed chronologically — volume, headline, week label, "읽기 →" link
- **Click behavior**: Navigate to `/desktop/weekly/[slug]` — existing report detail view wrapped in `MagazineLayout`
- **Animation**: Items staggered slide-in from top, dots appear sequentially
- **Pagination**: Infinite scroll or "더 보기" button

### Weekly Report Detail (`/desktop/weekly/[slug]`)

Existing `DesktopWeeklyReportView` preserved, re-wrapped in `MagazineLayout`:
- **Top**: Back link "← 아카이브로 돌아가기"
- **Layout**: Full-width article layout (max-width 800px centered) for the report body
- **Sidebar removed**: Current archive sidebar from `DesktopChrome` is replaced by the back link + bottom "다음/이전 호" navigation
- **Bottom**: Prev/Next issue links + "아카이브 전체보기 →" link

---

## Global Elements

### Floating Progress Bar
- **Position**: Fixed, right edge of viewport, 16px inset
- **Appearance**: Thin vertical bar (3px) with section dot markers
- **Behavior**: Appears after scrolling past hero, highlights current section dot, clickable for smooth scroll to target section
- **Hidden**: During hero section (opacity transition in/out)
- **Keyboard**: Tab-focusable dots, Enter/Space to navigate
- **Section labels per page**:
  - Main: Masthead · Headline · Thermometer · Charts · Heatmap · Events · Tools (Footer excluded — not a navigable section)
  - On-chain: Masthead · Regime · Metrics · Entity Flow (Footer excluded)
  - Weekly: Masthead · Latest · Archive

### Shared Masthead Format
All 3 pages use identical masthead structure:
```
[EDITION NAME] ———————————— [meta info]

         [Large headline]
         [Subhead]
```

### Light ↔ Dark Rhythm
Alternating background colors between sections creates visual rhythm:
- Light sections: `dot-bg` (#f5f5f0) or white
- Dark sections: `dot-accent` (#111111) or `dot-text` (#1a1a1a)
- Transition: Smooth background-color transition as section enters viewport

---

## Component Changes

### Remove / Deprecate
- `DesktopChrome` sidebar rail navigation
- `DesktopSurface` existing card container (replace with new section containers)
- `DesktopHero` current hero component
- Current carousel component on home page
- Fixed 1440px width constraint

### Keep / Reuse
- Halftone CSS classes (`dot-grid`, `dot-grid-dense`, `dot-grid-sparse`, `dot-vignette`)
- Color palette (all `dot-*` colors)
- `DotAssemblyReveal` animation (adapt for scroll-trigger)
- `WeatherEffect` (optional, can be used subtly in hero)
- `DataProvider` + `useData()` hook
- `EventTracker`
- Existing chart components (restyle for dark variant)
- `OrbitalSilence` loading spinner

### New Components
- `MagazineLayout` — Full-width scroll container replacing DesktopChrome
- `Masthead` — Shared hero component with edition name, headline, meta
- `ScrollReveal` — Intersection Observer wrapper for fade-in/slide-up animations
- `ParallaxDots` — Multi-layer dot-grid with scroll-linked parallax
- `NumberCounter` — Animated number with count-up effect and easing
- `FloatingProgress` — Right-side progress bar with section markers
- `DarkSection` / `LightSection` — Section wrappers handling background transitions
- `IndicatorCard` — Redesigned metric card for thermometer grid
- `TimelineItem` — Archive timeline entry component

---

## Technical Considerations

### Scroll Animation Implementation
- Primary: Intersection Observer API for scroll-triggered reveals
- Parallax: `requestAnimationFrame` scroll listener (primary), CSS `animation-timeline: scroll()` as progressive enhancement
- Number counter: `requestAnimationFrame` with easing function, triggered by Intersection Observer
- Performance: Use `will-change: transform, opacity` sparingly, prefer CSS transforms over layout-triggering properties
- Browser targets: Chrome 90+, Firefox 100+, Safari 15.4+, Edge 90+

### Layout
- Remove fixed 1440px constraint
- Content sections: `max-width: 1200px` centered with `padding: 0 40px`
- Full-bleed sections (dark backgrounds): Edge-to-edge background, internal content still capped at `max-width: 1200px`
- `min-width: 1024px` for desktop-only experience
- Ultra-wide (2560px+): Full-bleed backgrounds extend naturally, content stays centered at 1200px

### Data Flow
- **Main Magazine**: Client Component using `DataProvider` + `useData()` hook (same as current home page)
- **On-chain page**: Server Component with async data fetching (same as current on-chain page). Wrapped in `DataProvider` via layout but does not use `useData()` — fetches its own data server-side. `DataProvider` wrapper is harmless and keeps the layout simple.
- **Weekly Archive**: Server Component for initial data, client-side for infinite scroll/load-more
- **Chart data**: History charts lazy-load their data when Section 4 enters viewport (Intersection Observer triggers fetch). This prevents loading all chart data upfront on the main magazine page.
- No changes to `DataProvider` or `useData()` hook API
- Chart components receive same data, only visual treatment changes

### States
- **Initial load**: `OrbitalSilence` spinner centered on viewport until `DataProvider` resolves
- **Section load error**: Individual section shows inline error with retry button (does not block other sections)
- **On-chain partial failure**: Each data source renders independently; failed sources show error card while successful ones render normally
- **Empty data**: Use `DesktopEmptyState` (reused) with contextual message

### SEO & Metadata
- Desktop pages continue to set `robots: { index: false, follow: false }` — no indexing change
- Each page gets `Metadata` with title pattern: "Bitflow — {Page Name} (Desktop)"

### Accessibility
- `prefers-reduced-motion`: All animations disabled, elements render in final state
- `NumberCounter`: Renders final value in `aria-label`; animated display is `aria-hidden`
- `FloatingProgress`: `nav` landmark with `aria-label="Page sections"`, dots are focusable buttons with section name labels
- Signal bar segments: `role="img"` with `aria-label` describing the count (e.g., "11개 지표 중 7개 긍정")

### Bundle Impact
- No new animation libraries — all CSS + vanilla JS
- New components are lightweight wrappers
- Net reduction expected: removing carousel, simplifying navigation
