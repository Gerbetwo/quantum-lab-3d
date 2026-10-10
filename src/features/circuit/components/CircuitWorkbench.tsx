'use client';

import React, { useState } from 'react';
import { createEmptyCircuit, evaluateFullCircuit } from '@/core/math/circuit';
import type { QuantumCircuit, StateVectorHistory } from '@/core/math/circuit';
import { BlochPairView, PhaseDiskView, HistogramView } from './viewports';

export function CircuitWorkbench() {
  const [circuit] = useState<QuantumCircuit>(() => createEmptyCircuit(3));
  const [evaluationResult] = useState<StateVectorHistory>(() => evaluateFullCircuit(circuit));
  const [viewMode] = useState<string>('bloch');

  const finalState = evaluationResult?.final || [{ re: 1, im: 0 }];

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground p-4">
      <div className="flex-1 flex items-center justify-center">
        {viewMode === 'phase-disk' && <PhaseDiskView evaluation={finalState} />}
        {viewMode === 'bloch' && <BlochPairView evaluation={finalState} />}
        {viewMode === 'histogram' && <HistogramView evaluation={finalState} />}
      </div>
    </div>
  );
}
