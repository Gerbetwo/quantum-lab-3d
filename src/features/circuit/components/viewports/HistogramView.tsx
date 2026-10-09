import React from 'react';
import type { StateVector } from '@/core/types';

interface ViewportProps {
  evaluation?: StateVector;
  state?: StateVector;
  nQubits?: number;
}

export function HistogramView(_props: ViewportProps) {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <canvas role="img" aria-label="Histogram View" className="w-full h-full" />
    </div>
  );
}

export default HistogramView;
