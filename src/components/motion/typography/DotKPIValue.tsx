'use client';

import DotMorphNumber from './DotMorphNumber';
import { DOT_GREEN, DOT_RED, DOT_COLOR } from '../core/constants';
import type { MorphMode } from '../transitions/useDotMorph';

interface DotKPIValueProps {
  /** The numeric value to display. */
  value: number;
  /** Decimal places. Default 2. */
  decimals?: number;
  /** Suffix like '%' or '원'. Default ''. */
  suffix?: string;
  /** Whether to show +/- sign. Default true. */
  showSign?: boolean;
  /** Whether to color green/red by sign. Default true. */
  colorBySentiment?: boolean;
  /** Override color. */
  color?: string;
  /** Scale. Default 5 for dashboard cards, 8 for hero. */
  fontScale?: number;
  /** Morph mode. Default 'reconfigure'. */
  morphMode?: MorphMode;
  /** Morph duration in ms. Default 500. */
  morphDuration?: number;
  className?: string;
}

/**
 * KPI value display with dot morphing.
 *
 * Designed for the primary numeric readouts on dashboard cards:
 * - Kimchi premium percentage
 * - Funding rate
 * - Fear & Greed index
 * - Arbitrage profit
 *
 * Automatically colors by sentiment (green positive, red negative)
 * and shows a sign prefix.
 */
export default function DotKPIValue({
  value,
  decimals = 2,
  suffix = '',
  showSign = true,
  colorBySentiment = true,
  color,
  fontScale = 5,
  morphMode = 'reconfigure',
  morphDuration = 500,
  className = '',
}: DotKPIValueProps) {
  const resolvedColor = color ?? (
    colorBySentiment
      ? value >= 0 ? DOT_GREEN : DOT_RED
      : DOT_COLOR
  );

  return (
    <DotMorphNumber
      value={value}
      decimals={decimals}
      prefix={showSign ? '+' : ''}
      suffix={suffix}
      fontScale={fontScale}
      morphDuration={morphDuration}
      morphMode={morphMode}
      pulseStrength={0.25}
      residueAmount={0.18}
      residueDuration={500}
      color={resolvedColor}
      residueColor={DOT_COLOR}
      className={className}
    />
  );
}
