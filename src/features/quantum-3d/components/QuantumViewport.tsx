'use client';

import React, { Suspense } from 'react';
import type { StateVector } from '@/core/math/statevector';

const BlochPairView = React.lazy(() => import('@/features/circuit/components/viewports/BlochPairView'));
const HistogramView = React.lazy(() => import('@/features/circuit/components/viewports/HistogramView'));

interface Props { state: StateVector; nQubits: number }

export default function QuantumViewport({ state, nQubits }: Props) {
  const Fallback = (
    <div data-testid="viewport-loading" aria-busy="true"
         className="w-full aspect-[16/10] bg-surface-1 animate-pulse rounded-2xl" />
  );
  return (
    <div className="w-full rounded-2xl overflow-hidden bg-surface-1 border border-edge">
      <Suspense fallback={Fallback}>
        {nQubits <= 2
          ? <BlochPairView state={state} nQubits={nQubits} />
          : <HistogramView state={state} />}
      </Suspense>
    </div>
  );
}
