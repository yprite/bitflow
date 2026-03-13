'use client';

interface LivePulseProps {
  /** Dot color. Default '#1a1a1a'. */
  color?: string;
  /** Dot size in px. Default 6. */
  size?: number;
  /** CSS class for the wrapper. */
  className?: string;
}

/**
 * Small pulsing dot that signals "data is live".
 *
 * Place next to card headers or section titles to convey
 * that the displayed information is actively monitored.
 * Uses CSS animation only — zero JS overhead.
 *
 * Respects prefers-reduced-motion (shrinks to a static dot).
 */
export default function LivePulse({
  color = '#1a1a1a',
  size = 6,
  className = '',
}: LivePulseProps) {
  return (
    <span
      className={`live-pulse ${className}`}
      aria-hidden="true"
      style={{
        '--lp-color': color,
        '--lp-size': `${size}px`,
      } as React.CSSProperties}
    />
  );
}
