'use client';

import React, { useMemo } from 'react';
import type { StateVector } from '@/domain/quantum/statevector';
import { probability } from '@/domain/quantum/statevector';

/**
 * Lightweight SVG Bloch spheres for N <= 2 (Phase 1 keeps bundle small).
 */
export default function BlochPairView({ state, nQubits }: { state: StateVector; nQubits: number }) {
  const spheres = useMemo(() => {
    const dim = state.length;
    const out: { p0: number; theta: number }[] = [];
    for (let q = 0; q < nQubits; q++) {
      const bit = 1 << (nQubits - 1 - q);
      let p0 = 0;
      for (let i = 0; i < dim; i++) if ((i & bit) === 0) p0 += probability(state, i);
      out.push({ p0, theta: 2 * Math.acos(Math.sqrt(Math.min(1, Math.max(0, p0)))) });
    }
    return out;
  }, [state, nQubits]);

  return (
    <div
      data-testid="bloch-pair-view"
      className="w-full aspect-[16/10] p-4 flex items-center justify-around gap-6"
    >
      {spheres.map((s, q) => {
        const cx = 90; const cy = 90; const r = 70;
        const x = cx + r * Math.sin(s.theta);
        const y = cy - r * Math.cos(s.theta);
        return (
          <svg key={q} viewBox="0 0 180 180" className="w-40 h-40" role="img"
               aria-label={"Esfera de Bloch del qubit " + q}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" />
            <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#334155" strokeDasharray="3 3" />
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#00f0ff" strokeWidth="2" />
            <circle cx={x} cy={y} r="4" fill="#00f0ff" />
          </svg>
        );
      })}
    </div>
  );
}
