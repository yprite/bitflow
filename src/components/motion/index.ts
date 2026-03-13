// Core
export { useDotField } from './core/useDotField';
export { useReducedMotion } from './core/useReducedMotion';
export { useResizeObserver } from './core/useResizeObserver';
export * from './core/constants';
export * from './core/dot-types';
export * from './core/dot-math';

// Ambient
export { default as TidalGrid } from './ambient/TidalGrid';

// Indicators
export { default as DotCluster } from './indicators/DotCluster';
export { default as DotGauge } from './indicators/DotGauge';
export { default as DotScale } from './indicators/DotScale';
export { default as InsightBloom } from './indicators/InsightBloom';

// Chart
export { default as PriceDiscoveryDot } from './chart/PriceDiscoveryDot';
export { default as MemoryResidue } from './chart/MemoryResidue';

// Heatmap
export { default as ConvictionLens, convictionDotStyle } from './heatmap/ConvictionLens';
export { default as PressureBar } from './heatmap/PressureBar';

// Storytelling
export { default as OrbitalSilence } from './storytelling/OrbitalSilence';

// Typography
export { default as DotText } from './typography/DotText';
export { default as DotHeadline } from './typography/DotHeadline';
export { default as DotMorphHeadline } from './typography/DotMorphHeadline';
export { default as DotLabel } from './typography/DotLabel';
export { default as DotMorphNumber } from './typography/DotMorphNumber';
export { default as DotKPIValue } from './typography/DotKPIValue';
export { parseText, parseGlyph, GLYPH_MAP, GLYPH_COLS, GLYPH_ROWS } from './typography/dot-font';
export type { TextDot, GlyphDot } from './typography/dot-font';

// Transitions
export { useDotMorph } from './transitions/useDotMorph';
export { useUpdateResidue } from './transitions/useUpdateResidue';
export { useFieldTransition } from './transitions/useFieldTransition';
export { default as DotMorphTransition } from './transitions/DotMorphTransition';
export { default as DotValueRefresh, refreshStyle, residueStyle } from './transitions/DotValueRefresh';
export { default as DotTabBar } from './transitions/DotTabBar';
export type { MorphMode, MorphDot, UseDotMorphConfig, UseDotMorphResult } from './transitions/useDotMorph';
export type { ResidueState, UseUpdateResidueConfig } from './transitions/useUpdateResidue';
export type { UseFieldTransitionConfig, FieldTransitionState } from './transitions/useFieldTransition';
export type { DotTab, DotTabBarProps } from './transitions/DotTabBar';
