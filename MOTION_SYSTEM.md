# Halftone Motion System — bitflow

> A unified dot-based motion language for a financial intelligence product.
> Every animation speaks the same visual grammar: black circles on white fields,
> varying only in size, density, speed, and spatial behavior.

---

## I. System Overview

### Philosophy

Motion in this product is not decoration. It is **information rendered as behavior**.
A dot that grows is a value increasing. A field that compresses is volatility rising.
A cluster that fades is a signal losing relevance. The user never needs to be told
what the animation means — the meaning is the animation.

The system has three laws:

1. **Dots are data.** Every moving dot represents or responds to a real value.
2. **Stillness is default.** Motion begins only when there is something to communicate.
3. **Fields are environments.** Background dot patterns reflect the state of the world,
   not the state of the interface.

### Emotional Register

| Quality       | Expression                                              |
|---------------|---------------------------------------------------------|
| Intelligence  | Dots anticipate — they begin moving before data arrives |
| Calm          | Slow periods (2–8s), low amplitude, gentle easing       |
| Premium       | Restraint — never more than 40% of dots moving at once  |
| Editorial     | Animations tell a story — they have beginning and end   |

### Rendering Strategy Matrix

| Surface              | Renderer         | Reason                                    |
|----------------------|------------------|-------------------------------------------|
| Page background      | `<canvas>`       | Thousands of dots, 60fps, low overhead    |
| Card backgrounds     | CSS radial-grad  | Static or near-static, zero JS cost       |
| Data indicators      | SVG              | Crisp at any DPI, accessible, animatable  |
| Chart overlays       | `<canvas>` layer | Syncs with chart data, high dot count     |
| Loaders              | SVG              | Small, semantic, works without JS hydrate |
| Hover/focus states   | CSS transitions  | Instant response, GPU-composited          |
| Storytelling panels  | `<canvas>`       | Complex coordinated fields                |

---

## II. Animation Taxonomy

### Layer 0 — Ambient Field (always present, barely noticed)

These run on the page background canvas. They are the "weather" of the product.

#### Tidal Grid
- **What:** The sparse dot background breathes — dots grow and shrink in slow
  radial waves emanating from the viewport center, period 6–8 seconds.
- **Role:** Communicates that the system is alive. Replaces the current static
  `.dot-grid-sparse` CSS pattern with a living version.
- **Placement:** `<body>` background, behind all content.
- **When NOT to use:** Never on cards. Never fast. Never bright.
- **Parameters:** `waveSpeed: 0.0008`, `waveAmplitude: 0.4` (fraction of base radius),
  `baseRadius: 0.6px`, `gridSpacing: 20px`
- **Renderer:** Canvas, single fullscreen layer, `position: fixed`.

#### Data Breathing
- **What:** The ambient grid subtly shifts its wave center toward the KimpCard
  when premium is extreme (>4% or <-2%), as if the field is being gravitationally
  pulled toward the most important data point.
- **Role:** Subconscious attention guidance. The user doesn't notice it directly
  but feels that something important is happening "over there."
- **Placement:** Modifies Tidal Grid behavior. Same canvas.
- **When NOT to use:** When premium is in normal range. Disable if reduced-motion.
- **Parameters:** `attractionThreshold: 4`, `driftSpeed: 0.0002`, `maxOffset: 60px`

#### Regime Shift
- **What:** When the composite signal changes level (과열 ↔ 중립 ↔ 침체), the
  entire ambient field undergoes a slow, dramatic transition: dot spacing compresses,
  wave speed changes, and a subtle density gradient washes across the viewport
  over 3–4 seconds.
- **Role:** The most significant environmental change. Communicates that the
  "weather" has changed — the market regime is different now.
- **Placement:** Ambient canvas, triggered by signal.level state change.
- **When NOT to use:** On initial load (start in current regime silently).
- **Parameters:** `transitionDuration: 3500ms`, `spacingRange: [16px, 24px]`,
  `densityGradientAngle` adapts to signal direction.

---

### Layer 1 — Card-Level Motion (responds to data updates)

These animations live inside or on card surfaces. They fire on data refresh (60s)
or on specific threshold crossings.

#### Signal Emergence
- **What:** When new data arrives (every 60s fetch), dots in the KimpCard's
  DotCluster don't jump to their new sizes. Instead, they emerge: starting as
  invisible points, they grow to their target size with staggered timing
  (30ms offset per dot), easing out.
- **Role:** Makes data arrival feel organic. The information "surfaces" rather
  than "appears."
- **Placement:** KimpCard DotCluster, FundingRateCard gauge dots,
  FearGreedCard indicator dots.
- **When NOT to use:** On initial render (use instant sizing on mount).
- **Parameters:** `stagger: 30ms`, `duration: 400ms`, `easing: cubic-bezier(0.16, 1, 0.3, 1)`

#### Market Pulse
- **What:** A single subtle pulse — a brief 15% size increase and return —
  that ripples through the KimpCard's DotCluster once per data refresh.
  Like a heartbeat confirming fresh data.
- **Role:** "The market is alive. We just checked."
- **Placement:** KimpCard DotCluster only. One pulse per fetch cycle.
- **When NOT to use:** When fetch fails. When data hasn't changed.
- **Parameters:** `pulseScale: 1.15`, `pulseDuration: 600ms`,
  `stagger: 40ms`, `easing: ease-in-out`

#### Threshold Density Shift
- **What:** When kimchi premium crosses a significant threshold (e.g., from
  2.9% → 3.1%, crossing the 3% mark), the dots in the DotCluster briefly
  become denser — an extra dot appears, all dots tighten spacing — then
  settle to the new state.
- **Role:** Marks meaningful boundary crossings. "Something just changed category."
- **Placement:** KimpCard when crossing ±1%, ±3%, ±5% thresholds.
  ArbitrageCalculator when viability flips.
- **When NOT to use:** On normal incremental changes.
- **Parameters:** `thresholds: [1, 3, 5]`, `compressionDuration: 300ms`,
  `settleDuration: 500ms`

#### Insight Bloom
- **What:** When 30-day average badge changes state (above↔below average),
  a cluster of 5–8 tiny dots blooms outward from the badge, fading as they
  travel 20–30px, then disappearing. Like a small firework of information.
- **Role:** Draws momentary attention to a changed insight without being loud.
- **Placement:** KimpCard 30-day badge. SignalBadge on level change.
- **When NOT to use:** On every refresh — only on actual state transitions.
- **Parameters:** `dotCount: 6`, `travelDistance: 25px`, `fadeDuration: 800ms`,
  `spread: 360deg`

#### Volume as Pressure
- **What:** In the PremiumHeatmap bar chart, the dot-pattern fill doesn't just
  have static density. Higher absolute premium values cause dots to be larger
  and more tightly packed, as if pressure is building inside the bar.
  Near zero, dots are sparse and tiny.
- **Role:** Doubles the information channel — direction is shown by position,
  intensity is shown by dot density/size.
- **Placement:** PremiumHeatmap horizontal bars.
- **When NOT to use:** In text-based sections. In the arbitrage calculator.
- **Parameters:** `minDotRadius: 0.8px`, `maxDotRadius: 2px`,
  `minSpacing: 8px`, `maxSpacing: 4px`, threshold at `premium=0`

---

### Layer 2 — Chart Overlay Motion (data visualization enhancement)

These run as a secondary canvas layer on top of the SVG chart, or as
animated SVG elements within the chart.

#### Price Discovery Bloom
- **What:** When the chart receives new data points (right edge extending),
  the newest point starts as a dense cluster of tiny dots that gradually
  coalesce into a single positioned dot. Like the market "discovering" where
  the price should be.
- **Role:** Conceptualizes price discovery — the most recent data is uncertain,
  still forming.
- **Placement:** KimpChart, rightmost data point only.
- **When NOT to use:** On historical points. On period switch (7d↔30d).
- **Parameters:** `clusterCount: 8`, `convergeDuration: 1200ms`,
  `scatterRadius: 6px`, `easing: cubic-bezier(0.34, 1.56, 0.64, 1)`

#### Memory Residue
- **What:** When the chart period switches (7d→30d or vice versa), the old
  polyline and dots don't disappear instantly. They fade to 10% opacity over
  600ms while the new data draws in, creating a brief ghost — the "memory"
  of the previous view.
- **Role:** Continuity. The user understands this is the same data at a
  different scale, not a different dataset.
- **Placement:** KimpChart on period toggle.
- **When NOT to use:** On initial render. On data fetch (only on user-initiated
  period change).
- **Parameters:** `ghostOpacity: 0.1`, `fadeOutDuration: 600ms`,
  `fadeInDuration: 400ms`, `fadeInDelay: 200ms`

#### Dot Trail Afterglow
- **What:** As the user conceptually "moves through time" (data updates pushing
  the chart forward), each data point dot leaves a faint trail — a slightly
  smaller, slightly transparent copy that fades over 2 seconds. The chart
  has a subtle temporal blur.
- **Role:** Emphasizes direction and momentum. Are premiums rising or falling?
  The trails make the answer visceral.
- **Placement:** KimpChart data point dots (the sampled display dots).
- **When NOT to use:** With more than 30 visible dots (performance).
  On static views.
- **Parameters:** `trailCount: 3`, `trailDecay: [0.6, 0.3, 0.1]` (opacity),
  `trailScale: [0.8, 0.6, 0.4]`, `trailDuration: 2000ms`

#### Forecast Uncertainty Haze
- **What:** If the product ever displays projected/forecast values, the dots
  representing uncertain future data are not crisp circles but slightly
  blurred, with a subtle random jitter in position (±1px) that updates
  every 500ms. The further into the future, the more blur and jitter.
- **Role:** Honest uncertainty visualization. "We think the trend continues,
  but we're less sure over there."
- **Placement:** KimpChart, future projection zone (if implemented).
- **When NOT to use:** On historical data. On current data point.
- **Parameters:** `maxBlur: 2px`, `maxJitter: 1.5px`, `jitterInterval: 500ms`,
  `uncertaintyGrowthRate: 0.3` per time step

---

### Layer 3 — Interaction Motion (responds to user input)

These fire on hover, focus, click, or scroll. They must be instant-feeling
(< 200ms initiation) even if the animation itself plays longer.

#### Conviction Lens / Conviction Focus
- **What:** When the user hovers over a coin tile in the PremiumHeatmap,
  the central dot smoothly magnifies (current: CSS scale 1.25). The enhanced
  version: surrounding tiles' dots simultaneously shrink slightly (scale 0.85),
  creating a "lens" effect where the hovered item gains visual weight at the
  expense of its neighbors.
- **Role:** Focus without clicking. "This is the one I'm looking at."
  Simulates the concept of conviction — concentrating attention.
- **Placement:** PremiumHeatmap coin grid tiles.
- **When NOT to use:** On the bar chart section. On mobile (use tap instead).
- **Parameters:** `focusScale: 1.3`, `defocusScale: 0.85`,
  `transitionDuration: 200ms`, `easing: ease-out`

#### Correlation Hover
- **What:** When hovering a coin in the heatmap, if two coins have similar
  premium values (within 0.5%), a faint dotted line appears connecting their
  tiles, and both dots pulse once in sync.
- **Role:** Reveals hidden structure — "these assets are moving together."
- **Placement:** PremiumHeatmap grid, hover state.
- **When NOT to use:** When only 1-2 coins are displayed. On mobile.
- **Parameters:** `correlationThreshold: 0.5` (percentage points),
  `lineOpacity: 0.2`, `lineDotSpacing: 6px`, `pulseDuration: 400ms`

#### Focus Drift
- **What:** When the user clicks a coin tile to select it for the arbitrage
  calculator, the selected tile's dot performs a brief "drift" — it lifts
  up slightly (translateY -2px) and casts a subtle dot shadow beneath it,
  then settles into a "selected" state with a persistent subtle glow ring
  made of tiny dots.
- **Role:** Confirms selection with tactile feedback. The dot "lifts off"
  its surface.
- **Placement:** PremiumHeatmap → ArbitrageCalculator coin selection flow.
- **When NOT to use:** On keyboard navigation (use focus ring instead).
- **Parameters:** `liftDistance: 2px`, `liftDuration: 250ms`,
  `glowDotCount: 12`, `glowRadius: 16px`, `glowDotSize: 1px`

#### Signal vs Noise
- **What:** In the PremiumHeatmap, a toggle or gesture (hold Shift, or a
  dedicated filter button) that dims all coins below a significance threshold
  (e.g., |premium| < 1%) to nearly invisible dots, while coins above the
  threshold grow their dots. The visual field separates into signal and noise.
- **Role:** Analytical tool disguised as animation. Helps the user see what
  matters.
- **Placement:** PremiumHeatmap, optional filter mode.
- **When NOT to use:** As a permanent state. On the chart.
- **Parameters:** `noiseOpacity: 0.15`, `signalScale: 1.4`,
  `threshold: 1.0`, `transitionDuration: 400ms`

---

### Layer 4 — Transition Motion (between states/pages)

#### Constellation Pulse
- **What:** During the 60-second data fetch cycle, if the user is watching,
  the dots in all visible cards perform a synchronized single pulse at the
  moment data starts loading — a brief flash of coordination that says
  "we're all refreshing together."
- **Role:** System-level feedback. "The whole dashboard just took a breath."
- **Placement:** All card DotCluster/gauge elements simultaneously.
- **When NOT to use:** On initial page load. In background tabs.
- **Parameters:** `pulseScale: 1.08`, `pulseDuration: 300ms`,
  `easing: ease-in-out`

#### Breakout Threshold
- **What:** When the kimchi premium crosses a threshold (same thresholds as
  Threshold Density Shift), a horizontal line of dots briefly appears across
  the full width of the KimpCard at the threshold level, then fades.
  The "ceiling" or "floor" becomes momentarily visible.
- **Role:** Spatial marking. "You just crossed this level."
- **Placement:** KimpCard, overlaying the main premium number.
- **When NOT to use:** On gradual changes that don't cross a threshold.
- **Parameters:** `lineWidth: 100%`, `dotSpacing: 8px`, `dotSize: 2px`,
  `fadeInDuration: 200ms`, `visibleDuration: 1500ms`, `fadeOutDuration: 800ms`

#### Candles Dissolve into Field
- **What:** If the product transitions from a traditional chart view to the
  dot-based view (or on initial chart render), candlestick-like rectangular
  shapes briefly appear and then dissolve — each rectangle breaks into
  individual dots that scatter to their data positions on the chart.
- **Role:** Bridges familiar financial visualization with the dot language.
  "This is still a price chart, just expressed differently."
- **Placement:** KimpChart, on first render or view mode switch.
- **When NOT to use:** On data refresh. On period switch (use Memory Residue).
- **Parameters:** `dissolveSteps: 12`, `dissolveDuration: 1500ms`,
  `particlesPerCandle: 8`, `scatterRadius: 15px`

---

### Layer 5 — Storytelling / Conceptual (for landing, empty states, education)

These are larger, more expressive animations that appear in specific contexts
where the user has time and attention to give.

#### Orbital Silence
- **What:** On the empty state (no data yet, initial collection), a single
  dot sits at center. Around it, 3–5 dots orbit in slow ellipses at
  different distances, like a minimal solar system. As data begins arriving,
  the orbital dots slow and move toward data positions.
- **Role:** "We're gathering." Turns waiting into something contemplative
  rather than frustrating.
- **Placement:** Dashboard loading state (replaces current pulsing dots).
- **When NOT to use:** Once data has loaded. As a persistent decoration.
- **Parameters:** `centralDotSize: 4px`, `orbiterCount: 4`,
  `orbitalPeriods: [4s, 5.5s, 7s, 9s]`, `orbitalRadii: [20px, 35px, 50px, 70px]`

#### Liquidity Field
- **What:** A generative dot field where dot density represents liquidity
  depth. Dense clusters = deep liquidity. Sparse areas = thin books.
  Dots drift slowly toward dense areas, like particles attracted to mass.
- **Role:** Educational / landing page concept. Teaches the concept of
  liquidity using the dot vocabulary.
- **Placement:** Landing page hero (if built), or educational tooltip
  for the arbitrage calculator.
- **When NOT to use:** Inside data cards. As background (too complex).
- **Parameters:** `fieldSize: 300x200`, `dotCount: 200`,
  `attractionStrength: 0.002`, `maxSpeed: 0.3px/frame`

#### Volatility Storm
- **What:** A field of dots in orderly grid formation. As a "volatility"
  parameter increases, dots begin to vibrate — first gently, then with
  increasing amplitude — until at maximum volatility the field is chaotic
  brownian motion. The transition from order to chaos is gradual and
  reversible.
- **Role:** Conceptualizes volatility. Could be driven by real funding
  rate or fear/greed data.
- **Placement:** FearGreedCard expanded view (if implemented), or
  educational panel.
- **When NOT to use:** As ambient background. In small card views.
- **Parameters:** `gridSize: 12x8`, `maxDisplacement: 8px`,
  `noiseSpeed: 0.01`, `volatilityMapping: fearGreed inverted (0=storm, 100=calm)`

#### Trend Formation
- **What:** Randomly scattered dots gradually self-organize into a diagonal
  line (uptrend) or downtrend. The alignment happens slowly, with
  stragglers joining last. Then the trend "breaks" and dots scatter,
  re-forming in a new direction.
- **Role:** Conceptualizes trend formation and breakdown.
- **Placement:** Educational context or landing page.
- **When NOT to use:** Inside real charts (would conflict with actual data).
- **Parameters:** `dotCount: 40`, `alignDuration: 4000ms`,
  `holdDuration: 2000ms`, `breakDuration: 800ms`, `reformDelay: 1500ms`

#### Risk Contour
- **What:** Concentric rings of dots, like topographic contour lines.
  Each ring represents a risk level. Rings closer to center are denser
  (higher risk concentration). The rings slowly breathe — expanding and
  contracting with a period linked to real market data.
- **Role:** Risk visualization concept. Makes abstract risk feel spatial.
- **Placement:** Educational overlay for arbitrage calculator, explaining
  fee/slippage risk zones.
- **When NOT to use:** As ambient decoration.
- **Parameters:** `ringCount: 5`, `ringSpacing: 15px`,
  `dotsPerRing: [8, 12, 16, 20, 24]`, `breathPeriod: 5000ms`

#### Correlation Dance
- **What:** Two clusters of dots, each representing a coin. When correlated,
  they sway in sync. When inversely correlated, they sway opposite. When
  uncorrelated, they move independently. Driven by actual premium data
  between selected coin pairs.
- **Role:** Makes correlation tangible. Two things moving together
  is instantly understood.
- **Placement:** PremiumHeatmap detail view or comparison mode.
- **When NOT to use:** For single-coin views.
- **Parameters:** `clusterSize: 12 dots each`, `swayAmplitude: 10px`,
  `swayPeriod: 3000ms`, `correlationSmoothing: 0.8`

#### Order Book Ripple
- **What:** A horizontal line of evenly spaced dots. From one end, a
  "wave" passes through — each dot briefly grows and returns to normal
  size, creating a domino/ripple effect. Speed and amplitude of the
  ripple represent order execution speed and size.
- **Role:** Conceptualizes order book dynamics and execution.
- **Placement:** ArbitrageCalculator, when calculating (brief animation
  while computing result).
- **When NOT to use:** As idle animation.
- **Parameters:** `dotCount: 20`, `rippleSpeed: 60ms/dot`,
  `rippleScale: 1.6`, `rippleDuration: 200ms per dot`

#### Portfolio Rebalance
- **What:** Dots distributed in clusters (representing portfolio weights).
  On trigger, dots smoothly migrate between clusters — some leave one
  group and join another — until a new balanced distribution is reached.
- **Role:** Visualizes the concept of rebalancing, relevant to the
  arbitrage calculator's recommendation.
- **Placement:** ArbitrageCalculator result section, showing capital flow.
- **When NOT to use:** For single-asset displays.
- **Parameters:** `totalDots: 30`, `migrationDuration: 1200ms`,
  `stagger: 20ms`, `easing: cubic-bezier(0.34, 1.56, 0.64, 1)`

#### Yield Curve Morph
- **What:** A line of dots positioned along a curve. The curve morphs
  between shapes (normal → inverted → flat) over time, with dots
  smoothly repositioning along the new curve shape.
- **Role:** Future use if yield/rate data is added.
- **Placement:** Reserved for rate-related features.
- **When NOT to use:** Current product scope.
- **Parameters:** `dotCount: 15`, `morphDuration: 2000ms`,
  `curveTypes: ['normal', 'inverted', 'flat']`

#### Time Horizon Compression
- **What:** A row of dots spaced evenly (representing time intervals).
  On interaction, the right side (future) compresses — dots crowd
  together — while the left (past) expands. Reverses on release.
  Represents changing analytical time horizons.
- **Role:** Conceptualizes the difference between short and long-term views.
- **Placement:** KimpChart period toggle enhancement.
- **When NOT to use:** As idle animation.
- **Parameters:** `dotCount: 12`, `compressionRatio: 0.4`,
  `animationDuration: 500ms`

---

## III. Placement Map

```
┌─────────────────────────────────────────────────────────┐
│  <body>                                                  │
│  ┌─ CANVAS: Tidal Grid + Data Breathing + Regime Shift ─┐│
│  │  (fixed, fullscreen, z-0)                            ││
│  │                                                       ││
│  │  ┌─ HEADER ─────────────────────────────────────────┐││
│  │  │  (no animation — stable anchor)                  │││
│  │  └──────────────────────────────────────────────────┘││
│  │                                                       ││
│  │  ┌─ KIMP CARD ──────────────────────────────────────┐││
│  │  │  Signal Emergence (data dots)                    │││
│  │  │  Market Pulse (heartbeat)                        │││
│  │  │  Threshold Density Shift (on crossing)           │││
│  │  │  Breakout Threshold (level line)                 │││
│  │  │  Insight Bloom (30d badge change)                │││
│  │  └──────────────────────────────────────────────────┘││
│  │                                                       ││
│  │  ┌─ 3-COL GRID ────────────────────────────────────┐││
│  │  │ FundingRate    │ FearGreed     │ SignalBadge     │││
│  │  │ Signal         │ Signal        │ Insight Bloom   │││
│  │  │ Emergence      │ Emergence     │ (on level ∆)   │││
│  │  │                │ Volatility    │                 │││
│  │  │                │ Storm (exp.)  │                 │││
│  │  └──────────────────────────────────────────────────┘││
│  │                                                       ││
│  │  ┌─ KIMP CHART ─────────────────────────────────────┐││
│  │  │  Price Discovery Bloom (newest point)            │││
│  │  │  Memory Residue (period switch)                  │││
│  │  │  Dot Trail Afterglow (on update)                 │││
│  │  │  Candles Dissolve (first render)                 │││
│  │  │  Time Horizon Compression (period toggle)        │││
│  │  │  Forecast Uncertainty Haze (if projection added) │││
│  │  └──────────────────────────────────────────────────┘││
│  │                                                       ││
│  │  ┌─ PREMIUM HEATMAP ───────────────────────────────┐││
│  │  │  GRID:                                           │││
│  │  │    Conviction Lens (hover)                       │││
│  │  │    Correlation Hover (related coins)             │││
│  │  │    Focus Drift (selection)                       │││
│  │  │    Signal vs Noise (filter mode)                 │││
│  │  │    Correlation Dance (comparison, expanded)      │││
│  │  │  BARS:                                           │││
│  │  │    Volume as Pressure (density = premium)        │││
│  │  └──────────────────────────────────────────────────┘││
│  │                                                       ││
│  │  ┌─ ARBITRAGE CALCULATOR ───────────────────────────┐││
│  │  │  Order Book Ripple (on calculate)                │││
│  │  │  Portfolio Rebalance (result visualization)      │││
│  │  │  Threshold Density Shift (viability flip)        │││
│  │  │  Risk Contour (fee explanation, expandable)      │││
│  │  └──────────────────────────────────────────────────┘││
│  │                                                       ││
│  │  ┌─ LOADING STATE ─────────────────────────────────┐││
│  │  │  Orbital Silence (initial load)                  │││
│  │  │  Constellation Pulse (refresh cycle)             │││
│  │  └──────────────────────────────────────────────────┘││
│  │                                                       ││
│  └───────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

---

## IV. Component Architecture

### Directory Structure

```
src/
  components/
    motion/
      core/
        DotFieldCanvas.tsx      ← shared canvas engine
        useDotField.ts          ← hook: manages dot state array
        useReducedMotion.ts     ← hook: prefers-reduced-motion
        useResizeObserver.ts    ← hook: responsive canvas sizing
        dot-math.ts             ← pure functions: easing, wave, noise
        dot-types.ts            ← Dot, DotFieldConfig, AnimationState
        constants.ts            ← timing, thresholds, shared params

      ambient/
        TidalGrid.tsx           ← fullscreen background canvas
        RegimeShiftOverlay.tsx  ← regime transition effect layer

      indicators/
        DotCluster.tsx          ← replaces current inline DotCluster
        DotGauge.tsx            ← replaces funding rate dots
        DotScale.tsx            ← replaces fear/greed variable dots
        DotPulse.tsx            ← single-use pulse animation
        InsightBloom.tsx        ← burst particle on state change
        ThresholdLine.tsx       ← horizontal dot line (breakout)

      chart/
        ChartDotOverlay.tsx     ← canvas overlay for KimpChart
        PriceDiscoveryDot.tsx   ← coalescing newest point (SVG)
        MemoryResidue.tsx       ← ghost polyline on period change

      heatmap/
        ConvictionLens.tsx      ← hover magnification manager
        CorrelationLine.tsx     ← dotted SVG connecting line
        PressureBar.tsx         ← dot-density bar fill
        SignalNoiseFilter.tsx   ← dim/highlight filter state

      storytelling/
        OrbitalSilence.tsx      ← loading state orbital animation
        LiquidityField.tsx      ← generative particle field
        VolatilityStorm.tsx     ← order-to-chaos field
        TrendFormation.tsx      ← self-organizing dots
        CorrelationDance.tsx    ← synced dual-cluster sway
        OrderBookRipple.tsx     ← domino wave animation
        RiskContour.tsx         ← concentric breathing rings
```

### Core Engine: `DotFieldCanvas`

The shared canvas component that all large-field animations use.

```typescript
interface DotFieldConfig {
  width: number;
  height: number;
  dpr: number;                    // device pixel ratio
  baseRadius: number;             // default dot size
  gridSpacing: number;            // distance between dots
  color: string;                  // dot color (always black, varying opacity)
  maxOpacity: number;
  reducedMotion: boolean;
}

interface Dot {
  x: number;
  y: number;
  baseRadius: number;
  currentRadius: number;
  opacity: number;
  phase: number;                  // individual wave phase offset
  vx: number;                     // velocity x (for particle modes)
  vy: number;                     // velocity y
}

interface DotFieldState {
  dots: Dot[];
  time: number;
  frame: number;
  paused: boolean;
}
```

**Key implementation rules for the canvas engine:**

1. **One canvas per layer.** Ambient = 1 canvas. Chart overlay = 1 canvas.
   Never multiple canvases for the same visual layer.
2. **Dot pool pattern.** Pre-allocate all dots on init. Never create/destroy
   dots during animation. Toggle visibility via opacity.
3. **Typed arrays.** For fields > 500 dots, store positions in Float32Array
   for cache-friendly iteration.
4. **Batch rendering.** One `beginPath()` / `arc()` loop / `fill()` per frame.
   Never individual `fill()` per dot.
5. **Frame budget.** Target < 4ms per frame for dot field updates. Profile
   on low-end devices.

### Shared Hook: `useDotField`

```typescript
function useDotField(config: DotFieldConfig): {
  canvasRef: RefObject<HTMLCanvasElement>;
  updateDots: (modifier: (dots: Dot[], time: number) => void) => void;
  pause: () => void;
  resume: () => void;
  resize: (width: number, height: number) => void;
}
```

### Shared Hook: `useReducedMotion`

```typescript
function useReducedMotion(): boolean {
  // returns true if prefers-reduced-motion: reduce
  // all animation components check this and either:
  //   - render static final state, or
  //   - skip to end of animation instantly
}
```

---

## V. Implementation Guidance Per Priority

### Priority 1 — Ship First (core experience)

| Component | Effort | Notes |
|-----------|--------|-------|
| `DotFieldCanvas` + `useDotField` | M | Foundation. Build once, use everywhere. |
| `TidalGrid` | S | First visible improvement. Canvas + sin wave. |
| `DotCluster` (with Signal Emergence) | S | Replace inline component. Add staggered entry. |
| `DotGauge` (with Signal Emergence) | S | Reusable for funding rate. |
| `DotScale` (with Signal Emergence) | S | Reusable for fear/greed. |
| `Market Pulse` | S | Add to DotCluster. Single pulse function. |
| `Memory Residue` | S | Two-layer SVG opacity transition. |
| `Conviction Lens` | S | CSS transform coordination. |
| `OrbitalSilence` | M | Replace loading state. SVG orbiting dots. |

### Priority 2 — Refine (depth + delight)

| Component | Effort | Notes |
|-----------|--------|-------|
| `Data Breathing` | S | Modify TidalGrid wave center. Add threshold check. |
| `Regime Shift` | M | Animate grid spacing + density on signal change. |
| `Threshold Density Shift` | S | Threshold crossing detection + brief compression. |
| `Insight Bloom` | M | Particle burst. Small canvas or positioned divs. |
| `Price Discovery Bloom` | M | SVG animated cluster → single point. |
| `Dot Trail Afterglow` | M | Trail buffer in chart overlay. |
| `Breakout Threshold` | S | Conditional horizontal dot line render. |
| `Volume as Pressure` | S | Dynamic backgroundSize in heatmap bars. |
| `Constellation Pulse` | S | Global event → all indicators pulse. |
| `Correlation Hover` | M | Premium comparison + SVG line rendering. |
| `Focus Drift` | S | CSS transform + dot ring generator. |

### Priority 3 — Expand (storytelling + education)

| Component | Effort | Notes |
|-----------|--------|-------|
| `Signal vs Noise` | M | Filter state + coordinated opacity transition. |
| `Candles Dissolve` | L | Particle decomposition. Canvas animation. |
| `Order Book Ripple` | M | Sequential dot scaling. SVG or CSS. |
| `Volatility Storm` | L | Noise-driven field. Canvas. |
| `Trend Formation` | L | Self-organizing algorithm. Canvas. |
| `Correlation Dance` | M | Dual cluster with shared phase. Canvas. |
| `Risk Contour` | M | Concentric ring generator. SVG. |
| `Liquidity Field` | L | Particle attraction simulation. Canvas. |
| `Portfolio Rebalance` | M | Dot migration between clusters. Canvas or SVG. |
| `Forecast Uncertainty Haze` | S | Gaussian blur + jitter on future dots. |
| `Time Horizon Compression` | S | Dot spacing animation on toggle. |
| `Yield Curve Morph` | M | Curve interpolation + dot repositioning. |

---

## VI. Consistency Rules

### 1. The Dot Specification

Every dot in the system is a filled circle. No squares. No outlines.
No gradients inside dots.

```
minimum dot radius:  0.4px  (barely visible, ambient use)
standard dot radius: 1.0px  (default for grids and gauges)
emphasis dot radius: 2.5px  (data points, indicators)
maximum dot radius:  6.0px  (hero KimpCard DotCluster peak)
```

### 2. Color Rule

Dots are **always** `#1a1a1a` (dot-accent) with varying **opacity**.
The only exceptions are inside explicitly color-coded data indicators:

| Context              | Allowed colors                      |
|----------------------|-------------------------------------|
| Ambient fields       | `#1a1a1a` only, opacity 0.04–0.15   |
| Data gauges          | `dot-green` or `dot-red` by value   |
| Heatmap dots         | `dot-red` / `dot-blue` by premium   |
| Chart data points    | `#1a1a1a` only                      |
| Storytelling         | `#1a1a1a` only, opacity varies      |

### 3. Timing Rules

```
ambient wave period:     6000–9000ms    (slow, geological)
data transition:         300–600ms      (purposeful, not snappy)
interaction response:    100–200ms      (perceptible instantly)
particle fade:           600–1200ms     (graceful exit)
storytelling cycle:      3000–6000ms    (contemplative)
```

**Easing palette** (use only these):

```
ease-dot-out:     cubic-bezier(0.16, 1, 0.3, 1)    — primary, for emergence
ease-dot-in-out:  cubic-bezier(0.45, 0, 0.55, 1)   — for symmetric pulses
ease-dot-spring:  cubic-bezier(0.34, 1.56, 0.64, 1) — for arrival/bloom
ease-dot-fade:    cubic-bezier(0.4, 0, 0.2, 1)      — for disappearance
```

### 4. Density Rules

```
ambient grid:         never > 1 dot per 16x16px area
card indicators:      never > 12 dots per component
chart overlay:        never > 30 visible animated dots
storytelling field:   never > 300 dots (canvas)
total screen dots:    never > 500 simultaneously animated
```

### 5. Motion Budget

At any given moment, at most **one Layer 1 animation** and **one Layer 3
animation** should be playing per card. Layer 0 always runs. Layer 2 animates
only in the chart. Layer 4 and 5 are exclusive (they take over attention).

### 6. Reduced Motion Behavior

When `prefers-reduced-motion: reduce`:

| Layer | Behavior |
|-------|----------|
| 0 (ambient) | Static dot grid, no wave |
| 1 (card) | Instant state transitions, no stagger |
| 2 (chart) | Static dots, no trails, no bloom |
| 3 (interaction) | CSS transitions only, reduced to opacity changes |
| 4 (transition) | Cross-fade only, 300ms |
| 5 (storytelling) | Static final frame |

### 7. Naming Convention

```
Components:   PascalCase, noun phrase        (TidalGrid, InsightBloom)
Hooks:        useCamelCase                   (useDotField, useReducedMotion)
CSS classes:  dot-kebab-case                 (dot-grid, dot-card, dot-vignette)
Constants:    SCREAMING_SNAKE                (MAX_DOT_RADIUS, WAVE_PERIOD)
Parameters:   camelCase                      (waveSpeed, pulseScale)
```

### 8. Performance Guardrails

1. Canvas animations **must** use `requestAnimationFrame`, never `setInterval`.
2. Canvas **must** skip frames if `delta > 32ms` (below 30fps = pause).
3. Dot fields **must** stop animating when off-screen (`IntersectionObserver`).
4. All numerical constants **must** be defined in `constants.ts`, not inline.
5. Canvas resize **must** debounce by 100ms and handle `devicePixelRatio`.
6. SVG animations **must** use `will-change: transform` or `will-change: opacity`.
7. No animation library dependencies. Raw `requestAnimationFrame` + math.

### 9. Accessibility Contract

- All animations are **supplementary** — removing them changes nothing about
  information availability.
- Screen readers never encounter animation elements (`aria-hidden="true"`
  on all canvas and decorative SVG).
- Animated dots must not flash faster than 3 times per second.
- Focus indicators are never animated (solid dot rings, not pulsing).

---

## VII. DO / DON'T Reference

### DO

- Use dot size to encode magnitude
- Use dot density to encode intensity
- Use dot opacity to encode certainty / relevance
- Use slow waves to encode ambient state
- Use brief pulses to acknowledge data events
- Use trails to encode direction / momentum
- Keep ambient animation below conscious attention
- Let data drive every parameter

### DON'T

- Animate for the sake of "making it feel alive" — if it's not communicating,
  remove it
- Use dots as confetti or celebration particles
- Make dots move faster than 2px/frame in ambient mode
- Use more than 2 colors in any single animation
- Add particle effects to button hovers or form inputs
- Let storytelling animations loop indefinitely without purpose
- Animate the header, footer, or navigation
- Create motion that would look identical with random data — every animation
  should look different when the data is different
