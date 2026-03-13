'use client';

import DotText, { type DotTextAnimation } from './DotText';

interface DotHeadlineProps {
  text: string;
  /** Scale factor. Default 6 (large headline). */
  fontScale?: number;
  /** Animation mode. Default 'breathing'. */
  animationMode?: DotTextAnimation;
  className?: string;
}

/**
 * Large dot-rendered headline.
 * Uses bigger fontScale and breathing animation by default.
 * For hero sections, page titles, and prominent section headers.
 */
export default function DotHeadline({
  text,
  fontScale = 6,
  animationMode = 'breathing',
  className = '',
}: DotHeadlineProps) {
  return (
    <DotText
      text={text.toUpperCase()}
      fontScale={fontScale}
      spacing={2}
      minRadius={0.12}
      maxRadius={0.42}
      opacityRange={[0.5, 0.95]}
      animationMode={animationMode}
      className={className}
    />
  );
}
