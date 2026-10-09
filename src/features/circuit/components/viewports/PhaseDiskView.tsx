'use client';

import React, { useEffect, useRef } from 'react';
import type { StateVector } from '@/core/quantum/statevector';

interface Props {
  state: StateVector;
  width?: number;
  height?: number;
}

export default function PhaseDiskView({ state, width = 512, height = 512 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dim = state.length;
    const cols = Math.ceil(Math.sqrt(dim));
    const rows = Math.ceil(dim / cols);
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;
    const radius = Math.min(cellW, cellH) * 0.38;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < dim; i++) {
      const a = state[i];
      if (!a) continue;
      const mag = Math.hypot(a.re, a.im);
      const phase = Math.atan2(a.im, a.re);
      const cx = (i % cols) * cellW + cellW / 2;
      const cy = Math.floor(i / cols) * cellH + cellH / 2;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (mag > 1e-9) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + radius * mag * Math.cos(phase), cy - radius * mag * Math.sin(phase));
        ctx.strokeStyle = a.re >= 0 ? '#00f0ff' : '#a855f7';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="phase-disk-view"
      role="img"
      aria-label="Discos de fase y amplitud sobre los estados base"
      width={width}
      height={height}
      className="w-full aspect-square bg-surface-1 rounded-2xl"
    />
  );
}