import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';

export const DecoherenceMission: React.FC = () => {
  const { temperature, photonCollisions, setTemperature, addCollision, resetCooling, completeStep } = useQuantumStore();
  const t2Coherence = Math.max(0, 100 - temperature * 0.02 - photonCollisions * 10).toFixed(1);

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl space-y-6">
      <h2 className="text-2xl font-bold border-b border-slate-700 pb-2">Mission 3: Thermal Decoherence & Cryogenics</h2>
      {temperature > 1200 && (
        <div className="p-3 bg-red-900/50 border border-red-500 text-red-200 rounded">
          ⚠️ Critical Alert: High Thermal Decoherence! T2 coherence time depleted.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm">Cryo Temperature: {temperature} mK</label>
          <input
            type="range"
            min={15}
            max={5000}
            value={temperature}
            onChange={(e) => {
              setTemperature(parseInt(e.target.value));
              if (parseInt(e.target.value) > 1200) completeStep('decoherence-step-1');
            }}
            className="w-full accent-red-500"
          />
          <div className="flex gap-2">
            <button onClick={() => { addCollision(); completeStep('decoherence-step-2'); }} className="px-3 py-2 bg-amber-600 rounded text-sm">
              Inject Thermal Photon Collision
            </button>
            <button onClick={() => { resetCooling(); completeStep('decoherence-step-3'); }} className="px-3 py-2 bg-blue-600 rounded text-sm">
              Dilution Refrigerator Reset (15 mK)
            </button>
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded space-y-2">
          <p>T2 Coherence Time Remaining: <span className="font-bold text-emerald-400">{t2Coherence} µs</span></p>
          <p>Perturbation Count: <span className="font-bold text-amber-400">{photonCollisions}</span></p>
        </div>
      </div>
    </div>
  );
};
