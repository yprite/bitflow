# Desktop Philosophy Alignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 디자인 철학 문서 기준으로 데스크탑 페이지의 모든 위반 사항을 수정하여 "절제로 드러나는 비트코인의 본질" 원칙에 부합하게 만든다.

**Architecture:** P0→P3 우선순위 순서로 진행. 핵심은 "삭제"다 — 타이포 스케일 통일, Masthead 축소, 모션 제거, 상태 분기 제거, 컬러 단순화, 간격 정리, 컴포넌트 존재감 약화, 페이지 질감 통합. 새 컴포넌트를 만들지 않는다.

**Tech Stack:** Next.js App Router, Tailwind CSS, React, TypeScript

**Design Philosophy Rules (always verify against):**
- Typography: 20px headline (Bold), 14px body (Regular), 13px data (Bold), 11px caption (Regular) — no other sizes
- Colors: monochrome + 2 signals only (`signal-heat` #e53935, `signal-cool` #1e88e5) — no green, yellow
- Spacing scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` only
- States: present or absent — no loading/error/empty messages
- Components: invisible — user sees dots, text, whitespace only
- Motion: forgettable — user should not remember animation
- letter-spacing: only `0.02em` on caption 11px
- font-weight: Bold or Regular only

---

## File Map

### Core files to modify (순서 = 수정 순서)

| # | File | Responsibility |
|---|------|---------------|
| 1 | `tailwind.config.ts` | Remove `dot-green`, `dot-yellow` from palette |
| 2 | `src/app/globals.css` | Rewrite `.desktop-surface`, `.desktop-hero`, `.desktop-kicker`, `.magazine-masthead`, spacing/motion CSS |
| 3 | `src/components/desktop/desktop-ui.tsx` | Rewrite all 8 primitives — typography, color, spacing, remove card feel |
| 4 | `src/components/desktop/magazine/masthead.tsx` | Shrink from 72vh showcase to compact context header |
| 5 | `src/components/desktop/magazine/light-section.tsx` | Fix spacing (`py-14` → `py-12`) |
| 6 | `src/components/desktop/magazine/dark-section.tsx` | Fix spacing (`py-14` → `py-12`) |
| 7 | `src/components/desktop/magazine/signal-bar.tsx` | Remove 3-color bar, replace with monochrome dot density |
| 8 | `src/components/desktop/magazine/indicator-card.tsx` | Fix typography (24px→13px), remove color overuse |
| 9 | `src/components/desktop/magazine/floating-progress.tsx` | Remove (읽기 흐름 방해) |
| 10 | `src/components/desktop/magazine/magazine-footer.tsx` | Remove card wrapping, use text links, fix `p-5`→`p-4` |
| 11 | `src/components/desktop/magazine/timeline-item.tsx` | Simplify decorative elements |
| 12 | `src/components/desktop/desktop-magazine-page.tsx` | Major rewrite — remove ScrollReveal/NumberCounter/FloatingProgress, fix typography/color/state |
| 13 | `src/components/desktop/desktop-onchain-magazine.tsx` | Remove ScrollReveal cascade, fix typography |
| 14 | `src/components/desktop/desktop-weekly-magazine.tsx` | Remove ScrollReveal cascade, fix typography |
| 15 | `src/components/desktop/desktop-weekly-report-view.tsx` | Remove Hero+sidebar, fix card feel, fix typography |
| 16 | `src/components/desktop/magazine/magazine-layout.tsx` | Fix topbar typography/tracking |
| 17 | `src/app/desktop/tools/page.tsx` | Remove DotAssemblyReveal, Hero sidebar, dot-grid-sparse |
| 18 | `src/app/desktop/about/page.tsx` | Remove Hero sidebar, fix card feel |
| 19 | `src/app/desktop/contact/page.tsx` | Remove Hero sidebar, fix card feel |
| 20 | `src/app/desktop/privacy/page.tsx` | Fix typography |
| 21 | `src/app/desktop/disclaimer/page.tsx` | Fix typography |
| 22 | `src/app/desktop/weekly/[slug]/page.tsx` | Remove desktop-chip usage |
| 23 | `src/components/desktop/desktop-chrome.tsx` | Delete (unused, MagazineLayout is the sole chrome) |

### Files NOT modified (already correct or out of scope)
- `src/app/desktop/layout.tsx` — correct, uses MagazineLayout
- `src/app/desktop/page.tsx` — thin route, no changes needed
- `src/app/desktop/weekly/page.tsx` — thin route
- `src/app/desktop/onchain/page.tsx` — thin route
- Motion components (`scroll-reveal.tsx`, `number-counter.tsx`, `DotAssemblyReveal.tsx`) — not modified, just stop importing them

---

## Task 1: Tailwind Color Palette — Remove Forbidden Colors

**Files:**
- Modify: `tailwind.config.ts:11-23`

- [ ] **Step 1: Remove `dot-green` and `dot-yellow`**

```typescript
colors: {
  dot: {
    bg: '#f5f5f0',
    card: '#ffffff',
    border: '#d1d5db',
    text: '#1a1a1a',
    sub: '#6b7280',
    muted: '#9ca3af',
    red: '#e53935',
    blue: '#1e88e5',
    accent: '#111111',
  },
},
```

Remove `green: '#00c853'` and `yellow: '#f9a825'`. Philosophy allows only 2 signal colors.

- [ ] **Step 2: Verify no remaining references to removed colors**

Run: `grep -r "dot-green\|dot-yellow" src/ --include="*.tsx" --include="*.ts" --include="*.css"`

If any references found, they must be changed to monochrome alternatives in later tasks.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "style: remove dot-green and dot-yellow from palette — philosophy allows only 2 signal colors"
```

---

## Task 2: globals.css — Rewrite Desktop & Magazine CSS

**Files:**
- Modify: `src/app/globals.css:9-303`

- [ ] **Step 1: Rewrite `.desktop-surface` — remove accent bar and card feel**

Replace lines 9-24:

```css
.desktop-surface {
  position: relative;
  border-top: 1px solid rgba(17,17,17,0.08);
}
```

Remove the `::before` pseudo-element entirely (accent bar decoration). Remove `border-bottom` and `background` — let content breathe with whitespace only.

- [ ] **Step 2: Remove `.desktop-hero` grid layout**

Replace lines 25-31:

```css
.desktop-hero {
  padding: 24px 0;
}
```

Remove `grid-template-columns: minmax(0, 1.55fr) 280px` — no sidebar pattern. Padding uses allowed 24px.

- [ ] **Step 3: Fix `.desktop-kicker` letter-spacing**

Replace lines 32-38:

```css
.desktop-kicker {
  font-size: 11px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #6b7280;
}
```

Change `0.18em` → `0.02em` (only allowed letter-spacing for caption). Size 10px → 11px (caption scale).

- [ ] **Step 4: Fix `.magazine-masthead` — remove 100vh**

Replace line 174-181:

```css
.magazine-masthead {
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
```

Remove `min-height: 100vh` and `justify-content: space-between`.

- [ ] **Step 5: Fix `.magazine-masthead-bar` typography**

Replace lines 183-191:

```css
.magazine-masthead-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
```

Change `font-size: 12px` → `11px` (caption scale). Change `letter-spacing: 2px` → `0.02em`.

- [ ] **Step 6: Remove `.magazine-masthead-divider`**

Delete lines 193-197 entirely (decorative divider).

- [ ] **Step 7: Fix `.magazine-indicator-strip` — remove border-radius**

Replace lines 204-229:

```css
.magazine-indicator-strip {
  display: flex;
  gap: 1px;
  background: #d1d5db;
  overflow: hidden;
}

.magazine-indicator-strip-cell {
  flex: 1;
  background: #ffffff;
  padding: 8px;
  text-align: center;
}

.magazine-indicator-strip-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.magazine-indicator-strip-value {
  font-size: 13px;
  font-weight: 700;
}
```

Border-radius: 0 (philosophy: no rounded corners). Label size 8px→11px (caption). Value size 16px→13px (data). Label letter-spacing 1px→0.02em. Cell padding 10px→8px (allowed scale).

- [ ] **Step 8: Fix `.magazine-topbar-link` letter-spacing**

Replace lines 136-143:

```css
.magazine-topbar-link {
  position: relative;
  padding: 8px 0;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #6b7280;
}
```

Change `0.14em` → `0.02em`.

- [ ] **Step 9: Remove `.desktop-chip` class entirely**

Delete lines 49-58. Chips are not in the philosophy's component set.

- [ ] **Step 10: Remove `.scroll-reveal-hidden/visible` classes**

Delete lines 231-241. ScrollReveal motion is being removed.

- [ ] **Step 11: Remove `.floating-progress` related classes**

Delete lines 247-302 (`.floating-progress`, `.floating-progress.visible`, `.floating-progress-dot`, `.floating-progress-dot:hover`, `.floating-progress-dot.active`, `.floating-progress-line`, and the reduced-motion variants).

- [ ] **Step 12: Commit**

```bash
git add src/app/globals.css
git commit -m "style: align desktop CSS with design philosophy — remove decorations, fix typography/spacing"
```

---

## Task 3: desktop-ui.tsx — Rewrite All Primitives

**Files:**
- Modify: `src/components/desktop/desktop-ui.tsx`

- [ ] **Step 1: Simplify tone system to heat/cool/(absent)**

Replace `desktopToneClass` function:

```tsx
export function desktopToneClass(tone?: 'heat' | 'cool') {
  switch (tone) {
    case 'heat':
      return 'text-dot-red';
    case 'cool':
      return 'text-dot-blue';
    default:
      return 'text-dot-text';
  }
}
```

Only 2 signal colors. Default is monochrome (no color = neutral/accent).

- [ ] **Step 2: Simplify `DesktopSurface`**

```tsx
export function DesktopSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cx('desktop-surface', className)}>{children}</section>;
}
```

No change to component itself — the CSS change (Task 2) handles the visual.

- [ ] **Step 3: Rewrite `DesktopHero` — remove sidebar pattern**

```tsx
export function DesktopHero({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <DesktopSurface className="py-6">
      <div className="space-y-3">
        <p className="desktop-kicker">{eyebrow}</p>
        <h1 className="text-[20px] font-bold leading-[1.3] text-dot-text">
          {title}
        </h1>
        <div className="max-w-3xl text-[14px] leading-[1.6] text-dot-sub">
          {description}
        </div>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </DesktopSurface>
  );
}
```

Remove `sidebar` prop. Title: 28px→20px (headline). Remove tracking adjustments. Remove grid layout.

- [ ] **Step 4: Rewrite `DesktopSectionHeader`**

```tsx
export function DesktopSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-2">
        <p className="desktop-kicker">{eyebrow}</p>
        <h2 className="text-[20px] font-bold text-dot-text">{title}</h2>
        {description ? (
          <div className="max-w-3xl text-[11px] leading-[1.5] text-dot-sub">
            {description}
          </div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
```

Title: 20px→20px (ok). Description: 12px→11px (caption). Remove tracking.

- [ ] **Step 5: Rewrite `DesktopStatCard`**

```tsx
export function DesktopStatCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: 'heat' | 'cool';
}) {
  return (
    <div className="border-t border-dot-border py-3">
      <p className="desktop-kicker">{label}</p>
      <div className={cx('mt-2 text-[13px] font-bold', desktopToneClass(tone))}>
        {value}
      </div>
      {detail ? <div className="mt-1 text-[11px] leading-[1.5] text-dot-sub">{detail}</div> : null}
    </div>
  );
}
```

Value: 22px→13px (data scale). Background: remove `bg-white/40`. Border: `border border-dot-border/35` → `border-t border-dot-border` (top only, no opacity). Tone: 4-type→2-type.

- [ ] **Step 6: Rewrite `DesktopTextCard`**

```tsx
export function DesktopTextCard({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: ReactNode;
}) {
  return (
    <div className="border-t border-dot-border py-4">
      <p className="desktop-kicker">{label}</p>
      <h3 className="mt-2 text-[14px] font-bold text-dot-text">{title}</h3>
      <div className="mt-1 text-[14px] leading-[1.6] text-dot-sub">{body}</div>
    </div>
  );
}
```

Title: 18px→14px (body, bold). Remove `bg-white/40` and `border border-dot-border/35`. Use `border-t` only.

- [ ] **Step 7: Rewrite `DesktopLinkCard`**

```tsx
export function DesktopLinkCard({
  eyebrow,
  title,
  body,
  href,
  label,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  label: string;
}) {
  return (
    <Link href={href} className="desktop-surface block py-4">
      <div className="space-y-2">
        <p className="desktop-kicker">{eyebrow}</p>
        <h3 className="text-[14px] font-bold text-dot-text">{title}</h3>
        <p className="text-[14px] leading-[1.6] text-dot-sub">{body}</p>
        <span className="inline-flex items-center gap-2 text-[11px] text-dot-text">
          {label}
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
```

Title: 18px→14px. Link label: 12px→11px, remove `font-medium`. Remove `p-5` and `hover:bg-white/70`.

- [ ] **Step 8: Rewrite `DesktopBulletList`**

```tsx
export function DesktopBulletList({
  items,
  numbered = false,
}: {
  items: ReactNode[];
  numbered?: boolean;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 text-[14px] leading-[1.6] text-dot-sub">
          <span className="mt-0.5 w-6 shrink-0 text-[11px] text-dot-muted">
            {numbered ? String(index + 1).padStart(2, '0') : '·'}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
```

Text: 13px→14px (body). Number/dot: 11px (caption). Remove `font-mono`.

- [ ] **Step 9: Rewrite `DesktopEmptyState`**

```tsx
export function DesktopEmptyState({
  title,
  body,
}: {
  title: string;
  body: ReactNode;
}) {
  return (
    <DesktopSurface className="py-8">
      <div className="mx-auto max-w-2xl space-y-2">
        <h2 className="text-[20px] font-bold text-dot-text">{title}</h2>
        <div className="text-[14px] leading-[1.6] text-dot-sub">{body}</div>
      </div>
    </DesktopSurface>
  );
}
```

Remove "No Data" kicker (explicit state text). Title: 24px→20px. Body: 14px→14px. Remove `text-center`. Remove `p-8` → `py-8`.

- [ ] **Step 10: Commit**

```bash
git add src/components/desktop/desktop-ui.tsx
git commit -m "style: rewrite desktop-ui primitives — align typography/color/spacing with philosophy"
```

---

## Task 4: Masthead — Shrink to Context Header

**Files:**
- Modify: `src/components/desktop/magazine/masthead.tsx`

- [ ] **Step 1: Rewrite masthead to compact context header**

```tsx
import { type ReactNode } from 'react';

interface MastheadProps {
  edition: string;
  meta: string;
  headline: ReactNode;
  subhead?: ReactNode;
  bottom?: ReactNode;
}

export function Masthead({
  edition,
  meta,
  headline,
  subhead,
  bottom,
}: MastheadProps) {
  return (
    <section id="masthead" className="magazine-masthead magazine-section-light border-b border-dot-border">
      <div className="magazine-content py-16">
        <div className="magazine-masthead-bar">
          <span className="text-dot-text">{edition}</span>
          <span className="text-[11px] text-dot-sub">{meta}</span>
        </div>

        <div className="mt-8 max-w-3xl space-y-3">
          <h1 className="text-[20px] font-bold leading-[1.3] text-dot-text">
            {headline}
          </h1>
          {subhead && (
            <p className="max-w-2xl text-[14px] leading-[1.6] text-dot-sub">{subhead}</p>
          )}
        </div>

        {bottom && <div className="mt-8">{bottom}</div>}
      </div>
    </section>
  );
}
```

Key changes:
- Remove `min-h-[72vh]` (CSS already handled in Task 2)
- Remove `center` prop
- Remove `magazine-masthead-divider` (decorative)
- `py-24` → `py-16` (64px, max allowed)
- Headline: `text-[42px]` → `text-[20px] font-bold` (headline scale)
- Subhead: already 14px (ok)
- Remove `flex min-h-[72vh] flex-col justify-between` → simple flow
- Border: `border-dot-border/20` → `border-dot-border` (no opacity)

- [ ] **Step 2: Commit**

```bash
git add src/components/desktop/magazine/masthead.tsx
git commit -m "style: shrink masthead from 72vh showcase to compact context header"
```

---

## Task 5: Light/Dark Section — Fix Spacing

**Files:**
- Modify: `src/components/desktop/magazine/light-section.tsx`
- Modify: `src/components/desktop/magazine/dark-section.tsx`

- [ ] **Step 1: Fix LightSection spacing**

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
      className={`magazine-full-bleed magazine-section-light border-t border-dot-border py-12 ${className}`}
    >
      <div className="magazine-content">{children}</div>
    </section>
  );
}
```

`py-14` → `py-12` (48px, allowed). `border-dot-border/15` → `border-dot-border` (no opacity). Remove `md:py-16`.

- [ ] **Step 2: Fix DarkSection spacing**

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
      className={`magazine-full-bleed magazine-section-dark border-t border-white/10 py-12 ${className}`}
    >
      <div className="magazine-content">{children}</div>
    </section>
  );
}
```

Same: `py-14` → `py-12`.

- [ ] **Step 3: Commit**

```bash
git add src/components/desktop/magazine/light-section.tsx src/components/desktop/magazine/dark-section.tsx
git commit -m "style: fix section spacing py-14 to py-12 (48px allowed scale)"
```

---

## Task 6: SignalBar — Monochrome Dot Density

**Files:**
- Modify: `src/components/desktop/magazine/signal-bar.tsx`

- [ ] **Step 1: Replace 3-color bar with monochrome density**

```tsx
interface SignalBarProps {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
}

export function SignalBar({ total, positive, neutral, negative }: SignalBarProps) {
  return (
    <div role="img" aria-label={`${total}개 지표 중 ${positive}개 긍정 · ${neutral}개 중립 · ${negative}개 부정`}>
      <div className="flex justify-center gap-1">
        {Array(total).fill(0).map((_, i) => {
          const isActive = i < positive || i >= total - negative;
          return (
            <div
              key={i}
              className={`h-1 w-6 ${isActive ? 'bg-dot-text' : 'bg-dot-border'}`}
            />
          );
        })}
      </div>
      <div className="mt-2 text-center text-[11px] text-dot-muted">
        {total}개 지표: {positive} 긍정 · {neutral} 중립 · {negative} 부정
      </div>
    </div>
  );
}
```

Replace `bg-dot-blue`/`bg-dot-red`/`bg-dot-muted` with `bg-dot-text`/`bg-dot-border` (monochrome). Fix `gap-[3px]` → `gap-1` (4px). Fix `h-1.5` → `h-1` (4px).

- [ ] **Step 2: Commit**

```bash
git add src/components/desktop/magazine/signal-bar.tsx
git commit -m "style: convert signal bar to monochrome density — remove 3-color violation"
```

---

## Task 7: IndicatorCard — Fix Typography and Color

**Files:**
- Modify: `src/components/desktop/magazine/indicator-card.tsx`

- [ ] **Step 1: Rewrite with philosophy-compliant typography**

```tsx
type Tone = 'heat' | 'cool';

const TONE_COLORS: Record<Tone, string> = {
  heat: 'text-dot-red',
  cool: 'text-dot-blue',
};

interface IndicatorCardProps {
  label: string;
  labelEn: string;
  value: number;
  displayValue?: string;
  tone?: Tone;
  toneLabel: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

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
  const colorClass = tone ? TONE_COLORS[tone] : 'text-dot-text';

  return (
    <div className="border-t border-dot-border flex items-center justify-between py-3">
      <div>
        <div className="text-[11px] text-dot-sub">{label}</div>
        <div className="text-[11px] text-dot-muted">{labelEn}</div>
      </div>
      <div className="text-right">
        <div className={`text-[13px] font-bold ${colorClass}`}>
          {displayValue ?? `${prefix}${value.toFixed(decimals ?? 1)}${suffix}`}
        </div>
        <div className={`text-[11px] ${colorClass}`}>{toneLabel}</div>
      </div>
    </div>
  );
}
```

Key changes:
- Remove NumberCounter import (static display)
- Value: `text-2xl` (24px) → `text-[13px]` (data scale)
- Tone: 4-type → 2-type (heat/cool)
- Layout: `desktop-surface p-4` → `border-t border-dot-border py-3`

- [ ] **Step 2: Commit**

```bash
git add src/components/desktop/magazine/indicator-card.tsx
git commit -m "style: fix indicator card — 13px data scale, 2-tone only, remove card feel"
```

---

## Task 8: Remove FloatingProgress

**Files:**
- Modify: `src/components/desktop/magazine/floating-progress.tsx` (keep file but export empty/noop)

- [ ] **Step 1: Replace with noop component**

```tsx
interface Section {
  id: string;
  label: string;
}

interface FloatingProgressProps {
  sections: Section[];
}

/** Removed per design philosophy — side navigation dots distract from reading flow */
export function FloatingProgress(_props: FloatingProgressProps) {
  return null;
}
```

Keep the interface so imports don't break. Render nothing.

- [ ] **Step 2: Commit**

```bash
git add src/components/desktop/magazine/floating-progress.tsx
git commit -m "style: remove floating progress dots — distracts from reading flow"
```

---

## Task 9: Magazine Footer — Remove Card Wrapping

**Files:**
- Modify: `src/components/desktop/magazine/magazine-footer.tsx`

- [ ] **Step 1: Rewrite footer as text links**

```tsx
import Link from 'next/link';

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
    <section className="magazine-full-bleed border-t border-dot-border py-12">
      <div className="magazine-content space-y-8">
        <div className="flex gap-8">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="group">
              <div className="text-[11px] text-dot-muted">{link.sublabel}</div>
              <div className="text-[14px] font-bold text-dot-text group-hover:text-dot-accent">
                {link.label}
              </div>
            </Link>
          ))}
        </div>
        <div className="flex gap-6 text-[11px] text-dot-muted">
          <Link href="/desktop/about" className="hover:text-dot-text">소개</Link>
          <Link href="/desktop/contact" className="hover:text-dot-text">문의</Link>
          <Link href="/desktop/disclaimer" className="hover:text-dot-text">면책</Link>
          <Link href="/desktop/privacy" className="hover:text-dot-text">개인정보</Link>
        </div>
      </div>
    </section>
  );
}
```

Remove `desktop-surface block p-5` card wrapping. Use plain text links. Fix sublabel: `text-[11px]` (caption). Fix label: `text-[16px]` → `text-[14px]` (body). Fix `border-dot-border/20` → `border-dot-border`. Grid → flex. Bottom links: `text-[10px]` → `text-[11px]` (caption).

- [ ] **Step 2: Commit**

```bash
git add src/components/desktop/magazine/magazine-footer.tsx
git commit -m "style: remove card wrapping from footer — text links only"
```

---

## Task 10: Timeline Item — Simplify

**Files:**
- Modify: `src/components/desktop/magazine/timeline-item.tsx`

- [ ] **Step 1: Simplify to text-only row**

```tsx
import Link from 'next/link';

interface TimelineItemProps {
  href: string;
  title: string;
  subtitle: string;
  isFirst?: boolean;
}

export function TimelineItem({ href, title, subtitle }: TimelineItemProps) {
  return (
    <Link href={href} className="flex items-baseline justify-between gap-4 py-2 group">
      <div>
        <div className="text-[14px] font-bold text-dot-text group-hover:text-dot-accent">
          {title}
        </div>
        <div className="text-[11px] text-dot-sub">{subtitle}</div>
      </div>
      <div className="text-[11px] text-dot-muted group-hover:text-dot-text shrink-0">
        읽기 →
      </div>
    </Link>
  );
}
```

Remove decorative dot (`h-[5px] w-[5px]`). Remove `isFirst` usage (no visual differentiation). Title: 13px→14px (body, bold). Subtitle: 11px (caption).

- [ ] **Step 2: Commit**

```bash
git add src/components/desktop/magazine/timeline-item.tsx
git commit -m "style: simplify timeline item — remove decorative dot, text only"
```

---

## Task 11: Magazine Layout — Fix Topbar Typography

**Files:**
- Modify: `src/components/desktop/magazine/magazine-layout.tsx`

- [ ] **Step 1: Fix brand name tracking and sizes**

In the brand section (around line 67-69), change:
```tsx
<span className="text-[11px] font-bold uppercase tracking-[0.02em] text-dot-text">
```

(was `text-[10px]` and `tracking-[0.2em]`)

- [ ] **Step 2: Commit**

```bash
git add src/components/desktop/magazine/magazine-layout.tsx
git commit -m "style: fix topbar typography — 11px caption, 0.02em tracking"
```

---

## Task 12: Desktop Magazine Page — Major Rewrite

**Files:**
- Modify: `src/components/desktop/desktop-magazine-page.tsx`

This is the largest task. Key changes:
1. Remove all ScrollReveal imports and usage
2. Remove NumberCounter — use static text
3. Remove FloatingProgress (already noop but clean imports)
4. Fix all typography to 4-scale
5. Fix tone system to heat/cool
6. Remove loading/error messages
7. Fix spacing values

- [ ] **Step 1: Clean imports**

Remove these imports:
```tsx
// REMOVE:
import { FloatingProgress } from '@/components/desktop/magazine/floating-progress';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { NumberCounter } from '@/components/motion/number-counter';
```

Keep FloatingProgress import if you want (it's noop), but cleaner to remove.

- [ ] **Step 2: Fix Tone type to heat/cool**

Change `type Tone = 'positive' | 'negative' | 'neutral' | 'accent';` to:
```tsx
type Tone = 'heat' | 'cool' | undefined;
```

Update all `getTone` in INDICATORS array:
- `'positive'` → `'heat'`
- `'negative'` → `'cool'`
- `'neutral'` → `undefined`
- `'accent'` → `undefined`

- [ ] **Step 3: Remove loading/error states**

Replace the loading/error blocks (lines 300-322) with:
```tsx
if (!data) return null;
```

One line. Data is present or absent.

- [ ] **Step 4: Remove FloatingProgress usage**

Remove `<FloatingProgress sections={PROGRESS_SECTIONS} />` and the `PROGRESS_SECTIONS` constant.

- [ ] **Step 5: Rewrite Masthead call — fix typography**

Replace the Masthead section:
```tsx
<Masthead
  edition="BITFLOW DAILY"
  meta={`Vol. ${formatVol()} — ${todayFormatted()}`}
  headline={`$${Math.round(btcPrice).toLocaleString()}`}
  subhead={
    <span>
      Bitcoin — {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(1)}%
    </span>
  }
  bottom={
    <div className="magazine-indicator-strip">
      {INDICATORS.slice(0, 5).map((ind) => (
        <div key={ind.key} className="magazine-indicator-strip-cell">
          <div className="magazine-indicator-strip-label">{ind.labelEn.split(' ')[0]}</div>
          <div className="magazine-indicator-strip-value">
            {ind.getDisplay?.(data) ?? ind.getValue(data).toFixed(ind.decimals ?? 1)}{ind.suffix ?? ''}
          </div>
        </div>
      ))}
    </div>
  }
/>
```

Remove NumberCounter (static `$` + number). Remove color classes from subhead (`text-dot-blue`/`text-dot-red` — monochrome by default). Remove `text-6xl font-extrabold tracking-tighter` (headline is 20px in Masthead now).

- [ ] **Step 6: Rewrite headline section — remove ScrollReveal**

Replace the Today's Signal section:
```tsx
<LightSection id="headline" className="bg-white">
  <div className="text-center max-w-2xl mx-auto">
    <div className="desktop-kicker mb-4">
      Today's Signal
    </div>
    <h2 className="text-[20px] font-bold text-dot-text leading-[1.3] mb-3">
      {data.signal.description}
    </h2>
    <p className="text-[14px] text-dot-sub leading-[1.6] mb-6">
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
  </div>
</LightSection>
```

Remove ScrollReveal wrapper. Fix `text-4xl font-extrabold` → `text-[20px] font-bold`. Fix `text-sm` → `text-[14px]`. Fix `text-[10px] tracking-[3px]` → `desktop-kicker`.

- [ ] **Step 7: Rewrite thermometer section — remove ScrollReveal**

```tsx
<LightSection id="thermometer">
  <div className="desktop-kicker mb-6">
    Market Thermometer
  </div>
  <div className="grid grid-cols-2 gap-3">
    {INDICATORS.map((ind) => (
      <IndicatorCard
        key={ind.key}
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
    ))}
  </div>
</LightSection>
```

Remove all ScrollReveal wrappers and stagger delays.

- [ ] **Step 8: Rewrite charts section — remove ScrollReveal, fix loading state**

Replace chart section to remove ScrollReveal wrappers and explicit loading/error text:
```tsx
<LightSection id="charts">
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
    <div className="desktop-kicker mb-6">
      Deep Dive Charts
    </div>
    {indicatorData && (
      <div className="space-y-4">
        <DesktopSurface className="p-4">
          <KimpChart data={indicatorData.kimpHistory} />
        </DesktopSurface>
        {kimpStats && (
          <KimpStatsCard stats={kimpStats} period="30일" />
        )}
        <div className="grid grid-cols-2 gap-4">
          <DesktopSurface className="p-4">
            <FundingRateHistoryChart data={indicatorData.fundingRateHistory} />
          </DesktopSurface>
          <DesktopSurface className="p-4">
            <FearGreedHistoryChart data={indicatorData.fearGreedHistory} />
          </DesktopSurface>
        </div>
      </div>
    )}
  </div>
</LightSection>
```

Remove loading text "차트 데이터를 정리하는 중입니다." Remove error text "차트 데이터를 불러올 수 없습니다." Data is present or absent. Keep IntersectionObserver for lazy loading (functional, not decorative).

- [ ] **Step 9: Rewrite heatmap section**

```tsx
<LightSection id="heatmap">
  <div className="desktop-kicker mb-6">
    Returns Heatmap
  </div>
  {indicatorData?.btcReturnsHistory ? (
    <BtcReturnHeatmap data={indicatorData.btcReturnsHistory} />
  ) : null}
</LightSection>
```

Remove "히트맵 데이터 로딩 중..." and "스크롤하여 데이터 로드" messages.

- [ ] **Step 10: Rewrite events section — remove ScrollReveal**

```tsx
function EventCalendar() {
  const events = getUpcomingEvents(5);
  if (events.length === 0) return null;

  return (
    <div className="flex gap-4">
      {events.map((event) => (
        <div key={`${event.date}-${event.title}`} className="flex-1 border-t border-dot-border py-3">
          <div className="text-[11px] font-bold text-dot-text">{event.title}</div>
          <div className="text-[11px] text-dot-sub">
            {event.date} · D-{event.daysUntil}
          </div>
        </div>
      ))}
    </div>
  );
}
```

Remove ScrollReveal. Remove NumberCounter on D-day. Remove `border-l-[2px]` color coding. Remove "예정된 이벤트가 없습니다" message (return null). Fix `text-[10px]` → `text-[11px]`.

- [ ] **Step 11: Rewrite tools section — remove ScrollReveal**

```tsx
function ToolsGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {TOOL_ITEMS.map((tool) => (
        <a
          key={tool.label}
          href={`/desktop/tools#${tool.section}`}
          className="desktop-surface block p-4 text-left"
        >
          <p className="desktop-kicker">{tool.section}</p>
          <div className="mt-2 text-[11px] font-bold text-dot-text">{tool.label}</div>
        </a>
      ))}
    </div>
  );
}
```

Remove ScrollReveal wrapper. Fix `text-[12px]` → `text-[11px]`.

- [ ] **Step 12: Remove EVENT_TYPE_BORDER constant**

Delete the `EVENT_TYPE_BORDER` record entirely (no longer used).

- [ ] **Step 13: Commit**

```bash
git add src/components/desktop/desktop-magazine-page.tsx
git commit -m "style: rewrite magazine page — remove all motion, fix typography/color/state"
```

---

## Task 13: Desktop Onchain Magazine — Remove Motion Cascade

**Files:**
- Modify: `src/components/desktop/desktop-onchain-magazine.tsx`

- [ ] **Step 1: Remove ScrollReveal and FloatingProgress imports**

Remove:
```tsx
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { FloatingProgress } from '@/components/desktop/magazine/floating-progress';
```

- [ ] **Step 2: Remove FloatingProgress usage**

Delete `<FloatingProgress sections={ONCHAIN_SECTIONS} />` and the `ONCHAIN_SECTIONS` constant.

- [ ] **Step 3: Remove all ScrollReveal wrappers**

Unwrap every `<ScrollReveal>` and `<ScrollReveal delay={N}>` — keep only the inner content. For example:

```tsx
// Before
<ScrollReveal>
  <div className="min-w-0">
    {regime ? <OnchainRegimeCard regime={regime} /> : null}
  </div>
</ScrollReveal>

// After
<div className="min-w-0">
  {regime ? <OnchainRegimeCard regime={regime} /> : null}
</div>
```

Do this for all ~12 ScrollReveal instances.

- [ ] **Step 4: Fix section kicker typography**

Change all `text-[10px] text-dot-sub uppercase tracking-[3px]` to `desktop-kicker`:

```tsx
<div className="desktop-kicker mb-6">Network Regime</div>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/desktop/desktop-onchain-magazine.tsx
git commit -m "style: remove motion cascade from onchain page — fix typography"
```

---

## Task 14: Desktop Weekly Magazine — Remove Motion

**Files:**
- Modify: `src/components/desktop/desktop-weekly-magazine.tsx`

- [ ] **Step 1: Remove ScrollReveal and FloatingProgress**

Remove imports. Remove FloatingProgress and WEEKLY_SECTIONS. Unwrap all ScrollReveal.

- [ ] **Step 2: Fix latest issue link — remove card decoration**

Replace:
```tsx
<Link
  href={`/desktop/weekly/${report.slug}`}
  className="block border-t border-dot-border py-4"
>
```

Remove `desktop-surface border-l-2 border-dot-text p-6` (decorative left border + card). Fix typography: `text-xl` → `text-[20px]` (ok, headline). Fix `text-[13px]` (ok, data approx).

- [ ] **Step 3: Fix archive section — remove decorative timeline**

Replace `border-l border-dot-border/40 pl-5` with simple stack:
```tsx
<div className="flex flex-col gap-4">
```

Remove the left timeline line. Timeline items are already simplified (Task 10).

- [ ] **Step 4: Fix empty state**

Replace `"최신 리포트가 없습니다"` message:
```tsx
{report ? (
  /* link content */
) : null}
```

Return null for absent data.

- [ ] **Step 5: Commit**

```bash
git add src/components/desktop/desktop-weekly-magazine.tsx
git commit -m "style: remove motion and decorations from weekly magazine"
```

---

## Task 15: Desktop Weekly Report View — Remove App Dashboard Feel

**Files:**
- Modify: `src/components/desktop/desktop-weekly-report-view.tsx`

- [ ] **Step 1: Remove sidebar grid layout**

Replace the outer wrapper:
```tsx
// Before: xl:grid-cols-[minmax(0,1fr)_300px] with aside
// After: single column
<div className="space-y-6">
```

Remove the `<aside>` archive sidebar entirely. Archive navigation belongs in the weekly archive page, not in every report detail.

- [ ] **Step 2: Fix DesktopHero call — remove sidebar prop**

```tsx
<DesktopHero
  eyebrow={eyebrow}
  title={title}
  description={description}
  action={action}
/>
```

Remove `sidebar` prop (no longer accepted by DesktopHero).

- [ ] **Step 3: Fix DesktopStatCard tone values**

Change all `tone="neutral"` to no tone (default monochrome):
```tsx
<DesktopStatCard label="BTC 가격" value={formatCurrency(report.marketSnapshot.priceUsd)} />
```

- [ ] **Step 4: Fix NewsCard typography and styling**

Change `text-[18px]` → `text-[14px]` for title. Change `bg-white/40` → remove. Change `border-dot-border/35` → `border-dot-border`. Change `hover:border-dot-accent/30` → `hover:border-dot-accent`.

- [ ] **Step 5: Fix ArchiveCard — remove if unused, or simplify**

Since sidebar is removed, ArchiveCard is no longer used in this component. Remove the component definition.

- [ ] **Step 6: Fix `text-[15px]` → `text-[14px]`**

Line 202: `text-[15px]` is not in allowed scale. Change to `text-[14px]`.

- [ ] **Step 7: Remove `desktop-chip` usage from section headings**

The description at line 277 says "PC 카드 묶음으로 재배치" — this is chrome-style language. Just keep functional headings.

- [ ] **Step 8: Commit**

```bash
git add src/components/desktop/desktop-weekly-report-view.tsx
git commit -m "style: remove app dashboard feel from weekly report — single column, fix typography"
```

---

## Task 16: Tools Page — Remove DotAssemblyReveal and Hero Sidebar

**Files:**
- Modify: `src/app/desktop/tools/page.tsx`

- [ ] **Step 1: Remove DotAssemblyReveal import and all usages**

Remove `import DotAssemblyReveal from ...`. Unwrap all 4 `<DotAssemblyReveal>` wrappers.

- [ ] **Step 2: Rewrite DesktopHero call — remove sidebar**

```tsx
<DesktopHero
  eyebrow="Bitcoin Utility Deck"
  title="도구"
  description="BTC 전송 준비, 막힌 거래 복구, 상태 확인, 단위 계산, UTXO 정리, 재정거래 판단을 데스크톱 작업 흐름으로 묶었습니다."
/>
```

Remove `sidebar` prop and the 3 anchor cards. Remove `action={<ToolsGuideContent />}`.

- [ ] **Step 3: Remove ToolsGuideContent function**

Delete `ToolsGuideContent` (has `dot-grid-sparse` decorative backgrounds). The guide info is now in the hero description.

- [ ] **Step 4: Fix ToolSection — space-y-5 → space-y-6**

In `ToolSection` component, change `space-y-5` → `space-y-6` (24px).

- [ ] **Step 5: Fix back link typography**

Change `tracking-[0.14em]` → `tracking-[0.02em]` on the "개요" back link.

- [ ] **Step 6: Commit**

```bash
git add src/app/desktop/tools/page.tsx
git commit -m "style: remove DotAssemblyReveal and hero sidebar from tools page"
```

---

## Task 17: About/Contact/Privacy/Disclaimer Pages — Remove Hero Sidebar, Fix Typography

**Files:**
- Modify: `src/app/desktop/about/page.tsx`
- Modify: `src/app/desktop/contact/page.tsx`
- Modify: `src/app/desktop/privacy/page.tsx`
- Modify: `src/app/desktop/disclaimer/page.tsx`

- [ ] **Step 1: Fix About page**

Remove `sidebar` prop from DesktopHero (has 3 DesktopStatCards as sidebar). Fix back link tracking.

- [ ] **Step 2: Fix Contact page**

Remove `sidebar` prop from DesktopHero. Fix back link tracking.

- [ ] **Step 3: Fix Privacy page**

Fix back link tracking. Fix `text-[14px]` in description to use body class consistently.

- [ ] **Step 4: Fix Disclaimer page**

Fix back link tracking.

- [ ] **Step 5: Fix all back links across all 4 pages**

Change `tracking-[0.14em]` → `tracking-[0.02em]` on all "개요" back links.

- [ ] **Step 6: Commit**

```bash
git add src/app/desktop/about/page.tsx src/app/desktop/contact/page.tsx src/app/desktop/privacy/page.tsx src/app/desktop/disclaimer/page.tsx
git commit -m "style: fix auxiliary pages — remove hero sidebar, fix typography/tracking"
```

---

## Task 18: Weekly [slug] Page — Remove desktop-chip

**Files:**
- Modify: `src/app/desktop/weekly/[slug]/page.tsx`

- [ ] **Step 1: Remove desktop-chip usage**

Replace:
```tsx
action={<span className="desktop-chip">{formatPublishedAt(report.publishedAt)}</span>}
```
with:
```tsx
action={<span className="text-[11px] text-dot-muted">{formatPublishedAt(report.publishedAt)}</span>}
```

desktop-chip class is removed (Task 2). Use caption styling instead.

- [ ] **Step 2: Commit**

```bash
git add src/app/desktop/weekly/\\[slug\\]/page.tsx
git commit -m "style: replace desktop-chip with caption text in weekly detail"
```

---

## Task 19: Delete desktop-chrome.tsx

**Files:**
- Delete: `src/components/desktop/desktop-chrome.tsx`

- [ ] **Step 1: Verify no imports reference desktop-chrome**

Run: `grep -r "desktop-chrome" src/ --include="*.tsx" --include="*.ts"`

Should only find the file itself. If referenced elsewhere, remove the import.

- [ ] **Step 2: Delete the file**

```bash
rm src/components/desktop/desktop-chrome.tsx
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete unused desktop-chrome.tsx — MagazineLayout is sole chrome"
```

---

## Task 20: Build Verification

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: no TypeScript errors, no build failures. If DesktopHero `sidebar` prop removal causes type errors in pages not yet updated, fix them.

- [ ] **Step 2: Fix any type errors**

Common issues:
- Pages passing `sidebar` to DesktopHero — remove the prop
- Pages using old 4-type tone — change to `heat`/`cool`/omit
- Pages using `desktop-chip` class — replace with caption text

- [ ] **Step 3: Grep for remaining violations**

```bash
# Typography violations
grep -rn "text-6xl\|text-5xl\|text-4xl\|text-3xl\|text-2xl\|text-xl\|text-\[42px\]\|text-\[28px\]\|text-\[24px\]\|text-\[22px\]\|text-\[18px\]\|text-\[16px\]\|text-\[15px\]\|text-\[12px\]\|text-\[10px\]\|text-\[8px\]" src/components/desktop/ src/app/desktop/

# Tracking violations
grep -rn "tracking-\[3px\]\|tracking-\[0\.2em\]\|tracking-\[0\.18em\]\|tracking-\[0\.14em\]\|tracking-\[0\.16em\]\|tracking-tighter\|tracking-tight\|tracking-\[-" src/components/desktop/ src/app/desktop/

# Weight violations
grep -rn "font-extrabold\|font-medium" src/components/desktop/ src/app/desktop/

# Color violations
grep -rn "dot-green\|dot-yellow\|bg-white/40\|border-dot-border/" src/components/desktop/ src/app/desktop/

# State message violations
grep -rn "로딩\|에러\|불러올 수 없\|정리하는 중\|없습니다" src/components/desktop/ src/app/desktop/

# Spacing violations
grep -rn "py-14\|py-24\|p-5 \|space-y-5" src/components/desktop/ src/app/desktop/
```

- [ ] **Step 4: Fix remaining violations found by grep**

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "fix: resolve remaining philosophy violations found by grep audit"
```

---

## Verification Checklist (from DESKTOP_REVISION_PLAN.md §8-12)

After all tasks complete, verify:

- [ ] All text sizes are 20px / 14px / 13px / 11px only
- [ ] font-weight is Bold or Regular only
- [ ] letter-spacing is only `0.02em` on caption 11px
- [ ] Signal colors are only `signal-heat` and `signal-cool` (2 total)
- [ ] `dot-green`, `dot-yellow` tokens removed from Tailwind config
- [ ] `bg-white/40`, `border-dot-border/35` etc. opacity variants removed
- [ ] Masthead `min-h-[72vh]` changed to content-height
- [ ] ScrollReveal not used except possibly 1 above-fold instance
- [ ] NumberCounter, DotAssemblyReveal removed
- [ ] `desktop-surface::before` accent bar removed
- [ ] `/desktop/weekly/[slug]` and `/desktop/tools` have same texture as magazine pages
- [ ] `desktop-chrome.tsx` deleted
- [ ] Spacing values use only `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` scale
- [ ] No "로딩 중", "에러", "데이터 없음" messages in UI
- [ ] `npm run build` passes
