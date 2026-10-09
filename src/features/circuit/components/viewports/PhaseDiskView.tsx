import React from 'react';
import type { StateVector } from '@/core/types';

interface ViewportProps {
  evaluation?: StateVector;
  state?: StateVector;
  nQubits?: number;
}

export function PhaseDiskView(_props: ViewportProps) {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <canvas
        data-testid="phase-disk-view"
        role="img"
        aria-label="Fase y amplitud del estado cuántico"
        className="w-full h-full"
      />
    </div>
  );
}

export default PhaseDiskView;
