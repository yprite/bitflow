# Desktop Magazine Renewal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all desktop pages from mobile-ported layout to a magazine/editorial scroll experience with Apple-style animations, consolidating 13 routes into 3 magazine pages + preserved supporting pages.

**Architecture:** Replace `DesktopChrome` sidebar shell with full-width `MagazineLayout`. Build 3 animation primitives (ScrollReveal, ParallaxDots, NumberCounter) using Intersection Observer + requestAnimationFrame. Compose 3 magazine pages from new section components, reusing existing data layer (`DataProvider`, `useData()`, chart components) unchanged.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS, Intersection Observer API, requestAnimationFrame, CSS transforms/transitions

**Spec:** `docs/superpowers/specs/2026-03-27-desktop-magazine-renewal-design.md`

---

## File Structure

### New Files

```
src/components/desktop/magazine/
├── magazine-layout.tsx          # Full-width shell replacing DesktopChrome
├── masthead.tsx                 # Shared hero: edition name, headline, meta, indicator strip
├── floating-progress.tsx        # Right-side progress bar with section markers
├── dark-section.tsx             # Dark background section wrapper
├── light-section.tsx            # Light background section wrapper
├── indicator-card.tsx           # Redesigned metric card for thermometer grid
├── signal-bar.tsx               # 11-segment signal visualization
├── timeline-item.tsx            # Archive timeline entry
├── magazine-footer.tsx          # Dark footer with cross-page links

src/components/motion/
├── scroll-reveal.tsx            # Intersection Observer wrapper for reveal animations
├── parallax-dots.tsx            # Multi-layer dot-grid with scroll parallax
├── number-counter.tsx           # Animated count-up with easing

src/components/desktop/
├── desktop-magazine-page.tsx    # Main magazine: all 8 sections
├── desktop-onchain-magazine.tsx # On-chain deep dive: 5 sections
├── desktop-weekly-magazine.tsx  # Weekly archive: 3 sections

src/app/globals.css              # (modify) Add magazine CSS, update desktop classes
```

### Modified Files

```
src/app/desktop/layout.tsx             # Replace DesktopChrome with MagazineLayout
src/app/desktop/page.tsx               # Point to new DesktopMagazinePage
src/app/desktop/onchain/page.tsx       # Point to new DesktopOnchainMagazine
src/app/desktop/weekly/page.tsx        # Point to new DesktopWeeklyMagazine
src/app/desktop/weekly/[slug]/page.tsx # Update wrapper to MagazineLayout style
src/app/desktop/tools/page.tsx         # Replace DesktopChrome UI with MagazineLayout UI
src/app/desktop/alert/page.tsx         # Replace DesktopChrome UI with MagazineLayout UI
src/app/desktop/about/page.tsx         # Replace DesktopChrome UI with MagazineLayout UI
src/app/desktop/contact/page.tsx       # Replace DesktopChrome UI with MagazineLayout UI
src/app/desktop/disclaimer/page.tsx    # Replace DesktopChrome UI with MagazineLayout UI
src/app/desktop/privacy/page.tsx       # Replace DesktopChrome UI with MagazineLayout UI
src/app/desktop/indicators/page.tsx    # Redirect to /desktop (content merged)
src/app/desktop/realtime/page.tsx      # Already redirects, keep as-is
```

### Preserved (no changes)

```
src/components/data-provider.tsx       # DataProvider + useData() unchanged
src/components/signal-badge.tsx        # Kept for reference, not used in new pages
src/components/desktop/desktop-ui.tsx  # Kept for supporting pages
src/lib/types.ts                       # No type changes
src/components/motion/transitions/DotAssemblyReveal.tsx  # Reused as-is
src/components/motion/storytelling/OrbitalSilence.tsx     # Reused for loading
src/components/motion/storytelling/WeatherEffect.tsx      # Reused subtly
```

---

## Tasks

### Task 1: CSS Foundation — Magazine Classes

**Files:**
- Modify: `src/app/globals.css`

Add new magazine-specific CSS classes alongside existing desktop classes. Old classes stay until Task 14.

- [ ] **Step 1: Add magazine layout classes**

Add after the existing desktop classes block (after line ~122) in `globals.css`:

```css
/* ── Magazine Layout ────────────────────── */

.magazine-shell {
  min-width: 1024px;
  width: 100%;
  overflow-x: hidden;
}

.magazine-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}

.magazine-full-bleed {
  width: 100%;
}

.magazine-full-bleed > .magazine-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}

/* Dark section */
.magazine-section-dark {
  background-color: #1a1a1a;
  color: #f5f5f0;
}

.magazine-section-dark .dot-grid {
  background-image: radial-gradient(circle, #f5f5f0 0.6px, transparent 0.6px);
  opacity: 0.04;
}

/* Light section */
.magazine-section-light {
  background-color: #f5f5f0;
  color: #1a1a1a;
}

/* Masthead */
.magazine-masthead {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.magazine-masthead-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.magazine-masthead-divider {
  flex: 1;
  height: 1px;
  background: #d1d5db;
}

.magazine-masthead-meta {
  font-size: 11px;
  color: #6b7280;
}

/* Indicator strip */
.magazine-indicator-strip {
  display: flex;
  gap: 1px;
  background: #d1d5db;
  border-radius: 4px;
  overflow: hidden;
}

.magazine-indicator-strip-cell {
  flex: 1;
  background: #ffffff;
  padding: 10px;
  text-align: center;
}

.magazine-indicator-strip-label {
  font-size: 8px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.magazine-indicator-strip-value {
  font-size: 16px;
  font-weight: 700;
}

/* Scroll reveal animation states */
.scroll-reveal-hidden {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.scroll-reveal-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Number counter */
.number-counter {
  font-variant-numeric: tabular-nums;
}

/* Floating progress */
.floating-progress {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.floating-progress.visible {
  opacity: 1;
}

.floating-progress-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d1d5db;
  transition: background 0.2s ease, transform 0.2s ease;
  cursor: pointer;
  border: none;
  padding: 0;
}

.floating-progress-dot:hover {
  transform: scale(1.5);
}

.floating-progress-dot.active {
  background: #1a1a1a;
  transform: scale(1.5);
}

.floating-progress-line {
  width: 1px;
  height: 8px;
  background: #e5e5e0;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .scroll-reveal-hidden {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .floating-progress {
    transition: none;
  }
  .floating-progress-dot {
    transition: none;
  }
}
```

- [ ] **Step 2: Verify CSS compiles**

Run: `npx tailwindcss --content 'src/**/*.tsx' --output /dev/null 2>&1 | head -5`
Or: `npm run build -- --no-lint 2>&1 | tail -10` (check for CSS errors)

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: add magazine layout CSS classes"
```

---

### Task 2: ScrollReveal Animation Component

**Files:**
- Create: `src/components/motion/scroll-reveal.tsx`

Intersection Observer wrapper that adds/removes visibility classes as elements enter viewport.

- [ ] **Step 1: Create ScrollReveal component**

```tsx
'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms before the reveal starts after entering viewport */
  delay?: number;
  /** Threshold (0-1) of element visibility to trigger reveal */
  threshold?: number;
  /** Root margin for Intersection Observer */
  rootMargin?: string;
  /** HTML tag to render as */
  as?: keyof JSX.IntrinsicElements;
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  threshold = 0.15,
  rootMargin = '0px 0px -60px 0px',
  as: Tag = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay);
          } else {
            setIsVisible(true);
          }
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold, rootMargin]);

  const Component = Tag as any;

  return (
    <Component
      ref={ref}
      className={`${isVisible ? 'scroll-reveal-visible' : 'scroll-reveal-hidden'} ${className}`}
    >
      {children}
    </Component>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/components/motion/scroll-reveal.tsx 2>&1 | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/components/motion/scroll-reveal.tsx
git commit -m "feat: add ScrollReveal animation component"
```

---

### Task 3: ParallaxDots Animation Component

**Files:**
- Create: `src/components/motion/parallax-dots.tsx`

Multi-layer dot-grid backgrounds with scroll-linked parallax movement.

- [ ] **Step 1: Create ParallaxDots component**

```tsx
'use client';

import { useEffect, useRef } from 'react';

interface DotLayer {
  /** Spacing between dots in px */
  size: number;
  /** Dot radius in px */
  radius: number;
  /** Opacity of the dot layer (0-1) */
  opacity: number;
  /** Parallax speed factor (0 = fixed, 1 = normal scroll, 0.5 = half speed) */
  speed: number;
  /** Dot color */
  color?: string;
}

interface ParallaxDotsProps {
  /** Array of dot layer configurations */
  layers: DotLayer[];
  className?: string;
}

const DEFAULT_LAYERS: DotLayer[] = [
  { size: 14, radius: 0.8, opacity: 0.07, speed: 0.3, color: '#1a1a1a' },
  { size: 24, radius: 1.2, opacity: 0.03, speed: 0.15, color: '#1a1a1a' },
];

export function ParallaxDots({
  layers = DEFAULT_LAYERS,
  className = '',
}: ParallaxDotsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<HTMLDivElement[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      rafRef.current = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const scrollProgress = -rect.top;

        layerRefs.current.forEach((layerEl, i) => {
          if (!layerEl || !layers[i]) return;
          const offset = scrollProgress * layers[i].speed;
          layerEl.style.transform = `translateY(${offset}px)`;
        });
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [layers]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {layers.map((layer, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) layerRefs.current[i] = el;
          }}
          className="absolute will-change-transform"
          style={{
            inset: '-20%',
            backgroundImage: `radial-gradient(circle, ${layer.color ?? '#1a1a1a'} ${layer.radius}px, transparent ${layer.radius}px)`,
            backgroundSize: `${layer.size}px ${layer.size}px`,
            opacity: layer.opacity,
          }}
        />
      ))}
    </div>
  );
}

/** Preset: light dots on dark background */
export const DARK_PARALLAX_LAYERS: DotLayer[] = [
  { size: 16, radius: 0.6, opacity: 0.04, speed: 0.3, color: '#f5f5f0' },
  { size: 28, radius: 1.0, opacity: 0.02, speed: 0.15, color: '#f5f5f0' },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/components/motion/parallax-dots.tsx
git commit -m "feat: add ParallaxDots scroll animation component"
```

---

### Task 4: NumberCounter Animation Component

**Files:**
- Create: `src/components/motion/number-counter.tsx`

Animated number that counts from 0 (or start value) to target value when element enters viewport.

- [ ] **Step 1: Create NumberCounter component**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface NumberCounterProps {
  /** Target value to count to */
  value: number;
  /** Starting value (default: 0) */
  from?: number;
  /** Duration in ms (default: 1200) */
  duration?: number;
  /** Decimal places to show (default: auto-detect from value) */
  decimals?: number;
  /** Prefix string (e.g., "$", "+") */
  prefix?: string;
  /** Suffix string (e.g., "%", "M") */
  suffix?: string;
  /** Format function for custom display */
  format?: (value: number) => string;
  className?: string;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function autoDecimals(value: number): number {
  const str = String(value);
  const dot = str.indexOf('.');
  return dot === -1 ? 0 : str.length - dot - 1;
}

export function NumberCounter({
  value,
  from = 0,
  duration = 1200,
  decimals,
  prefix = '',
  suffix = '',
  format,
  className = '',
}: NumberCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(from);
  const [hasAnimated, setHasAnimated] = useState(false);

  const resolvedDecimals = decimals ?? autoDecimals(value);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      setHasAnimated(true);
      return;
    }

    const el = ref.current;
    if (!el || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(el);
          setHasAnimated(true);

          const startTime = performance.now();
          const delta = value - from;

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);
            setDisplayValue(from + delta * eased);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(value);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, from, duration, hasAnimated]);

  const formatted = format
    ? format(displayValue)
    : displayValue.toFixed(resolvedDecimals);

  return (
    <span
      ref={ref}
      className={`number-counter ${className}`}
      aria-label={`${prefix}${format ? format(value) : value.toFixed(resolvedDecimals)}${suffix}`}
    >
      <span aria-hidden="true">
        {prefix}
        {formatted}
        {suffix}
      </span>
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/motion/number-counter.tsx
git commit -m "feat: add NumberCounter animation component"
```

---

### Task 5: MagazineLayout Shell Component

**Files:**
- Create: `src/components/desktop/magazine/magazine-layout.tsx`

Full-width layout shell replacing DesktopChrome. Minimal top bar with logo.

- [ ] **Step 1: Read existing DesktopChrome for reference**

Read: `src/components/desktop/desktop-chrome.tsx`
Note: Logo component import, SITE_NAME usage, nav items, active detection logic.

- [ ] **Step 2: Create MagazineLayout component**

```tsx
'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import AnimatedLogo from '@/components/motion/brand/AnimatedLogo';
import { SITE_NAME } from '@/lib/site';

interface MagazineLayoutProps {
  children: ReactNode;
}

export function MagazineLayout({ children }: MagazineLayoutProps) {
  return (
    <div className="magazine-shell">
      {/* Minimal top bar — logo only */}
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="magazine-content py-4">
          <Link
            href="/desktop"
            className="inline-flex items-center gap-2 pointer-events-auto opacity-60 hover:opacity-100 transition-opacity"
          >
            <AnimatedLogo size={20} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-dot-text">
              {SITE_NAME}
            </span>
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/desktop/magazine/magazine-layout.tsx
git commit -m "feat: add MagazineLayout shell component"
```

---

### Task 6: Masthead Shared Hero Component

**Files:**
- Create: `src/components/desktop/magazine/masthead.tsx`

Reusable masthead hero for all 3 magazine pages.

- [ ] **Step 1: Create Masthead component**

```tsx
import { type ReactNode } from 'react';
import { ParallaxDots } from '@/components/motion/parallax-dots';

interface MastheadProps {
  /** Edition name, e.g., "BITFLOW DAILY" */
  edition: string;
  /** Meta info displayed after divider, e.g., "Vol. 847 — 2026.03.25" */
  meta: string;
  /** Large headline text */
  headline: ReactNode;
  /** Optional subhead below headline */
  subhead?: ReactNode;
  /** Optional content below headline area (e.g., indicator strip) */
  bottom?: ReactNode;
  /** Optional center content (e.g., large BTC price) */
  center?: ReactNode;
}

export function Masthead({
  edition,
  meta,
  headline,
  subhead,
  bottom,
  center,
}: MastheadProps) {
  return (
    <section id="masthead" className="magazine-masthead magazine-section-light">
      <ParallaxDots />
      <div className="magazine-content relative z-10 flex flex-col justify-between min-h-screen py-10">
        {/* Top bar */}
        <div className="magazine-masthead-bar">
          <span className="text-dot-text">{edition}</span>
          <div className="magazine-masthead-divider" />
          <span className="magazine-masthead-meta">{meta}</span>
        </div>

        {/* Center content */}
        <div className="text-center">
          {center}
          <h1 className="text-5xl font-extrabold text-dot-text tracking-tight leading-tight">
            {headline}
          </h1>
          {subhead && (
            <p className="mt-2 text-sm text-dot-sub">{subhead}</p>
          )}
        </div>

        {/* Bottom content (indicator strip, etc.) */}
        {bottom && <div>{bottom}</div>}

        {/* Scroll hint */}
        {!bottom && <div />}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/desktop/magazine/masthead.tsx
git commit -m "feat: add Masthead shared hero component"
```

---

### Task 7: FloatingProgress Component

**Files:**
- Create: `src/components/desktop/magazine/floating-progress.tsx`

Right-side progress bar showing current section during scroll.

- [ ] **Step 1: Create FloatingProgress component**

```tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Section {
  id: string;
  label: string;
}

interface FloatingProgressProps {
  sections: Section[];
}

export function FloatingProgress({ sections }: FloatingProgressProps) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // Show after scrolling past 80vh
        setIsVisible(window.scrollY > window.innerHeight * 0.8);

        // Find active section
        let currentIndex = -1;
        for (let i = sections.length - 1; i >= 0; i--) {
          const el = document.getElementById(sections[i].id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.4) {
              currentIndex = i;
              break;
            }
          }
        }
        setActiveIndex(currentIndex);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [sections]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <nav
      className={`floating-progress ${isVisible ? 'visible' : ''}`}
      aria-label="Page sections"
    >
      {sections.map((section, i) => (
        <div key={section.id} className="flex flex-col items-center">
          <button
            className={`floating-progress-dot ${i === activeIndex ? 'active' : ''}`}
            onClick={() => scrollTo(section.id)}
            aria-label={section.label}
            title={section.label}
          />
          {i < sections.length - 1 && <div className="floating-progress-line" />}
        </div>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/desktop/magazine/floating-progress.tsx
git commit -m "feat: add FloatingProgress navigation component"
```

---

### Task 8: Section Wrappers + IndicatorCard + SignalBar + MagazineFooter

**Files:**
- Create: `src/components/desktop/magazine/dark-section.tsx`
- Create: `src/components/desktop/magazine/light-section.tsx`
- Create: `src/components/desktop/magazine/indicator-card.tsx`
- Create: `src/components/desktop/magazine/signal-bar.tsx`
- Create: `src/components/desktop/magazine/magazine-footer.tsx`
- Create: `src/components/desktop/magazine/timeline-item.tsx`

- [ ] **Step 1: Create DarkSection**

```tsx
import { type ReactNode } from 'react';

interface DarkSectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

export function DarkSection({ id, children, className = '' }: DarkSectionProps) {
  return (
    <section
      id={id}
      className={`magazine-full-bleed magazine-section-dark py-16 ${className}`}
    >
      <div className="magazine-content">{children}</div>
    </section>
  );
}
```

- [ ] **Step 2: Create LightSection**

```tsx
import { type ReactNode } from 'react';

interface LightSectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

export function LightSection({ id, children, className = '' }: LightSectionProps) {
  return (
    <section
      id={id}
      className={`magazine-full-bleed magazine-section-light py-16 ${className}`}
    >
      <div className="magazine-content">{children}</div>
    </section>
  );
}
```

- [ ] **Step 3: Create IndicatorCard**

```tsx
import { NumberCounter } from '@/components/motion/number-counter';

type Tone = 'positive' | 'negative' | 'neutral' | 'accent';

interface IndicatorCardProps {
  label: string;
  labelEn: string;
  value: number;
  displayValue?: string;
  tone: Tone;
  toneLabel: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const TONE_COLORS: Record<Tone, string> = {
  positive: 'text-dot-green',
  negative: 'text-dot-red',
  neutral: 'text-dot-sub',
  accent: 'text-dot-text',
};

export function IndicatorCard({
  label,
  labelEn,
  value,
  displayValue,
  tone,
  toneLabel,
  prefix = '',
  suffix = '',
  decimals,
}: IndicatorCardProps) {
  return (
    <div className="border border-dot-border/60 rounded-md p-4 flex justify-between items-center bg-white/50">
      <div>
        <div className="text-[11px] text-dot-sub">{label}</div>
        <div className="text-[10px] text-dot-muted">{labelEn}</div>
      </div>
      <div className="text-right">
        <div className={`text-2xl font-bold ${TONE_COLORS[tone]}`}>
          {displayValue ?? (
            <NumberCounter
              value={value}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
            />
          )}
        </div>
        <div className={`text-[10px] ${TONE_COLORS[tone]}`}>{toneLabel}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create SignalBar**

```tsx
interface SignalBarProps {
  /** Total number of indicators */
  total: number;
  /** Number of positive indicators */
  positive: number;
  /** Number of neutral indicators */
  neutral: number;
  /** Number of negative indicators */
  negative: number;
}

export function SignalBar({ total, positive, neutral, negative }: SignalBarProps) {
  const segments = [
    ...Array(positive).fill('bg-dot-green'),
    ...Array(neutral).fill('bg-dot-muted'),
    ...Array(negative).fill('bg-dot-red'),
  ];

  return (
    <div role="img" aria-label={`${total}개 지표 중 ${positive}개 긍정 · ${neutral}개 중립 · ${negative}개 부정`}>
      <div className="flex justify-center gap-[3px]">
        {segments.map((color, i) => (
          <div
            key={i}
            className={`w-7 h-2 rounded-full ${color}`}
          />
        ))}
      </div>
      <div className="mt-2 text-center text-[11px] text-dot-muted">
        {total}개 지표: {positive} 긍정 · {neutral} 중립 · {negative} 부정
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create MagazineFooter**

```tsx
import Link from 'next/link';
import { DarkSection } from './dark-section';

interface FooterLink {
  label: string;
  sublabel: string;
  href: string;
}

interface MagazineFooterProps {
  links: FooterLink[];
}

export function MagazineFooter({ links }: MagazineFooterProps) {
  return (
    <DarkSection>
      <div className="flex justify-center items-center gap-8 py-4">
        {links.map((link, i) => (
          <div key={link.href} className="flex items-center gap-8">
            {i > 0 && <div className="w-px h-8 bg-white/10" />}
            <Link
              href={link.href}
              className="text-center group"
            >
              <div className="text-xs text-dot-muted">{link.sublabel}</div>
              <div className="text-base font-bold text-dot-bg group-hover:underline underline-offset-4">
                {link.label}
              </div>
            </Link>
          </div>
        ))}
      </div>
      {/* Legal links */}
      <div className="flex justify-center gap-6 mt-8 text-[10px] text-dot-muted/50">
        <Link href="/desktop/about" className="hover:text-dot-muted">소개</Link>
        <Link href="/desktop/contact" className="hover:text-dot-muted">문의</Link>
        <Link href="/desktop/disclaimer" className="hover:text-dot-muted">면책</Link>
        <Link href="/desktop/privacy" className="hover:text-dot-muted">개인정보</Link>
      </div>
    </DarkSection>
  );
}
```

- [ ] **Step 6: Create TimelineItem**

```tsx
import Link from 'next/link';

interface TimelineItemProps {
  href: string;
  title: string;
  subtitle: string;
  isFirst?: boolean;
}

export function TimelineItem({ href, title, subtitle, isFirst = false }: TimelineItemProps) {
  return (
    <div className="relative">
      <div
        className={`absolute -left-[25px] top-[5px] w-2 h-2 rounded-full ${
          isFirst ? 'bg-dot-text' : 'bg-dot-border'
        }`}
      />
      <Link href={href} className="flex justify-between items-baseline group">
        <div>
          <div className="text-[13px] font-semibold text-dot-text group-hover:underline">
            {title}
          </div>
          <div className="text-[11px] text-dot-sub">{subtitle}</div>
        </div>
        <div className="text-[11px] text-dot-muted group-hover:text-dot-text transition-colors">
          읽기 →
        </div>
      </Link>
    </div>
  );
}
```

- [ ] **Step 7: Commit all components**

```bash
git add src/components/desktop/magazine/
git commit -m "feat: add magazine section wrappers and UI components"
```

---

### Task 9: Main Magazine Page — Sections 1-4

**Files:**
- Create: `src/components/desktop/desktop-magazine-page.tsx`

Build the first half of the main magazine page: Masthead Hero, Headline, Thermometer, Chart Deep Dive.

- [ ] **Step 1: Read existing data bindings**

Read these files to understand the data shapes:
- `src/components/desktop/desktop-home-page.tsx` — indicator data mapping, formatting
- `src/components/desktop/desktop-indicators-page.tsx` — chart components, data fetching from `/api/indicators`
- `src/lib/types.ts` — DashboardData, CompositeSignal, IndicatorsPageData

Note the indicator names, keys, and how tones are determined from `data`.

- [ ] **Step 2: Create desktop-magazine-page.tsx (Part 1 — Sections 1-4)**

Create the file with Sections 1-4. The remaining sections (5-8) will be added in the next task.

```tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useData } from '@/components/data-provider';
import { Masthead } from '@/components/desktop/magazine/masthead';
import { FloatingProgress } from '@/components/desktop/magazine/floating-progress';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { NumberCounter } from '@/components/motion/number-counter';
import { ParallaxDots, DARK_PARALLAX_LAYERS } from '@/components/motion/parallax-dots';
import { IndicatorCard } from '@/components/desktop/magazine/indicator-card';
import { SignalBar } from '@/components/desktop/magazine/signal-bar';
import { LightSection } from '@/components/desktop/magazine/light-section';
import { DarkSection } from '@/components/desktop/magazine/dark-section';
import { MagazineFooter } from '@/components/desktop/magazine/magazine-footer';
import OrbitalSilence from '@/components/motion/storytelling/OrbitalSilence';
import type { DashboardData, IndicatorsPageData } from '@/lib/types';

// Chart components — verify exact paths from desktop-indicators-page.tsx imports
import KimpChart from '@/components/kimp-chart';
import KimpStatsCard from '@/components/indicators/kimp-stats-card';
import FundingRateHistoryChart from '@/components/indicators/funding-rate-history-chart';
import FearGreedHistoryChart from '@/components/indicators/fear-greed-history-chart';
import BtcReturnHeatmap from '@/components/indicators/btc-return-heatmap';

const PROGRESS_SECTIONS = [
  { id: 'masthead', label: '마스트헤드' },
  { id: 'headline', label: '헤드라인' },
  { id: 'thermometer', label: '온도계' },
  { id: 'charts', label: '차트' },
  { id: 'heatmap', label: '히트맵' },
  { id: 'events', label: '이벤트' },
  { id: 'tools', label: '도구' },
];

// Helpers
function formatVol(): string {
  const start = new Date('2024-01-01');
  const now = new Date();
  const days = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return String(days);
}

function todayFormatted(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

type Tone = 'positive' | 'negative' | 'neutral' | 'accent';

interface IndicatorDef {
  key: string;
  label: string;
  labelEn: string;
  getValue: (d: DashboardData) => number;
  getDisplay?: (d: DashboardData) => string;
  getTone: (d: DashboardData) => Tone;
  getToneLabel: (d: DashboardData) => string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

// Define all 11 indicators — adapt from existing desktop-home-page.tsx logic
const INDICATORS: IndicatorDef[] = [
  {
    key: 'fearGreed',
    label: '공포탐욕 지수',
    labelEn: 'Fear & Greed Index',
    getValue: (d) => d.fearGreed.value,
    getTone: (d) => d.fearGreed.value >= 60 ? 'positive' : d.fearGreed.value <= 40 ? 'negative' : 'neutral',
    getToneLabel: (d) => d.fearGreed.value >= 75 ? '극단적 탐욕' : d.fearGreed.value >= 60 ? '탐욕' : d.fearGreed.value <= 25 ? '극단적 공포' : d.fearGreed.value <= 40 ? '공포' : '중립',
    decimals: 0,
  },
  {
    key: 'kimp',
    label: 'KIMP 프리미엄',
    labelEn: 'Korea Premium',
    getValue: (d) => d.kimp.premium,
    getDisplay: (d) => `${d.kimp.premium >= 0 ? '+' : ''}${d.kimp.premium.toFixed(1)}%`,
    getTone: (d) => Math.abs(d.kimp.premium) >= 3 ? 'negative' : Math.abs(d.kimp.premium) >= 1.5 ? 'accent' : 'neutral',
    getToneLabel: (d) => d.kimp.premium >= 3 ? '높음' : d.kimp.premium <= -1 ? '역프' : '보통',
    suffix: '%',
    decimals: 1,
  },
  {
    key: 'funding',
    label: '펀딩비',
    labelEn: 'Funding Rate',
    getValue: (d) => d.fundingRate.rate * 100,
    getTone: (d) => d.fundingRate.rate > 0.0005 ? 'positive' : d.fundingRate.rate < -0.0005 ? 'negative' : 'neutral',
    getToneLabel: (d) => d.fundingRate.rate > 0.0005 ? '롱 우위' : d.fundingRate.rate < -0.0005 ? '숏 우위' : '중립',
    suffix: '%',
    decimals: 3,
  },
  {
    key: 'dominance',
    label: 'BTC 도미넌스',
    labelEn: 'Dominance',
    getValue: (d) => d.btcDominance.dominance,
    getTone: () => 'accent',
    getToneLabel: (d) => d.btcDominance.dominance > 55 ? '높음' : d.btcDominance.dominance < 45 ? '낮음' : '안정',
    suffix: '%',
    decimals: 1,
  },
  {
    key: 'liquidation',
    label: '청산량',
    labelEn: 'Liquidation',
    getValue: (d) => (d.liquidation.totalUsd24h ?? 0) / 1_000_000,
    getTone: (d) => (d.liquidation.totalUsd24h ?? 0) > 100_000_000 ? 'negative' : 'neutral',
    getToneLabel: (d) => (d.liquidation.totalUsd24h ?? 0) > 200_000_000 ? '매우 높음' : (d.liquidation.totalUsd24h ?? 0) > 100_000_000 ? '높음' : '보통',
    prefix: '$',
    suffix: 'M',
    decimals: 0,
  },
  {
    key: 'volume',
    label: '거래량 변화',
    labelEn: 'Volume Change',
    getValue: (d) => d.volumeChange.changePercent ?? 0,
    getTone: (d) => (d.volumeChange.changePercent ?? 0) > 10 ? 'positive' : (d.volumeChange.changePercent ?? 0) < -10 ? 'negative' : 'neutral',
    getToneLabel: (d) => (d.volumeChange.changePercent ?? 0) > 0 ? '증가' : '감소',
    prefix: '+',
    suffix: '%',
    decimals: 1,
  },
  {
    key: 'stablecoin',
    label: '스테이블코인',
    labelEn: 'Stablecoin Supply',
    getValue: (d) => (d.stablecoinMcap.totalMcap ?? 0) / 1_000_000_000,
    getTone: () => 'neutral',
    getToneLabel: () => '시가총액',
    prefix: '$',
    suffix: 'B',
    decimals: 1,
  },
  {
    key: 'strategy',
    label: '전략 BTC',
    labelEn: 'Strategy BTC',
    getValue: (d) => d.strategyBtc.totalBtc ?? 0,
    getDisplay: (d) => ((d.strategyBtc.totalBtc ?? 0) / 1000).toFixed(0) + 'K',
    getTone: () => 'accent',
    getToneLabel: () => '보유량',
    decimals: 0,
  },
  {
    key: 'usdt',
    label: 'USDT 프리미엄',
    labelEn: 'USDT Premium',
    getValue: (d) => d.usdtPremium.premium,
    getTone: (d) => Math.abs(d.usdtPremium.premium) >= 1 ? 'negative' : 'neutral',
    getToneLabel: (d) => d.usdtPremium.premium > 0 ? '프리미엄' : d.usdtPremium.premium < 0 ? '디스카운트' : '중립',
    suffix: '%',
    decimals: 2,
  },
  {
    key: 'longShort',
    label: '롱숏 비율',
    labelEn: 'Long-Short Ratio',
    getValue: (d) => d.longShortRatio.ratio,
    getTone: (d) => d.longShortRatio.ratio > 1.2 ? 'positive' : d.longShortRatio.ratio < 0.8 ? 'negative' : 'neutral',
    getToneLabel: (d) => d.longShortRatio.ratio > 1 ? '롱 우위' : '숏 우위',
    decimals: 2,
  },
  {
    key: 'oi',
    label: '미결제약정',
    labelEn: 'Open Interest',
    getValue: (d) => (d.openInterest.totalUsd ?? 0) / 1_000_000_000,
    getTone: () => 'accent',
    getToneLabel: () => '총액',
    prefix: '$',
    suffix: 'B',
    decimals: 1,
  },
];

export default function DesktopMagazinePage() {
  const { data, error, loading } = useData();
  const [indicatorData, setIndicatorData] = useState<IndicatorsPageData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartTriggered, setChartTriggered] = useState(false);

  // Lazy-load chart data when charts section enters viewport
  useEffect(() => {
    if (!chartTriggered || chartLoading || indicatorData) return;
    setChartLoading(true);
    fetch('/api/indicators')
      .then((r) => r.json())
      .then((d) => setIndicatorData(d))
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, [chartTriggered, chartLoading, indicatorData]);

  // Signal counting
  const signalCounts = useMemo(() => {
    if (!data?.signal?.factors) return { positive: 0, neutral: 0, negative: 0, total: 0 };
    let positive = 0, neutral = 0, negative = 0;
    for (const f of data.signal.factors) {
      if (f.weightedScore > 0.1) positive++;
      else if (f.weightedScore < -0.1) negative++;
      else neutral++;
    }
    return { positive, neutral, negative, total: data.signal.factors.length };
  }, [data?.signal]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <OrbitalSilence />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-dot-sub">데이터를 불러올 수 없습니다</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-dot-text underline"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const btcPrice = data.kimp.binanceUsd ?? 0;
  // NOTE: data.kimp.premium is KIMP premium, not 24h BTC change.
  // TODO: Find the actual 24h BTC price change field in DashboardData.
  // If unavailable, use premium as placeholder or omit the change display.
  const btcChange = data.kimp.premium ?? 0;

  return (
    <>
      <FloatingProgress sections={PROGRESS_SECTIONS} />

      {/* Section 1: Masthead Hero */}
      <Masthead
        edition="BITFLOW DAILY"
        meta={`Vol. ${formatVol()} — ${todayFormatted()}`}
        headline={
          <NumberCounter
            value={btcPrice}
            prefix="$"
            decimals={0}
            format={(v) => `$${Math.round(v).toLocaleString()}`}
            className="text-6xl font-extrabold text-dot-text tracking-tighter"
          />
        }
        subhead={
          <span>
            Bitcoin —{' '}
            <span className={btcChange >= 0 ? 'text-dot-green font-semibold' : 'text-dot-red font-semibold'}>
              {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(1)}%
            </span>
          </span>
        }
        bottom={
          <div className="magazine-indicator-strip">
            {INDICATORS.slice(0, 5).map((ind) => (
              <div key={ind.key} className="magazine-indicator-strip-cell">
                <div className="magazine-indicator-strip-label">{ind.labelEn.split(' ')[0]}</div>
                <div className={`magazine-indicator-strip-value ${
                  ind.getTone(data) === 'positive' ? 'text-dot-green' :
                  ind.getTone(data) === 'negative' ? 'text-dot-red' : 'text-dot-text'
                }`}>
                  {ind.getDisplay?.(data) ?? ind.getValue(data).toFixed(ind.decimals ?? 1)}{ind.suffix ?? ''}
                </div>
              </div>
            ))}
          </div>
        }
      />

      {/* Section 2: Today's Headline */}
      <LightSection id="headline" className="bg-white">
        <ScrollReveal className="text-center max-w-2xl mx-auto">
          <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-4">
            Today&apos;s Signal
          </div>
          <h2 className="text-4xl font-extrabold text-dot-text tracking-tight leading-tight mb-3">
            {data.signal.description}
          </h2>
          <p className="text-sm text-dot-sub leading-relaxed mb-6">
            {data.signal.factors
              .filter((f) => Math.abs(f.weightedScore) > 0.3)
              .slice(0, 3)
              .map((f) => f.label)
              .join(', ')}
            {' '}등 주요 지표가 현재 시장 방향을 주도하고 있습니다.
          </p>
          <SignalBar
            total={signalCounts.total}
            positive={signalCounts.positive}
            neutral={signalCounts.neutral}
            negative={signalCounts.negative}
          />
        </ScrollReveal>
      </LightSection>

      {/* Section 3: Market Thermometer */}
      <LightSection id="thermometer">
        <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
          Market Thermometer
        </div>
        <div className="grid grid-cols-2 gap-3">
          {INDICATORS.map((ind, i) => (
            <ScrollReveal key={ind.key} delay={i * 60}>
              <IndicatorCard
                label={ind.label}
                labelEn={ind.labelEn}
                value={ind.getValue(data)}
                displayValue={ind.getDisplay?.(data)}
                tone={ind.getTone(data)}
                toneLabel={ind.getToneLabel(data)}
                prefix={ind.prefix}
                suffix={ind.suffix}
                decimals={ind.decimals}
              />
            </ScrollReveal>
          ))}
        </div>
      </LightSection>

      {/* Section 4: Chart Deep Dive — lazy load trigger */}
      <DarkSection id="charts">
        <ScrollReveal
          threshold={0.05}
          className=""
          // When this section becomes visible, trigger chart data fetch
        >
          <div
            ref={(el) => {
              if (el && !chartTriggered) {
                const obs = new IntersectionObserver(
                  ([e]) => { if (e.isIntersecting) { setChartTriggered(true); obs.disconnect(); } },
                  { threshold: 0.05 },
                );
                obs.observe(el);
              }
            }}
          >
            <div className="text-[10px] text-dot-muted uppercase tracking-[3px] mb-6">
              Deep Dive Charts
            </div>
            <div className="relative">
              <ParallaxDots layers={DARK_PARALLAX_LAYERS} />
              {chartLoading && (
                <div className="flex justify-center py-20">
                  <OrbitalSilence label="차트 데이터 로딩 중..." />
                </div>
              )}
              {indicatorData && (
                <div className="relative z-10 space-y-4">
                  {/* KIMP chart full width + stats */}
                  <ScrollReveal>
                    <div className="bg-dot-accent/80 border border-white/10 rounded-md p-5">
                      <KimpChart data={indicatorData.kimpHistory} />
                    </div>
                  </ScrollReveal>
                  <ScrollReveal delay={50}>
                    <KimpStatsCard data={indicatorData.kimpHistory} />
                  </ScrollReveal>
                  {/* 2-column: Funding + Fear&Greed */}
                  <div className="grid grid-cols-2 gap-4">
                    <ScrollReveal delay={100}>
                      <div className="bg-dot-accent/80 border border-white/10 rounded-md p-4">
                        <FundingRateHistoryChart data={indicatorData.fundingRateHistory} />
                      </div>
                    </ScrollReveal>
                    <ScrollReveal delay={200}>
                      <div className="bg-dot-accent/80 border border-white/10 rounded-md p-4">
                        <FearGreedHistoryChart data={indicatorData.fearGreedHistory} />
                      </div>
                    </ScrollReveal>
                  </div>
                </div>
              )}
              {!chartLoading && !indicatorData && chartTriggered && (
                <div className="text-center py-12 text-dot-muted text-sm">
                  차트 데이터를 불러올 수 없습니다
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      </DarkSection>

      {/* Sections 5-8 will be added in Task 10 */}
    </>
  );
}
```

**Important:** The chart component imports (`KimpChart`, `FundingRateHistoryChart`, etc.) need to be verified against actual file paths. Read `src/components/desktop/desktop-indicators-page.tsx` for the exact import paths used there and match them.

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit 2>&1 | head -20`

Fix any type errors — most likely around:
- Chart component import paths (may need adjustment)
- DashboardData field access patterns (verify against `src/lib/types.ts`)
- Signal factor properties

- [ ] **Step 4: Commit**

```bash
git add src/components/desktop/desktop-magazine-page.tsx
git commit -m "feat: main magazine page sections 1-4 (masthead, headline, thermometer, charts)"
```

---

### Task 10: Main Magazine Page — Sections 5-8

**Files:**
- Modify: `src/components/desktop/desktop-magazine-page.tsx`

Add remaining sections: Heatmap, Events, Tools, Footer.

- [ ] **Step 1: Read EventTracker and event-related components**

Read: `src/components/event-tracker.tsx` or wherever `EventTracker` / event data is defined.
Also read: `src/components/desktop/desktop-home-page.tsx` lines around MiniCalendar and EventStrip usage.

- [ ] **Step 2: Add Sections 5-8 to DesktopMagazinePage**

Replace the `{/* Sections 5-8 will be added in Task 10 */}` comment with:

```tsx
      {/* Section 5: BTC Returns Heatmap */}
      <LightSection id="heatmap">
        <ScrollReveal>
          <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
            Returns Heatmap
          </div>
          {indicatorData?.btcReturnsHistory ? (
            <BtcReturnHeatmap data={indicatorData.btcReturnsHistory} />
          ) : (
            <div className="text-center py-12 text-dot-muted text-sm">
              {chartTriggered ? '히트맵 데이터 로딩 중...' : '스크롤하여 데이터 로드'}
            </div>
          )}
        </ScrollReveal>
      </LightSection>

      {/* Section 6: Event Calendar */}
      <LightSection id="events" className="bg-white">
        <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
          Upcoming Events
        </div>
        <EventCalendar />
      </LightSection>

      {/* Section 7: Tools */}
      <LightSection id="tools">
        <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
          Tools
        </div>
        <ToolsGrid />
      </LightSection>

      {/* Section 8: Footer */}
      <MagazineFooter
        links={[
          { label: '온체인 딥다이브 →', sublabel: '더 깊이 읽기', href: '/desktop/onchain' },
          { label: '주간 아카이브 →', sublabel: '지난 이야기', href: '/desktop/weekly' },
        ]}
      />
```

- [ ] **Step 3: Add EventCalendar and ToolsGrid internal components**

Add these above the default export in the same file:

```tsx
// ── Internal: Event Calendar ──
// Import at top of file: import { getUpcomingEvents, type MarketEventWithCountdown } from '@/lib/events';

const EVENT_TYPE_BORDER: Record<string, string> = {
  fomc: 'border-l-dot-blue',
  cpi: 'border-l-dot-yellow',
  etf: 'border-l-dot-green',
  halving: 'border-l-dot-red',
  employment: 'border-l-dot-muted',
  other: 'border-l-dot-muted',
};

function EventCalendar() {
  // getUpcomingEvents() returns MarketEventWithCountdown[] with daysUntil calculated
  const events = getUpcomingEvents(5);

  if (events.length === 0) {
    return <div className="text-center text-dot-muted text-sm py-8">예정된 이벤트가 없습니다</div>;
  }

  return (
    <div className="flex gap-4">
      {events.map((event, i) => (
        <ScrollReveal key={`${event.date}-${event.title}`} delay={i * 80} className="flex-1">
          <div className={`border-l-[3px] ${EVENT_TYPE_BORDER[event.type] ?? EVENT_TYPE_BORDER.other} pl-3 py-2 bg-dot-bg rounded-r-md`}>
            <div className="text-[11px] font-semibold text-dot-text">{event.title}</div>
            <div className="text-[10px] text-dot-sub">
              {event.date} · <NumberCounter value={event.daysUntil} prefix="D-" decimals={0} duration={600} />
            </div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}

// ── Internal: Tools Grid ──

const TOOL_ITEMS = [
  { icon: '⚡', label: 'TX 수수료 계산기', section: 'prepare' },
  { icon: '📐', label: 'TX 사이즈 추정', section: 'prepare' },
  { icon: '🔄', label: '단위 변환기', section: 'prepare' },
  { icon: '🔧', label: 'UTXO 통합 플래너', section: 'prepare' },
  { icon: '🆘', label: '멈춘 TX 구조', section: 'recover' },
  { icon: '🔍', label: 'TX 상태 추적', section: 'recover' },
  { icon: '💱', label: '환율 차트', section: 'market' },
  { icon: '📈', label: 'KIMP 상관관계', section: 'market' },
  { icon: '📊', label: '차익거래 분석', section: 'market' },
];

function ToolsGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {TOOL_ITEMS.map((tool, i) => (
        <ScrollReveal key={tool.label} delay={i * 80}>
          <a
            href={`/desktop/tools#${tool.section}`}
            className="border border-dot-border/60 rounded-md p-4 text-center bg-white/50
                       hover:shadow-md hover:scale-[1.02] transition-all block"
          >
            <div className="text-xl mb-1">{tool.icon}</div>
            <div className="text-xs font-semibold text-dot-text">{tool.label}</div>
          </a>
        </ScrollReveal>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Connect EventCalendar to real data**

Read how EventTracker and EventStrip work in the existing codebase. Update the `EventCalendar` component to pull from the same event context/data source. This involves:
1. Finding the event data provider (likely a context or static data)
2. Mapping events to cards with color-coded borders
3. Calculating D-day countdown

- [ ] **Step 5: Verify compilation and commit**

Run: `npx tsc --noEmit 2>&1 | head -20`

```bash
git add src/components/desktop/desktop-magazine-page.tsx
git commit -m "feat: main magazine page sections 5-8 (heatmap, events, tools, footer)"
```

---

### Task 11: On-chain Magazine Page

**Files:**
- Create: `src/components/desktop/desktop-onchain-magazine.tsx`

Server-rendered on-chain deep dive with magazine layout.

- [ ] **Step 1: Read existing onchain page**

Read: `src/app/desktop/onchain/page.tsx`
Note: Data fetching functions, onchain card components, imports, data shape.

- [ ] **Step 2: Create desktop-onchain-magazine.tsx**

This receives pre-fetched data as props. It is rendered inside a client layout (MagazineLayout), but its children can be server-rendered onchain card components. The `ScrollReveal` and `FloatingProgress` are client components — they work fine as children of a server component.

```tsx
import { Masthead } from '@/components/desktop/magazine/masthead';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { LightSection } from '@/components/desktop/magazine/light-section';
import { DarkSection } from '@/components/desktop/magazine/dark-section';
import { MagazineFooter } from '@/components/desktop/magazine/magazine-footer';
import { FloatingProgress } from '@/components/desktop/magazine/floating-progress';
import { ParallaxDots, DARK_PARALLAX_LAYERS } from '@/components/motion/parallax-dots';
import OnchainRegimeCard from '@/components/onchain-regime-card';
import OnchainWhaleSummaryCard from '@/components/onchain-whale-summary-card';
import OnchainDormancyPulseCard from '@/components/onchain-dormancy-pulse-card';
import OnchainFlowPressureCard from '@/components/onchain-flow-pressure-card';
import OnchainAgeBandCard from '@/components/onchain-age-band-card';
import OnchainSupportResistanceCard from '@/components/onchain-support-resistance-card';
import OnchainMetricCard from '@/components/onchain-metric-card';
import OnchainEntityFlowCard from '@/components/onchain-entity-flow-card';
import OnchainBriefingCard from '@/components/onchain-briefing-card';
import HalvingCountdown from '@/components/halving-countdown';
import OnchainFeePressureCard from '@/components/onchain-fee-pressure-card';
import OnchainFeeRegimeHistoryCard from '@/components/onchain-fee-regime-history-card';
import OnchainBlockTempoCard from '@/components/onchain-block-tempo-card';
import type { OnchainSummary } from '@/lib/onchain';
import type { OnchainNetworkPulse } from '@/lib/onchain-monitor';
import {
  deriveOnchainAgeBands,
  deriveOnchainBriefing,
  deriveOnchainDormancyPulse,
  deriveOnchainFlowPressure,
  deriveOnchainRegime,
  deriveOnchainSupportResistance,
  deriveOnchainWhaleSummary,
} from '@/lib/onchain-monitor';

const ONCHAIN_SECTIONS = [
  { id: 'onchain-masthead', label: '마스트헤드' },
  { id: 'onchain-regime', label: '레짐' },
  { id: 'onchain-metrics', label: '지표' },
  { id: 'onchain-entity', label: '엔티티 흐름' },
];

interface Props {
  summary: OnchainSummary;
  networkPulse: OnchainNetworkPulse | null;
}

export default function DesktopOnchainMagazine({ summary, networkPulse }: Props) {
  // Derive all analysis data (same logic as current src/app/desktop/onchain/page.tsx:62-94)
  const visibleMetrics = summary.metrics.filter((m) => m.latestValue !== null);
  const regime = deriveOnchainRegime(summary.metrics, summary.alertStats);
  const whaleSummary = summary.status === 'available' ? deriveOnchainWhaleSummary(summary.alerts) : null;
  const dormancyPulse = deriveOnchainDormancyPulse(summary.metrics);
  const flowPressure = deriveOnchainFlowPressure(summary.entityFlows);
  const ageBands = deriveOnchainAgeBands(summary.metrics);
  const supportResistance = deriveOnchainSupportResistance(
    networkPulse?.marketContext ?? null, regime, whaleSummary, dormancyPulse, flowPressure,
  );
  const briefing = deriveOnchainBriefing({
    regime, whaleSummary, feePressure: networkPulse?.feePressure ?? null,
    dormancyPulse, flowPressure, ageBands, levels: supportResistance,
  });
  const feeHistory = networkPulse?.feeHistory ?? null;
  const visibleEntityFlows = summary.entityFlows.slice(0, 6);

  // Block number for masthead meta
  const latestBlock = networkPulse?.blockTempo?.latestBlock ?? '—';

  return (
    <>
      <FloatingProgress sections={ONCHAIN_SECTIONS} />

      {/* Section 1: Masthead */}
      <section id="onchain-masthead">
        <Masthead
          edition="BITFLOW ON-CHAIN"
          meta={`${new Date().toISOString().slice(0, 10).replace(/-/g, '.')} · Block #${latestBlock}`}
          headline={briefing?.headline ?? '온체인 네트워크 분석'}
          subhead={briefing?.summary}
        />
      </section>

      {/* Section 2: Regime Analysis — 2-column */}
      <LightSection id="onchain-regime" className="bg-white">
        <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
          Network Regime
        </div>
        <div className="grid grid-cols-2 gap-6">
          <ScrollReveal>
            <div className="min-w-0">
              {regime ? <OnchainRegimeCard regime={regime} /> : null}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="min-w-0">
              {whaleSummary ? <OnchainWhaleSummaryCard summary={whaleSummary} /> : null}
            </div>
          </ScrollReveal>
        </div>

        {/* Dormancy + Flow Pressure */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <ScrollReveal delay={150}>
            <div className="min-w-0">
              {dormancyPulse ? <OnchainDormancyPulseCard data={dormancyPulse} /> : null}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="min-w-0">
              {flowPressure ? <OnchainFlowPressureCard data={flowPressure} /> : null}
            </div>
          </ScrollReveal>
        </div>

        {/* Age Bands + Support/Resistance */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <ScrollReveal delay={250}>
            <div className="min-w-0">
              {ageBands ? <OnchainAgeBandCard data={ageBands} /> : null}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="min-w-0">
              {supportResistance ? <OnchainSupportResistanceCard data={supportResistance} /> : null}
            </div>
          </ScrollReveal>
        </div>

        {/* Network Pulse: Halving + Fee + Block */}
        <div className="mt-8">
          <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-4">
            Network Pulse
          </div>
          <div className="grid grid-cols-2 gap-6">
            <ScrollReveal delay={350}><div className="min-w-0"><HalvingCountdown /></div></ScrollReveal>
            <ScrollReveal delay={400}><div className="min-w-0">{networkPulse ? <OnchainFeePressureCard data={networkPulse.feePressure} /> : null}</div></ScrollReveal>
            <ScrollReveal delay={450}><div className="min-w-0">{feeHistory ? <OnchainFeeRegimeHistoryCard data={feeHistory} /> : null}</div></ScrollReveal>
            <ScrollReveal delay={500}><div className="min-w-0">{networkPulse ? <OnchainBlockTempoCard data={networkPulse.blockTempo} /> : null}</div></ScrollReveal>
          </div>
        </div>
      </LightSection>

      {/* Section 3: Metrics Grid — 3-column */}
      {visibleMetrics.length > 0 && (
        <LightSection id="onchain-metrics">
          <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
            On-chain Metrics
          </div>
          <div className="grid grid-cols-3 gap-5">
            {visibleMetrics.map((metric, i) => (
              <ScrollReveal key={metric.id} delay={i * 40}>
                <div className="min-w-0"><OnchainMetricCard metric={metric} /></div>
              </ScrollReveal>
            ))}
          </div>
        </LightSection>
      )}

      {/* Section 4: Entity Flow — dark */}
      {visibleEntityFlows.length > 0 && (
        <DarkSection id="onchain-entity">
          <div className="relative">
            <ParallaxDots layers={DARK_PARALLAX_LAYERS} />
            <div className="relative z-10">
              <div className="text-[10px] text-dot-muted uppercase tracking-[3px] mb-6">
                Entity Flow
              </div>
              <ScrollReveal>
                <OnchainEntityFlowCard flows={visibleEntityFlows} />
              </ScrollReveal>
            </div>
          </div>
        </DarkSection>
      )}

      {/* Section 5: Footer */}
      <MagazineFooter
        links={[
          { label: '← 메인 매거진', sublabel: '오늘의 브리핑', href: '/desktop' },
          { label: '주간 아카이브 →', sublabel: '지난 이야기', href: '/desktop/weekly' },
        ]}
      />
    </>
  );
}
```

**NOTE for implementer:** The `OnchainSummary` and `OnchainNetworkPulse` types and derive functions should be verified against the actual imports in `src/app/desktop/onchain/page.tsx`. Import paths are taken from that file's existing imports (lines 1-29).

- [ ] **Step 3: Commit**

```bash
git add src/components/desktop/desktop-onchain-magazine.tsx
git commit -m "feat: on-chain magazine page with scroll reveal sections"
```

---

### Task 12: Weekly Archive Magazine Page

**Files:**
- Create: `src/components/desktop/desktop-weekly-magazine.tsx`

- [ ] **Step 1: Read existing weekly page and report view**

Read:
- `src/app/desktop/weekly/page.tsx` — data fetching
- `src/components/desktop/desktop-weekly-report-view.tsx` — report rendering
- `src/app/desktop/weekly/[slug]/page.tsx` — detail route (if exists)

- [ ] **Step 2: Create desktop-weekly-magazine.tsx**

```tsx
import Link from 'next/link';
import { Masthead } from '@/components/desktop/magazine/masthead';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { LightSection } from '@/components/desktop/magazine/light-section';
import { MagazineFooter } from '@/components/desktop/magazine/magazine-footer';
import { FloatingProgress } from '@/components/desktop/magazine/floating-progress';
import { TimelineItem } from '@/components/desktop/magazine/timeline-item';
import type { WeeklyReportRecord, WeeklyReportArchiveItem } from '@/lib/types';

const WEEKLY_SECTIONS = [
  { id: 'weekly-masthead', label: '마스트헤드' },
  { id: 'weekly-latest', label: '최신호' },
  { id: 'weekly-archive', label: '아카이브' },
];

interface Props {
  report: WeeklyReportRecord | null;
  archive: WeeklyReportArchiveItem[];
}

function formatWeekDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export default function DesktopWeeklyMagazine({ report, archive }: Props) {
  const filteredArchive = archive.filter((a) => a.slug !== report?.slug);

  return (
    <>
      <FloatingProgress sections={WEEKLY_SECTIONS} />

      {/* Section 1: Masthead */}
      <section id="weekly-masthead">
        <Masthead
          edition="BITFLOW WEEKLY"
          meta={`Archive · 총 ${archive.length + (report ? 1 : 0)}호`}
          headline="주간 리포트 아카이브"
          subhead="매주 시장을 돌아보는 브리핑"
        />
      </section>

      {/* Section 2: Latest Issue Highlight */}
      <LightSection id="weekly-latest" className="bg-white">
        <ScrollReveal>
          <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-4">
            Latest Issue
          </div>
          {report ? (
            <Link
              href={`/desktop/weekly/${report.slug}`}
              className="block bg-dot-bg rounded-md p-6 border-l-4 border-dot-text hover:shadow-md transition-shadow"
            >
              <div className="text-[11px] text-dot-sub">
                {formatWeekDate(report.weekStart)} ~ {formatWeekDate(report.weekEnd)}
              </div>
              <h3 className="text-xl font-bold text-dot-text mt-2 mb-2">
                {report.title}
              </h3>
              <p className="text-[13px] text-dot-sub leading-relaxed line-clamp-3">
                {report.summary}
              </p>
              <div className="mt-3 text-xs font-semibold text-dot-text">
                전문 읽기 →
              </div>
            </Link>
          ) : (
            <div className="text-center py-12 text-dot-muted text-sm">
              최신 리포트가 없습니다
            </div>
          )}
        </ScrollReveal>
      </LightSection>

      {/* Section 3: Archive Timeline */}
      <LightSection id="weekly-archive">
        <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
          Past Issues
        </div>
        <div className="border-l-2 border-dot-border pl-5 flex flex-col gap-4">
          {filteredArchive.map((item, i) => (
            <ScrollReveal key={item.slug} delay={i * 60}>
              <TimelineItem
                href={`/desktop/weekly/${item.slug}`}
                title={`Vol. ${archive.length - i} — ${item.title}`}
                subtitle={`${formatWeekDate(item.weekStart)} ~ ${formatWeekDate(item.weekEnd)}`}
                isFirst={i === 0}
              />
            </ScrollReveal>
          ))}
        </div>
      </LightSection>

      {/* Footer */}
      <MagazineFooter
        links={[
          { label: '← 메인 매거진', sublabel: '오늘의 브리핑', href: '/desktop' },
          { label: '온체인 딥다이브 →', sublabel: '네트워크 분석', href: '/desktop/onchain' },
        ]}
      />
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/desktop/desktop-weekly-magazine.tsx
git commit -m "feat: weekly archive magazine page with timeline"
```

---

### Task 13: Update Route Files — Wire New Pages

**Files:**
- Modify: `src/app/desktop/layout.tsx` — Replace DesktopChrome with MagazineLayout
- Modify: `src/app/desktop/page.tsx` — Point to DesktopMagazinePage
- Modify: `src/app/desktop/onchain/page.tsx` — Use DesktopOnchainMagazine
- Modify: `src/app/desktop/weekly/page.tsx` — Use DesktopWeeklyMagazine
- Modify: `src/app/desktop/indicators/page.tsx` — Redirect to /desktop

- [ ] **Step 1: Update layout.tsx**

Replace `DesktopChrome` import with `MagazineLayout`:

```tsx
// Before: import { DesktopChrome } from '@/components/desktop/desktop-chrome';
import { MagazineLayout } from '@/components/desktop/magazine/magazine-layout';

// In the return, replace <DesktopChrome>...</DesktopChrome> with:
// <MagazineLayout>...</MagazineLayout>
```

Keep `DataProvider` and `EventTracker` wrappers unchanged.

- [ ] **Step 2: Update page.tsx (home)**

```tsx
import DesktopMagazinePage from '@/components/desktop/desktop-magazine-page';

export default function DesktopPage() {
  return <DesktopMagazinePage />;
}
```

- [ ] **Step 3: Update onchain/page.tsx**

Keep the existing data fetching (async server component), but pass data to new component:

```tsx
import DesktopOnchainMagazine from '@/components/desktop/desktop-onchain-magazine';

// Keep existing fetchOnchainSummary() + fetchOnchainNetworkPulse() logic
// Replace the JSX return with:
// return <DesktopOnchainMagazine summary={summary} networkPulse={networkPulse} />;
```

- [ ] **Step 4: Update weekly/page.tsx**

```tsx
import DesktopWeeklyMagazine from '@/components/desktop/desktop-weekly-magazine';

// Keep existing data fetching logic
// Replace the JSX return with:
// return <DesktopWeeklyMagazine report={report} archive={archive} />;
```

- [ ] **Step 5: Update indicators/page.tsx to redirect**

```tsx
import { redirect } from 'next/navigation';

export default function DesktopIndicatorsRoute() {
  redirect('/desktop');
}
```

- [ ] **Step 6: Verify build**

Run: `npm run build 2>&1 | tail -30`

Fix any build errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/desktop/
git commit -m "feat: wire magazine pages into desktop routes"
```

---

### Task 14: Update Supporting Pages

**Files:**
- Modify: `src/app/desktop/tools/page.tsx`
- Modify: `src/app/desktop/alert/page.tsx`
- Modify: `src/app/desktop/about/page.tsx`
- Modify: `src/app/desktop/contact/page.tsx`
- Modify: `src/app/desktop/disclaimer/page.tsx`
- Modify: `src/app/desktop/privacy/page.tsx`
- Modify: `src/app/desktop/weekly/[slug]/page.tsx` (if exists)

These pages keep their existing content but need to work under `MagazineLayout` instead of `DesktopChrome`. Since `MagazineLayout` is applied at the layout level (Task 13), these pages primarily need:

1. Replace `DesktopSurface` wrapping with simpler `magazine-content` class divs
2. Add back-navigation link at top
3. Keep all existing functional content

- [ ] **Step 1: Update each supporting page**

For each page, the pattern is:
- Add `<div className="magazine-content pt-20 pb-16">` wrapper (pt-20 for fixed header clearance)
- Add a back link: `<Link href="/desktop" className="text-xs text-dot-muted hover:text-dot-text">← 메인</Link>`
- Keep all existing section content inside
- Replace `DesktopSurface` with simple `<div className="bg-white border border-dot-border/60 rounded-md p-6 mb-4">` or use the existing `desktop-ui.tsx` components since they'll still work

- [ ] **Step 2: Update weekly/[slug] detail view**

Add back link "← 아카이브로 돌아가기" pointing to `/desktop/weekly`.
Add prev/next navigation at bottom if data is available.
Center the report body at `max-width: 800px`.

- [ ] **Step 3: Verify all pages render**

Run: `npm run dev` and manually navigate to each page:
- `/desktop/tools`
- `/desktop/alert`
- `/desktop/about`
- `/desktop/contact`
- `/desktop/disclaimer`
- `/desktop/privacy`
- `/desktop/weekly/[any-slug]`

- [ ] **Step 4: Commit**

```bash
git add src/app/desktop/
git commit -m "feat: migrate supporting pages to MagazineLayout"
```

---

### Task 15: CSS Cleanup + Final Polish

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Comment out old desktop-shell classes**

Don't delete yet — comment out with a note. The old classes are:
- `.desktop-shell`
- `.desktop-frame`
- `.desktop-rail`
- `.desktop-surface`
- `.desktop-hero`
- `.desktop-nav-link`, `.desktop-nav-link-active`

Add comment: `/* DEPRECATED: Old DesktopChrome classes — remove after confirming magazine layout works */`

- [ ] **Step 2: Verify no regressions**

Run: `npm run build 2>&1 | tail -20`

Run dev server and manually check:
- `/desktop` — Main magazine with all 8 sections scrolling
- `/desktop/onchain` — On-chain deep dive
- `/desktop/weekly` — Weekly archive
- `/desktop/tools` — Tools page with back nav
- Scroll animations working (reveal, parallax, counters)
- Floating progress bar appears and tracks sections
- Footer cross-links work
- Mobile routes unchanged (`/` still works)

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: deprecate old desktop-shell CSS classes"
```

---

### Task 16: Final Build Verification

- [ ] **Step 1: Full build check**

Run: `npm run build`

Expected: Clean build with no errors.

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`

Expected: No type errors.

- [ ] **Step 3: Lint check**

Run: `npm run lint` (if configured)

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve build/lint issues from magazine renewal"
```
