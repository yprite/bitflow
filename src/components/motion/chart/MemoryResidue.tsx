'use client';

import { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { MEMORY_RESIDUE_FADE } from '../core/constants';

interface MemoryResidueProps {
  /** The previous polyline points string. */
  previousPoints: string;
  /** The current polyline points string. */
  currentPoints: string;
  /** Key that changes to trigger the transition (e.g., period). */
  transitionKey: string;
  /** Stroke color. */
  color?: string;
}

/**
 * SVG overlay showing a "ghost" of the previous chart state
 * during period transitions. The old line fades while the new appears.
 *
 * Creates continuity — the user sees this is the same data at a different scale.
 */
export default function MemoryResidue({
  previousPoints,
  currentPoints,
  transitionKey,
  color = '#1a1a1a',
}: MemoryResidueProps) {
  const reducedMotion = useReducedMotion();
  const [showGhost, setShowGhost] = useState(false);
  const [ghostPoints, setGhostPoints] = useState('');
  const prevKeyRef = useRef(transitionKey);

  useEffect(() => {
    if (prevKeyRef.current === transitionKey) return;
    prevKeyRef.current = transitionKey;

    if (reducedMotion || !previousPoints) return;

    setGhostPoints(previousPoints);
    setShowGhost(true);

    const timeout = setTimeout(() => {
      setShowGhost(false);
    }, MEMORY_RESIDUE_FADE);

    return () => clearTimeout(timeout);
  }, [transitionKey, previousPoints, reducedMotion]);

  return (
    <>
      {showGhost && ghostPoints && (
        <polyline
          points={ghostPoints}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          opacity={0.1}
          style={{
            transition: `opacity ${MEMORY_RESIDUE_FADE}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        />
      )}
    </>
  );
}
