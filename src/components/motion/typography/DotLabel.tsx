'use client';

import DotText, { type DotTextAnimation } from './DotText';

interface DotLabelProps {
  text: string;
  /** Scale factor. Default 3 (compact label). */
  fontScale?: number;
  animationMode?: DotTextAnimation;
  className?: string;
}

/**
 * Small dot-rendered label for section headers, chart annotations,
 * and dashboard category tags.
 * Compact scale, minimal animation, high legibility.
 */
export default function DotLabel({
  text,
  fontScale = 3,
  animationMode = 'none',
  className = '',
}: DotLabelProps) {
  return (
    <DotText
      text={text.toUpperCase()}
      fontScale={fontScale}
      spacing={1}
      minRadius={0.1}
      maxRadius={0.4}
      opacityRange={[0.7, 1.0]}
      animationMode={animationMode}
      className={className}
    />
  );
}
