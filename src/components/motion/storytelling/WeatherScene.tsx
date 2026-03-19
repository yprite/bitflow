'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { clamp, lerp } from '../core/dot-math';

/**
 * Weather scene halftone illustration for the desktop command deck.
 *
 * Draws a landscape scene using dots:
 * - Middle-left: radiating sun with pulsing rays
 * - Middle-right: market temperature gauge
 * - Bottom: row of trees in halftone style
 *
 * The scene breathes and animates continuously.
 */

interface WeatherSceneProps {
  width?: number;
  height?: number;
  temperature?: number; // 0-100 (fear & greed value)
  className?: string;
}

function getTempColor(temp: number): string {
  if (temp >= 75) return '#e53935';
  if (temp >= 55) return '#f5a623';
  if (temp >= 40) return '#9ca3af';
  if (temp >= 25) return '#1e88e5';
  return '#1565c0';
}

function getTempLabel(temp: number): string {
  if (temp >= 75) return '과열';
  if (temp >= 55) return '경계';
  if (temp >= 40) return '중립';
  if (temp >= 25) return '침체';
  return '극침체';
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  t: number,
  temp: number,
) {
  const sunColor = getTempColor(temp);
  const intensity = clamp(temp / 100, 0.2, 1);

  // Core glow
  const coreRadius = 18 + Math.sin(t * 1.2) * 3;
  const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 2);
  coreGradient.addColorStop(0, sunColor);
  coreGradient.addColorStop(1, 'transparent');

  ctx.globalAlpha = 0.12 * intensity;
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, coreRadius * 2, 0, Math.PI * 2);
  ctx.fill();

  // Core solid dots
  for (let ring = 0; ring < 3; ring++) {
    const ringRadius = 4 + ring * 6;
    const dotCount = 6 + ring * 6;
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2 + t * (0.3 - ring * 0.1);
      const pulse = Math.sin(t * 1.5 + i * 0.5 + ring) * 0.3 + 0.7;
      const x = cx + Math.cos(angle) * ringRadius;
      const y = cy + Math.sin(angle) * ringRadius;
      const r = lerp(1.0, 2.5, pulse) * (1 - ring * 0.2);

      ctx.globalAlpha = (0.5 - ring * 0.12) * pulse * intensity;
      ctx.fillStyle = sunColor;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Rays — long radiating dot lines
  const rayCount = 12;
  for (let i = 0; i < rayCount; i++) {
    const baseAngle = (i / rayCount) * Math.PI * 2 + t * 0.15;
    const rayLength = 30 + Math.sin(t * 0.8 + i * 1.3) * 15;
    const dotsInRay = 5;

    for (let j = 0; j < dotsInRay; j++) {
      const dist = 22 + (j / dotsInRay) * rayLength;
      const wobble = Math.sin(t * 2 + i + j * 0.8) * 1.5;
      const x = cx + Math.cos(baseAngle) * dist + wobble;
      const y = cy + Math.sin(baseAngle) * dist;
      const fade = 1 - j / dotsInRay;
      const pulse = Math.sin(t * 1.8 + j * 0.6 + i) * 0.3 + 0.7;
      const r = lerp(0.6, 1.8, fade * pulse);

      ctx.globalAlpha = 0.35 * fade * pulse * intensity;
      ctx.fillStyle = sunColor;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawTemperature(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  t: number,
  temp: number,
) {
  const color = getTempColor(temp);
  const label = getTempLabel(temp);

  // Temperature value
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = color;
  ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${temp}°`, cx, cy - 8);

  // Label
  ctx.globalAlpha = 0.45;
  ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(label, cx, cy + 16);

  // Surrounding indicator dots — circular gauge
  const gaugeRadius = 38;
  const totalDots = 24;
  const activeDots = Math.round((temp / 100) * totalDots);

  for (let i = 0; i < totalDots; i++) {
    const angle = (i / totalDots) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * gaugeRadius;
    const y = cy + Math.sin(angle) * gaugeRadius;
    const isActive = i < activeDots;
    const pulse = Math.sin(t * 1.2 + i * 0.3) * 0.2 + 0.8;
    const r = isActive ? 2.0 * pulse : 1.0;

    ctx.globalAlpha = isActive ? 0.5 * pulse : 0.1;
    ctx.fillStyle = isActive ? color : '#999';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  size: number,
  t: number,
  seed: number,
) {
  const trunkColor = '#6b5b45';
  const leafColor = '#4a7c59';
  const leafColorLight = '#6da47a';

  // Trunk — vertical dot column
  const trunkHeight = size * 0.4;
  const trunkDots = 4;
  for (let i = 0; i < trunkDots; i++) {
    const y = baseY - (i / trunkDots) * trunkHeight;
    const r = lerp(2.0, 1.2, i / trunkDots) * (size / 30);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = trunkColor;
    ctx.beginPath();
    ctx.arc(baseX, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crown — layered dot clusters (triangle-ish shape)
  const crownBase = baseY - trunkHeight;
  const layers = 4;

  for (let layer = 0; layer < layers; layer++) {
    const layerY = crownBase - layer * size * 0.18;
    const layerWidth = size * (0.55 - layer * 0.1);
    const dotsInLayer = 5 + (layers - layer) * 2;

    for (let d = 0; d < dotsInLayer; d++) {
      const spread = (d / (dotsInLayer - 1) - 0.5) * layerWidth;
      const jitterX = Math.sin(t * 0.6 + seed + d * 2.1 + layer) * 1.5;
      const jitterY = Math.cos(t * 0.5 + seed + d * 1.7 + layer * 0.8) * 1.0;
      const x = baseX + spread + jitterX;
      const y = layerY + jitterY;

      const pulse = Math.sin(t * 0.7 + seed + d * 0.5 + layer * 0.3) * 0.25 + 0.75;
      const r = lerp(1.2, 2.8, pulse) * (size / 35);

      ctx.globalAlpha = 0.3 * pulse;
      ctx.fillStyle = (d + layer) % 3 === 0 ? leafColorLight : leafColor;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  w: number,
  groundY: number,
  t: number,
) {
  // Scattered ground dots
  const groundDots = 60;
  for (let i = 0; i < groundDots; i++) {
    const x = (i / groundDots) * w + Math.sin(i * 7.3) * 8;
    const y = groundY + Math.sin(i * 3.7) * 3 + 2;
    const pulse = Math.sin(t * 0.3 + i * 0.4) * 0.2 + 0.8;
    const r = lerp(0.5, 1.2, pulse);

    ctx.globalAlpha = 0.12 * pulse;
    ctx.fillStyle = i % 5 === 0 ? '#8b7355' : '#9ca3af';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function WeatherScene({
  width = 700,
  height = 300,
  temperature = 50,
  className,
}: WeatherSceneProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const rafRef = useRef(0);
  const tempRef = useRef(temperature);
  tempRef.current = temperature;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Tree positions — spread across bottom
    const trees = [
      { x: width * 0.04, size: 22, seed: 1.2 },
      { x: width * 0.1, size: 30, seed: 3.7 },
      { x: width * 0.17, size: 26, seed: 5.1 },
      { x: width * 0.25, size: 34, seed: 7.8 },
      { x: width * 0.33, size: 20, seed: 2.4 },
      { x: width * 0.4, size: 28, seed: 9.2 },
      { x: width * 0.48, size: 32, seed: 4.5 },
      { x: width * 0.56, size: 24, seed: 6.8 },
      { x: width * 0.63, size: 30, seed: 8.1 },
      { x: width * 0.7, size: 22, seed: 1.9 },
      { x: width * 0.78, size: 28, seed: 3.3 },
      { x: width * 0.86, size: 34, seed: 5.6 },
      { x: width * 0.93, size: 26, seed: 7.2 },
    ];

    const groundY = height * 0.88;
    const sunCx = width * 0.22;
    const sunCy = height * 0.38;
    const tempCx = width * 0.62;
    const tempCy = height * 0.38;

    if (reducedMotion) {
      ctx.scale(dpr, dpr);
      const temp = tempRef.current;
      drawGround(ctx, width, groundY, 0);
      trees.forEach((tree) => drawTree(ctx, tree.x, groundY, tree.size, 0, tree.seed));
      drawSun(ctx, sunCx, sunCy, 0, temp);
      drawTemperature(ctx, tempCx, tempCy, 0, temp);
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const t = (now - startTime) / 1000;
      const temp = tempRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Draw layers back to front
      drawGround(ctx, width, groundY, t);
      trees.forEach((tree) => drawTree(ctx, tree.x, groundY, tree.size, t, tree.seed));
      drawSun(ctx, sunCx, sunCy, t, temp);
      drawTemperature(ctx, tempCx, tempCy, t, temp);

      ctx.restore();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'absolute bottom-0 left-0 z-0 pointer-events-none'}
      aria-hidden="true"
    />
  );
}
