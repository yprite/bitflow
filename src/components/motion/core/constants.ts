/** Shared constants for the halftone motion system. */

// ── Dot sizing ──
export const MIN_DOT_RADIUS = 0.4;
export const STANDARD_DOT_RADIUS = 1.0;
export const EMPHASIS_DOT_RADIUS = 2.5;
export const MAX_DOT_RADIUS = 6.0;

// ── Ambient ──
export const AMBIENT_GRID_SPACING = 20;
export const AMBIENT_BASE_RADIUS = 0.6;
export const AMBIENT_MAX_OPACITY = 0.12;
export const AMBIENT_WAVE_SPEED = 0.0008;
export const AMBIENT_WAVE_AMPLITUDE = 0.4;

// ── Timing (ms) ──
export const DATA_TRANSITION_DURATION = 400;
export const INTERACTION_RESPONSE_DURATION = 200;
export const PARTICLE_FADE_DURATION = 800;
export const PULSE_DURATION = 600;
export const MEMORY_RESIDUE_FADE = 600;
export const REGIME_SHIFT_DURATION = 3500;

// ── Stagger ──
export const DOT_STAGGER_MS = 30;
export const PULSE_STAGGER_MS = 40;

// ── Easing bezier control points ──
export const EASE_DOT_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_DOT_IN_OUT = [0.45, 0, 0.55, 1] as const;
export const EASE_DOT_SPRING = [0.34, 1.56, 0.64, 1] as const;
export const EASE_DOT_FADE = [0.4, 0, 0.2, 1] as const;

// ── Density limits ──
export const MAX_AMBIENT_DOTS = 2000;
export const MAX_CHART_DOTS = 30;
export const MAX_STORYTELLING_DOTS = 300;
export const MAX_SCREEN_ANIMATED = 500;

// ── Thresholds ──
export const PREMIUM_THRESHOLDS = [1, 3, 5];
export const DATA_BREATHING_THRESHOLD = 4;
export const CORRELATION_THRESHOLD = 0.5;

// ── Performance ──
export const FRAME_SKIP_THRESHOLD_MS = 32;
export const RESIZE_DEBOUNCE_MS = 100;

// ── Colors ──
export const DOT_COLOR = '#1a1a1a';
export const DOT_GREEN = '#00c853';
export const DOT_RED = '#e53935';
export const DOT_BLUE = '#1e88e5';
