'use client';

interface PressureBarProps {
  /** Premium value (negative or positive). */
  premium: number;
  /** Color for the dot pattern. */
  color: string;
  /** 0–1 opacity of the fill. */
  opacity: number;
  /** Width as a percentage (0–100). */
  widthPercent: number;
}

/**
 * Dot-density pressure bar for the heatmap.
 * Higher |premium| = larger, more tightly packed dots.
 * This implements "Volume as Pressure" — intensity shown through dot density.
 */
export default function PressureBar({
  premium,
  color,
  opacity,
  widthPercent,
}: PressureBarProps) {
  const absPremium = Math.abs(premium);

  // Dynamic dot sizing: more premium = larger, denser dots
  const dotRadius = 0.8 + Math.min(absPremium * 0.3, 1.2);
  const dotSpacing = 8 - Math.min(absPremium * 0.8, 4);
  const finalSpacing = Math.max(dotSpacing, 3);

  const isPositive = premium >= 0;

  return (
    <div className="flex-1 h-5 bg-gray-100 relative overflow-hidden">
      {/* Dot pressure fill */}
      <div
        className="h-full transition-all duration-500 absolute top-0"
        style={{
          width: `${widthPercent}%`,
          ...(isPositive
            ? { left: '50%' }
            : { right: '50%' }),
          backgroundImage: `radial-gradient(circle, ${color} ${dotRadius}px, transparent ${dotRadius}px)`,
          backgroundSize: `${finalSpacing}px ${finalSpacing}px`,
          opacity,
        }}
      />

      {/* Center line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-dot-border" />

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] text-dot-text font-mono font-medium">
          {premium >= 0 ? '+' : ''}{premium.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
