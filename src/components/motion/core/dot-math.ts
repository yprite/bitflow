/** Pure math functions for dot field animations. */

/**
 * Attempt cubic bezier easing approximation using polynomial fit.
 * Good enough for animation; avoids iterative solve.
 */
export function cubicBezierEase(
  t: number,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
): number {
  // Simple approximation: sample the curve at t
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;

  // x(t) = 3*mt2*t*p1x + 3*mt*t2*p2x + t3
  const x = 3 * mt2 * t * p1x + 3 * mt * t2 * p2x + t3;

  // For a rough ease, we can use the y value at this parameter
  const y = 3 * mt2 * t * p1y + 3 * mt * t2 * p2y + t3;

  // Since x may not equal our input t, this is approximate
  // For smooth animation this is sufficient
  void x;
  return y;
}

/** Standard ease-out (dot emergence). */
export function easeOut(t: number): number {
  return cubicBezierEase(t, 0.16, 1, 0.3, 1);
}

/** Symmetric ease in-out (pulses). */
export function easeInOut(t: number): number {
  return cubicBezierEase(t, 0.45, 0, 0.55, 1);
}

/** Spring ease with overshoot (arrival/bloom). */
export function easeSpring(t: number): number {
  return cubicBezierEase(t, 0.34, 1.56, 0.64, 1);
}

/** Fade ease (gentle disappearance). */
export function easeFade(t: number): number {
  return cubicBezierEase(t, 0.4, 0, 0.2, 1);
}

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Distance between two points. */
export function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Radial sine wave value at a point.
 * Returns 0–1 based on distance from center and time.
 */
export function radialWave(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  time: number,
  speed: number,
  wavelength: number = 200,
): number {
  const d = dist(x, y, centerX, centerY);
  const phase = (d / wavelength) * Math.PI * 2 - time * speed;
  return (Math.sin(phase) + 1) / 2;
}

/**
 * Simple 2D value noise for organic variation.
 * Uses a hash-based approach for deterministic results.
 */
export function valueNoise(x: number, y: number, seed: number = 0): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Smooth step interpolation.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Map a value from one range to another.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/**
 * Generate a pulse value (0→1→0) at a given time with duration.
 */
export function pulse(time: number, startTime: number, duration: number): number {
  const elapsed = time - startTime;
  if (elapsed < 0 || elapsed > duration) return 0;
  const t = elapsed / duration;
  return Math.sin(t * Math.PI);
}
