import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';

export const GroverMission: React.FC = () => {
  const { groverIterations, groverMeasured, stepGrover, measureGrover, completeStep } = useQuantumStore();

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl space-y-6">
      <h2 className="text-2xl font-bold border-b border-slate-700 pb-2">
        Mission 6: Grover&apos;s Search Algorithm
      </h2>
      <div className="flex gap-3">
        <button onClick={() => { stepGrover(); completeStep('grover-step-1'); }} className="px-4 py-2 bg-teal-600 rounded font-semibold">
          Step Amplification (Iteration {groverIterations})
        </button>
        <button onClick={() => { measureGrover(); completeStep('grover-step-2'); }} className="px-4 py-2 bg-cyan-600 rounded font-semibold">
          Measure Marked Target
        </button>
      </div>

      {groverMeasured && (
        <div className="p-3 bg-teal-950 border border-teal-500 rounded text-teal-200">
          Target Candidate Correctly Located with High Probability!
        </div>
      )}
    </div>
  );
};
