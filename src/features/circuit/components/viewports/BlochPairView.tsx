import type { StateVector } from '@/core/types';

interface ViewportProps {
  evaluation?: StateVector;
  state?: StateVector;
  nQubits?: number;
}

export function BlochPairView(_props: ViewportProps) {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <canvas role="img" aria-label="Bloch Pair View" className="w-full h-full" />
    </div>
  );
}

export default BlochPairView;
