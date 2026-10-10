import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';

export const GatesMission: React.FC = () => {
  const { appliedGates, addGate, completeStep } = useQuantumStore();

  const handleGate = (g: 'X' | 'Z' | 'H') => {
    addGate(g);
    completeStep(`gates-step-${g}`);
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl space-y-6">
      <h2 className="text-2xl font-bold border-b border-slate-700 pb-2">Mission 5: Single-Qubit Quantum Gates</h2>
      <div className="flex gap-3">
        <button onClick={() => handleGate('X')} className="px-4 py-2 bg-rose-600 rounded font-bold">X (Bit Flip)</button>
        <button onClick={() => handleGate('Z')} className="px-4 py-2 bg-blue-600 rounded font-bold">Z (Phase Flip)</button>
        <button onClick={() => handleGate('H')} className="px-4 py-2 bg-purple-600 rounded font-bold">H (Hadamard)</button>
      </div>

      <div className="p-4 bg-slate-800 rounded">
        <h4 className="text-sm text-slate-400 mb-2">3-Slot Circuit Sequence</h4>
        <div className="flex gap-2 font-mono">
          {[0, 1, 2].map((slot) => (
            <div key={slot} className="w-12 h-12 border border-slate-600 flex items-center justify-center bg-slate-900 rounded">
              {appliedGates[slot] || '—'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
