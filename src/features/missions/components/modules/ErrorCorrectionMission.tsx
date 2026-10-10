import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { evaluateSyndrome } from '@/core/quantumPhysics';

export const ErrorCorrectionMission: React.FC = () => {
  const { physicalQubits, toggleBitFlip, applyRecovery, completeStep } = useQuantumStore();
  const { errorIndex, syndrome } = evaluateSyndrome(physicalQubits);

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl space-y-6">
      <h2 className="text-2xl font-bold border-b border-slate-700 pb-2">Mission 7: Quantum Error Correction</h2>
      <div className="flex gap-4">
        {physicalQubits.map((q, idx) => (
          <button
            key={idx}
            onClick={() => { toggleBitFlip(idx); completeStep('ec-step-1'); }}
            className={`p-4 rounded-lg font-mono border ${q === 1 ? 'bg-red-900/50 border-red-500' : 'bg-slate-800 border-slate-700'}`}
          >
            Qubit {idx}: |{q}⟩
          </button>
        ))}
      </div>

      <div className="p-4 bg-slate-800 rounded font-mono text-sm space-y-1">
        <p>Syndrome Readout: [{syndrome.join(', ')}]</p>
        <p>Detected Error Index: {errorIndex === -1 ? 'None' : `Qubit ${errorIndex}`}</p>
      </div>

      <button
        onClick={() => { applyRecovery(); completeStep('ec-step-2'); }}
        className="px-4 py-2 bg-emerald-600 rounded font-semibold"
      >
        Execute Majority-Vote Recovery
      </button>
    </div>
  );
};
