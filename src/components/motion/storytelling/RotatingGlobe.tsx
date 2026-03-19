'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';

/**
 * Halftone dot globe with simplified continent outlines.
 * Land dots are green/brown, ocean dots are blue/gray.
 * Rotates slowly around Y axis with slight tilt.
 */

interface RotatingGlobeProps {
  size?: number;
  className?: string;
}

// Simplified continent polygons as [lat, lon] pairs (degrees).
// Each continent is a rough bounding polygon.
const CONTINENTS: [number, number][][] = [
  // North America
  [[70,-140],[72,-95],[60,-60],[45,-55],[30,-80],[25,-100],[30,-118],[48,-125],[55,-135],[60,-148],[70,-140]],
  // South America
  [[12,-75],[5,-35],[-5,-35],[-15,-40],[-22,-42],[-35,-58],[-55,-68],[-50,-75],[-20,-70],[-5,-80],[5,-77],[12,-75]],
  // Europe
  [[70,0],[72,30],[60,40],[45,40],[36,28],[38,-10],[43,-10],[48,-5],[55,-8],[58,5],[60,10],[70,0]],
  // Africa
  [[36,-10],[35,10],[30,32],[10,42],[0,42],[-5,40],[-15,40],[-25,35],[-35,20],[-35,18],[-15,12],[-5,10],[5,-5],[15,-17],[25,-15],[30,-10],[36,-10]],
  // Asia
  [[72,30],[75,60],[70,100],[70,140],[65,170],[55,140],[45,135],[35,130],[22,115],[10,105],[5,100],[8,80],[25,68],[30,48],[35,35],[45,40],[60,40],[72,30]],
  // Australia
  [[-12,130],[-10,142],[-18,148],[-28,153],[-38,148],[-35,137],[-32,115],[-22,114],[-12,130]],
  // Antarctica (simplified ring)
  [[-65,-60],[-65,0],[-65,60],[-65,120],[-65,180],[-65,-120],[-65,-60]],
];

// Convert lat/lon to spherical: theta = co-latitude, phi = longitude in radians
function latLonToSphere(lat: number, lon: number): [number, number] {
  const theta = (90 - lat) * (Math.PI / 180);
  const phi = lon * (Math.PI / 180);
  return [theta, phi];
}

// Point-in-polygon test using ray casting on lat/lon
function isLand(lat: number, lon: number): boolean {
  for (const poly of CONTINENTS) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [yi, xi] = poly[i];
      const [yj, xj] = poly[j];
      if (
        yi > lat !== yj > lat &&
        lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
    if (inside) return true;
  }
  return false;
}

interface GlobeDot {
  theta: number;
  phi: number;
  baseRadius: number;
  isLand: boolean;
}

function generateGlobeDots(count: number): GlobeDot[] {
  const dots: GlobeDot[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const theta = Math.acos(1 - (2 * (i + 0.5)) / count);
    const phi = goldenAngle * i;
    // Convert back to lat/lon for land test
    const lat = 90 - theta * (180 / Math.PI);
    const lon = ((phi * (180 / Math.PI)) % 360 + 360) % 360;
    const lonNorm = lon > 180 ? lon - 360 : lon;
    const land = isLand(lat, lonNorm);
    const baseRadius = land ? 1.0 + Math.random() * 0.6 : 0.6 + Math.random() * 0.5;
    dots.push({ theta, phi, baseRadius, isLand: land });
  }
  return dots;
}

const LAND_COLORS = ['#2d6a4f', '#40916c', '#52796f', '#74664a'];
const OCEAN_COLOR = '#94b8d0';
const OCEAN_DEEP = '#6b9ac4';

export default function RotatingGlobe({
  size = 200,
  className,
}: RotatingGlobeProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const dots = generateGlobeDots(500);
    const cx = size / 2;
    const cy = size / 2;
    const globeRadius = size * 0.4;

    const drawFrame = (t: number) => {
      const rotationY = t * 0.25;
      const tilt = 0.2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Subtle atmosphere glow
      const glow = ctx.createRadialGradient(cx, cy, globeRadius * 0.85, cx, cy, globeRadius * 1.15);
      glow.addColorStop(0, 'rgba(148,184,208,0.06)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius * 1.15, 0, Math.PI * 2);
      ctx.fill();

      const projected: { x: number; y: number; z: number; r: number; land: boolean; idx: number }[] = [];

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const phi = dot.phi + rotationY;

        const x3d = Math.sin(dot.theta) * Math.cos(phi);
        const rawY = Math.cos(dot.theta);
        const rawZ = Math.sin(dot.theta) * Math.sin(phi);
        const y3d = rawY * Math.cos(tilt) - rawZ * Math.sin(tilt);
        const z3d = rawZ * Math.cos(tilt) + rawY * Math.sin(tilt);

        if (z3d < -0.1) continue;

        projected.push({
          x: cx + x3d * globeRadius,
          y: cy - y3d * globeRadius,
          z: z3d,
          r: dot.baseRadius,
          land: dot.isLand,
          idx: i,
        });
      }

      projected.sort((a, b) => a.z - b.z);

      for (const p of projected) {
        const depth = (p.z + 1) / 2;
        const r = p.r * (0.35 + depth * 0.85);
        const op = 0.08 + depth * 0.42;

        ctx.beginPath();
        ctx.globalAlpha = op;

        if (p.land) {
          ctx.fillStyle = LAND_COLORS[p.idx % LAND_COLORS.length];
        } else {
          ctx.fillStyle = depth > 0.6 ? OCEAN_COLOR : OCEAN_DEEP;
        }

        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    if (reducedMotion) {
      drawFrame(0);
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      drawFrame((now - startTime) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'pointer-events-none'}
      aria-hidden="true"
    />
  );
}
