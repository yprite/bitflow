/** Core dot field types for the halftone motion system. */

export interface Dot {
  x: number;
  y: number;
  baseRadius: number;
  currentRadius: number;
  opacity: number;
  phase: number;
  vx: number;
  vy: number;
}

export interface DotFieldConfig {
  /** Canvas width in CSS pixels */
  width: number;
  /** Canvas height in CSS pixels */
  height: number;
  /** Device pixel ratio */
  dpr: number;
  /** Default dot size in CSS pixels */
  baseRadius: number;
  /** Distance between dots in CSS pixels */
  gridSpacing: number;
  /** Dot fill color */
  color: string;
  /** Maximum dot opacity (0–1) */
  maxOpacity: number;
  /** If true, skip all animation and render static frame */
  reducedMotion: boolean;
}

export interface DotFieldState {
  dots: Dot[];
  time: number;
  frame: number;
  paused: boolean;
}

export interface WaveParams {
  speed: number;
  amplitude: number;
  centerX: number;
  centerY: number;
}

export type DotModifier = (dots: Dot[], time: number, dt: number) => void;

export type AnimationPhase = 'idle' | 'entering' | 'active' | 'exiting';
