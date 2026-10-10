import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { calculateBlochCoordinates } from '@/core/quantumPhysics';

export const SuperpositionMission: React.FC = () => {
  const { theta, setTheta, isMeasured, measuredOutcome, triggerMeasurement, completeStep } = useQuantumStore();
  const bloch = calculateBlochCoordinates(theta, 0);
  const prob0 = (Math.cos(theta / 2) ** 2 * 100).toFixed(1);
  const prob1 = (Math.sin(theta / 2) ** 2 * 100).toFixed(1);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTheta(parseFloat(e.target.value));
    completeStep('superposition-step-1');
  };

  const handleMeasure = () => {
    triggerMeasurement();
    completeStep('superposition-step-2');
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl space-y-6">
      <h2 className="text-2xl font-bold border-b border-slate-700 pb-2">Mission 1: Quantum Superposition</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            State Parameter Angle ($	heta$): <span className="text-cyan-400">{theta.toFixed(2)} rad</span>
          </label>
          <input
            type="range"
            min={0.001}
            max={Math.PI - 0.001}
            step={0.01}
            value={theta}
            onChange={handleSlider}
            className="w-full accent-cyan-500"
          />
          <div className="flex gap-2">
            <button onClick={() => setTheta(0.001)} className="px-3 py-1 bg-slate-800 border rounded text-xs">State |0⟩</button>
            <button onClick={() => setTheta(Math.PI / 2)} className="px-3 py-1 bg-slate-800 border rounded text-xs">State |+⟩</button>
            <button onClick={() => setTheta(Math.PI - 0.001)} className="px-3 py-1 bg-slate-800 border rounded text-xs">State |1⟩</button>
          </div>
          <button
            onClick={handleMeasure}
            className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold hover:opacity-90"
          >
            Measure Wavefunction
          </button>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-cyan-300">Bloch Sphere Telemetry</h3>
            <p className="text-sm font-mono text-slate-300">X: {bloch.x.toFixed(3)} | Y: {bloch.y.toFixed(3)} | Z: {bloch.z.toFixed(3)}</p>
          </div>
          <div className="my-4">
            <p className="text-sm">Probability |0⟩: <span className="font-bold text-cyan-400">{prob0}%</span></p>
            <p className="text-sm">Probability |1⟩: <span className="font-bold text-purple-400">{prob1}%</span></p>
          </div>
          {isMeasured && (
            <div className="p-3 bg-cyan-950 border border-cyan-500 rounded text-center">
              <span className="text-xs uppercase text-slate-400 block">Collapsed State Result</span>
              <span className="text-2xl font-bold text-cyan-300">|{measuredOutcome}⟩</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
