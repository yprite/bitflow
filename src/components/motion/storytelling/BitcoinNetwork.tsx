'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { DOT_COLOR } from '../core/constants';

/**
 * Bitcoin P2P network visualization using halftone dots.
 * Nodes float gently, connected by thin lines.
 * Data packets (small bright dots) travel along connections.
 * Central node pulses as the "hub" — represents the user's view.
 */

interface BitcoinNetworkProps {
  width?: number;
  height?: number;
  className?: string;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  isCentral: boolean;
}

interface Packet {
  fromIdx: number;
  toIdx: number;
  progress: number;
  speed: number;
  color: string;
}

interface Connection {
  a: number;
  b: number;
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

export default function BitcoinNetwork({
  width = 400,
  height = 200,
  className,
}: BitcoinNetworkProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const rafRef = useRef(0);

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

    // Generate nodes
    const nodeCount = 18;
    const nodes: Node[] = [];
    const cx = width / 2;
    const cy = height / 2;

    // Central node (₿)
    nodes.push({
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      radius: 5,
      phase: 0,
      isCentral: true,
    });

    // Surrounding nodes
    for (let i = 1; i < nodeCount; i++) {
      const angle = (i / (nodeCount - 1)) * Math.PI * 2 + Math.random() * 0.5;
      const r = 35 + Math.random() * (Math.min(width, height) * 0.35);
      nodes.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: 2 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
        isCentral: false,
      });
    }

    // Build connections (each node connects to 2-3 nearest)
    const connections: Connection[] = [];
    const connSet = new Set<string>();
    for (let i = 0; i < nodes.length; i++) {
      const distances = nodes
        .map((n, j) => ({ j, d: dist(nodes[i].x, nodes[i].y, n.x, n.y) }))
        .filter((e) => e.j !== i)
        .sort((a, b) => a.d - b.d);

      const connectCount = i === 0 ? 5 : 2 + Math.floor(Math.random() * 2);
      for (let k = 0; k < Math.min(connectCount, distances.length); k++) {
        const j = distances[k].j;
        const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
        if (!connSet.has(key)) {
          connSet.add(key);
          connections.push({ a: i, b: j });
        }
      }
    }

    // Packets traveling along connections
    const packets: Packet[] = [];
    const packetColors = ['#f5a623', '#3b5998', '#00c853'];

    function spawnPacket() {
      const conn = connections[Math.floor(Math.random() * connections.length)];
      const reverse = Math.random() > 0.5;
      packets.push({
        fromIdx: reverse ? conn.b : conn.a,
        toIdx: reverse ? conn.a : conn.b,
        progress: 0,
        speed: 0.3 + Math.random() * 0.5,
        color: packetColors[Math.floor(Math.random() * packetColors.length)],
      });
    }

    // Initial packets
    for (let i = 0; i < 5; i++) spawnPacket();

    if (reducedMotion) {
      ctx.scale(dpr, dpr);
      // Static: draw connections and nodes
      for (const conn of connections) {
        const a = nodes[conn.a];
        const b = nodes[conn.b];
        ctx.strokeStyle = DOT_COLOR;
        ctx.globalAlpha = 0.06;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (const node of nodes) {
        ctx.globalAlpha = node.isCentral ? 0.4 : 0.2;
        ctx.fillStyle = node.isCentral ? '#f5a623' : DOT_COLOR;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    const startTime = performance.now();
    let lastPacketSpawn = 0;

    const tick = (now: number) => {
      const t = (now - startTime) / 1000;

      // Move nodes gently
      for (const node of nodes) {
        if (node.isCentral) continue;
        node.x += node.vx;
        node.y += node.vy;

        // Soft boundary bounce
        const margin = 15;
        if (node.x < margin) node.vx = Math.abs(node.vx);
        if (node.x > width - margin) node.vx = -Math.abs(node.vx);
        if (node.y < margin) node.vy = Math.abs(node.vy);
        if (node.y > height - margin) node.vy = -Math.abs(node.vy);

        // Gentle pull toward center
        node.vx += (cx - node.x) * 0.00003;
        node.vy += (cy - node.y) * 0.00003;
      }

      // Spawn packets periodically
      if (t - lastPacketSpawn > 0.6) {
        spawnPacket();
        lastPacketSpawn = t;
      }

      // Update packets
      for (let i = packets.length - 1; i >= 0; i--) {
        packets[i].progress += packets[i].speed * 0.016;
        if (packets[i].progress >= 1) {
          packets.splice(i, 1);
        }
      }

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Connections
      for (const conn of connections) {
        const a = nodes[conn.a];
        const b = nodes[conn.b];
        const d = dist(a.x, a.y, b.x, b.y);
        const maxDist = Math.min(width, height) * 0.6;
        const fade = Math.max(0, 1 - d / maxDist);

        ctx.strokeStyle = DOT_COLOR;
        ctx.globalAlpha = 0.04 + fade * 0.06;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Packets
      for (const pkt of packets) {
        const from = nodes[pkt.fromIdx];
        const to = nodes[pkt.toIdx];
        const px = from.x + (to.x - from.x) * pkt.progress;
        const py = from.y + (to.y - from.y) * pkt.progress;

        // Trail
        const trailLen = 3;
        for (let j = 0; j < trailLen; j++) {
          const tp = Math.max(0, pkt.progress - j * 0.06);
          const tx = from.x + (to.x - from.x) * tp;
          const ty = from.y + (to.y - from.y) * tp;
          ctx.beginPath();
          ctx.globalAlpha = (0.4 - j * 0.12);
          ctx.fillStyle = pkt.color;
          ctx.arc(tx, ty, 1.2 - j * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Main packet dot
        ctx.beginPath();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = pkt.color;
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nodes
      for (const node of nodes) {
        const pulse = Math.sin(t * 1.5 + node.phase) * 0.2 + 0.8;
        const r = node.radius * pulse;

        if (node.isCentral) {
          // ₿ hub glow
          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 4);
          glow.addColorStop(0, 'rgba(245,166,35,0.08)');
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 4, 0, Math.PI * 2);
          ctx.fill();

          // Inner dot
          ctx.beginPath();
          ctx.globalAlpha = 0.5 * pulse;
          ctx.fillStyle = '#f5a623';
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fill();

          // ₿ text
          ctx.globalAlpha = 0.6 * pulse;
          ctx.fillStyle = '#f5a623';
          ctx.font = `bold ${r * 1.4}px -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('₿', node.x, node.y + 0.5);
        } else {
          // Regular node
          ctx.beginPath();
          ctx.globalAlpha = 0.15 + pulse * 0.15;
          ctx.fillStyle = DOT_COLOR;
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fill();

          // Outer ring
          ctx.beginPath();
          ctx.globalAlpha = 0.06 + pulse * 0.04;
          ctx.strokeStyle = DOT_COLOR;
          ctx.lineWidth = 0.4;
          ctx.arc(node.x, node.y, r * 1.8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'pointer-events-none'}
      aria-hidden="true"
    />
  );
}
