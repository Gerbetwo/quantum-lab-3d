import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';

export const EntanglementMission: React.FC = () => {
  const { isEntangled, aliceBobDistance, entangledOutcome, prepareBellPair, setDistance, measureEntangledPair, completeStep } = useQuantumStore();

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl space-y-6">
      <h2 className="text-2xl font-bold border-b border-slate-700 pb-2">Mission 2: Quantum Entanglement & Bell States</h2>
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={() => { prepareBellPair(); completeStep('entanglement-step-1'); }}
            className="px-4 py-2 bg-purple-600 rounded-lg font-semibold"
          >
            Prepare Bell Pair (|Φ⁺⟩)
          </button>
          <button
            disabled={!isEntangled}
            onClick={() => { measureEntangledPair(); completeStep('entanglement-step-2'); }}
            className="px-4 py-2 bg-emerald-600 disabled:opacity-40 rounded-lg font-semibold"
          >
            Measure Correlated Pair
          </button>
        </div>

        <div>
          <label className="block text-sm">Spatial Separation: {aliceBobDistance.toLocaleString()} km</label>
          <input
            type="range"
            min={1000}
            max={400000}
            step={5000}
            value={aliceBobDistance}
            onChange={(e) => setDistance(parseInt(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800 rounded text-center">
            <h4 className="text-slate-400 text-sm">Alice Node</h4>
            <p className="text-xl font-bold text-cyan-400">{entangledOutcome ? `|${entangledOutcome[0]}⟩` : 'Unmeasured'}</p>
          </div>
          <div className="p-4 bg-slate-800 rounded text-center">
            <h4 className="text-slate-400 text-sm">Bob Node</h4>
            <p className="text-xl font-bold text-purple-400">{entangledOutcome ? `|${entangledOutcome[1]}⟩` : 'Unmeasured'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
