'use client';

/**
 * Chart Overlay System
 *
 * SVG overlay components that apply the halftone dot design language
 * to chart visualizations. Each overlay reveals a different dimension
 * of the data: significance, thresholds, momentum, recency, uncertainty.
 *
 * All overlays are pure SVG <g> elements meant to compose inside
 * an existing chart <svg>. They use only monochrome values (#1a1a1a)
 * with opacity variations for the halftone effect.
 *
 * Every overlay respects reduced motion: when active, animated
 * elements render as static final states.
 */

import { DOT_COLOR } from '../core/constants';
import { valueNoise, clamp, smoothstep } from '../core/dot-math';

// ─── Shared types ───

export interface ChartPoint {
  x: number;
  y: number;
  value: number;
}

// ─── 1. Signal Density ───
// Dots sized by data significance. Meaningful movement resolves into
// crisp, larger dots. Flat noise stays small and diffuse.

export interface SignalDensityConfig {
  /** Threshold values that define "significance". Points near these are larger. */
  thresholds?: number[];
  /** Min dot radius (noise floor). Default 0.5 */
  minRadius?: number;
  /** Max dot radius (signal peak). Default 2.2 */
  maxRadius?: number;
  /** Min opacity (noise). Default 0.25 */
  minOpacity?: number;
  /** Max opacity (signal). Default 0.92 */
  maxOpacity?: number;
}

function computeSignificance(
  value: number,
  delta: number,
  thresholds: number[],
): number {
  // Factor 1: rate of change (normalized)
  const deltaSig = clamp(Math.abs(delta) * 4, 0, 1);

  // Factor 2: proximity to any threshold
  let thresholdSig = 0;
  for (const t of thresholds) {
    const dist = Math.abs(value - t);
    // Closer to threshold = higher significance
    thresholdSig = Math.max(thresholdSig, 1 - clamp(dist / 2, 0, 1));
  }

  // Factor 3: absolute magnitude (extreme values are significant)
  const magnitudeSig = clamp(Math.abs(value) / 5, 0, 1);

  // Weighted combination
  return clamp(deltaSig * 0.35 + thresholdSig * 0.4 + magnitudeSig * 0.25, 0, 1);
}

export function SignalDensity({
  points,
  config = {},
}: {
  points: ChartPoint[];
  config?: SignalDensityConfig;
}) {
  const {
    thresholds = [0],
    minRadius = 0.5,
    maxRadius = 2.2,
    minOpacity = 0.25,
    maxOpacity = 0.92,
  } = config;

  if (points.length === 0) return null;

  return (
    <g aria-hidden="true">
      {points.map((p, i) => {
        const prev = i > 0 ? points[i - 1].value : p.value;
        const delta = p.value - prev;
        const sig = computeSignificance(p.value, delta, thresholds);

        const r = minRadius + sig * (maxRadius - minRadius);
        const opacity = minOpacity + sig * (maxOpacity - minOpacity);

        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={r}
            fill={DOT_COLOR}
            opacity={opacity}
          />
        );
      })}
    </g>
  );
}

// ─── 2. Threshold Field ───
// Dot-density bands that activate around threshold values.
// When data is near a threshold, the zone becomes visually "live" —
// denser dots make the threshold feel present and active.

export interface ThresholdFieldConfig {
  /** Threshold value in data space. */
  value: number;
  /** Y position of the threshold in chart coordinates. */
  y: number;
  /** Chart x bounds [left, right]. */
  xRange: [number, number];
  /** How many data points are near this threshold (0–1 activation). */
  activation: number;
  /** Band height in chart units (±). Default 4 */
  bandHeight?: number;
}

export function ThresholdField({
  thresholds,
}: {
  thresholds: ThresholdFieldConfig[];
}) {
  return (
    <g aria-hidden="true">
      {thresholds.map((t, ti) => {
        const { y, xRange, activation, bandHeight = 4 } = t;
        if (activation < 0.05) return null;

        // Generate dots along the threshold band
        const dots: Array<{ x: number; y: number; r: number; o: number }> = [];
        const count = Math.floor(12 + activation * 18);
        const xSpan = xRange[1] - xRange[0];

        for (let i = 0; i < count; i++) {
          const nx = valueNoise(i * 7.3, ti * 13.1, 42);
          const ny = valueNoise(i * 11.7, ti * 5.3, 73);
          const x = xRange[0] + nx * xSpan;
          const yOffset = (ny - 0.5) * bandHeight * 2;
          const distFromCenter = Math.abs(yOffset) / bandHeight;

          // Dots closer to the threshold line are larger and more opaque
          const falloff = 1 - smoothstep(0, 1, distFromCenter);
          const r = 0.3 + falloff * activation * 0.6;
          const o = 0.04 + falloff * activation * 0.1;

          dots.push({ x, y: y + yOffset, r, o });
        }

        return (
          <g key={ti}>
            {dots.map((d, di) => (
              <circle
                key={di}
                cx={d.x}
                cy={d.y}
                r={d.r}
                fill={DOT_COLOR}
                opacity={d.o}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

// ─── 3. Pressure Field ───
// Adds intermediate dots between data points where the delta is high.
// High momentum → tight dot clusters along the line. Low momentum → empty.

export function PressureField({
  points,
  /** Minimum delta magnitude to trigger pressure dots. Default 0.3 */
  threshold = 0.3,
}: {
  points: ChartPoint[];
  threshold?: number;
}) {
  if (points.length < 2) return null;

  const dots: Array<{ x: number; y: number; r: number; o: number }> = [];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const delta = Math.abs(curr.value - prev.value);

    if (delta < threshold) continue;

    // Intensity: how much pressure to show
    const intensity = clamp((delta - threshold) / 3, 0, 1);
    const count = Math.floor(2 + intensity * 5);

    for (let j = 0; j < count; j++) {
      const t = (j + 1) / (count + 1);
      const x = prev.x + (curr.x - prev.x) * t;
      const y = prev.y + (curr.y - prev.y) * t;

      // Add subtle perpendicular scatter
      const scatter = valueNoise(x * 3.7, y * 2.9, j * 17);
      const perpOffset = (scatter - 0.5) * 2 * intensity;

      dots.push({
        x,
        y: y + perpOffset,
        r: 0.3 + intensity * 0.4,
        o: 0.06 + intensity * 0.12,
      });
    }
  }

  if (dots.length === 0) return null;

  return (
    <g aria-hidden="true">
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={DOT_COLOR}
          opacity={d.o}
        />
      ))}
    </g>
  );
}

// ─── 4. Data Afterglow ───
// The most recent data point(s) emit a fading halo. The newest
// point is visually "hot" — it hasn't settled yet.

export interface DataAfterglowConfig {
  /** How many trailing points get the glow. Default 3 */
  trailLength?: number;
  /** Halo radius on the newest point. Default 4 */
  haloRadius?: number;
  /** Whether to animate (pulse). Ignored if reduced motion. */
  animate?: boolean;
}

export function DataAfterglow({
  points,
  config = {},
  reducedMotion = false,
}: {
  points: ChartPoint[];
  config?: DataAfterglowConfig;
  reducedMotion?: boolean;
}) {
  const { trailLength = 3, haloRadius = 4, animate = true } = config;
  if (points.length === 0) return null;

  const trailStart = Math.max(0, points.length - trailLength);
  const trail = points.slice(trailStart);
  const newest = points[points.length - 1];

  return (
    <g aria-hidden="true">
      {/* Halo rings on newest point */}
      <circle
        cx={newest.x}
        cy={newest.y}
        r={haloRadius}
        fill="none"
        stroke={DOT_COLOR}
        strokeWidth="0.3"
        opacity={0.06}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={newest.x}
        cy={newest.y}
        r={haloRadius * 0.6}
        fill={DOT_COLOR}
        opacity={0.04}
      />

      {/* Trail emphasis: recent points get progressively larger */}
      {trail.map((p, i) => {
        const recency = (i + 1) / trail.length; // 0→1, newest = 1
        const extraR = recency * 1.2;
        const glowOpacity = recency * 0.1;

        return (
          <g key={`trail-${i}`}>
            {/* Subtle glow behind */}
            <circle
              cx={p.x}
              cy={p.y}
              r={1.5 + extraR + 1}
              fill={DOT_COLOR}
              opacity={glowOpacity}
            />
          </g>
        );
      })}

      {/* Pulsing newest dot */}
      {animate && !reducedMotion && (
        <circle
          cx={newest.x}
          cy={newest.y}
          r={2}
          fill={DOT_COLOR}
          opacity={0.15}
        >
          <animate
            attributeName="r"
            values="2;3.5;2"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.15;0.04;0.15"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
}

// ─── 5. Uncertainty Haze ───
// The trailing edge of the chart (most recent data) appears less
// resolved — dots scatter away from the line, sizes vary randomly.
// Represents incomplete consensus or recency bias.

export function UncertaintyHaze({
  points,
  /** Fraction of chart width affected (from right). Default 0.18 */
  extent = 0.18,
  /** Maximum scatter offset. Default 2.5 */
  maxScatter = 2.5,
}: {
  points: ChartPoint[];
  extent?: number;
  maxScatter?: number;
}) {
  if (points.length < 4) return null;

  const startIdx = Math.floor(points.length * (1 - extent));
  const hazePoints = points.slice(startIdx);

  if (hazePoints.length < 2) return null;

  const dots: Array<{ x: number; y: number; r: number; o: number }> = [];

  hazePoints.forEach((p, i) => {
    const hazeFactor = (i + 1) / hazePoints.length; // 0→1 toward edge

    // 2-3 scattered ghost dots per point
    const count = Math.ceil(1 + hazeFactor * 2);
    for (let j = 0; j < count; j++) {
      const nx = valueNoise(p.x * 5.1, j * 7.3, 19);
      const ny = valueNoise(p.x * 3.7, j * 11.1, 37);
      const scatter = hazeFactor * maxScatter;

      dots.push({
        x: p.x + (nx - 0.5) * scatter * 2,
        y: p.y + (ny - 0.5) * scatter * 2,
        r: 0.3 + (1 - hazeFactor) * 0.4,
        o: 0.04 + (1 - hazeFactor) * 0.06,
      });
    }
  });

  return (
    <g aria-hidden="true">
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={DOT_COLOR}
          opacity={d.o}
        />
      ))}
    </g>
  );
}
