'use client';

import React, { useMemo } from 'react';
import type { StateVector } from '@/domain/quantum/statevector';
import { probabilities } from '@/domain/quantum/statevector';

export default function HistogramView({ state }: { state: StateVector }) {
  const probs = useMemo(() => probabilities(state), [state]);
  const max = Math.max(...probs, 1e-9);
  const dim = probs.length;
  return (
    <div
      data-testid="histogram-view"
      role="img"
      aria-label={"Distribucion de probabilidad sobre " + dim + " estados base"}
      className="w-full aspect-[16/10] p-4 flex items-end gap-[2px]"
    >
      {probs.map((p, i) => (
        <div
          key={i}
          data-testid={"histogram-bar-" + i}
          className="flex-1 bg-cyan/70 rounded-t-sm transition-all"
          style={{ height: (p / max) * 100 + "%", minHeight: p > 1e-6 ? 2 : 0 }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
