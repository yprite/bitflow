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
