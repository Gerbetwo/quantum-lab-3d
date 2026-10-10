import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { runShor15Simulation } from '@/core/quantumPhysics';

export const ApplicationsMission: React.FC = () => {
  const { shorExecuted, runShor, completeStep } = useQuantumStore();
  const shorData = runShor15Simulation();

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl space-y-6">
      <h2 className="text-2xl font-bold border-b border-slate-700 pb-2">
        Mission 4: Quantum Applications &amp; Shor&apos;s Algorithm
      </h2>
      <p className="text-slate-300 text-sm">Demonstrating period finding for factoring N = 15.</p>
      <button
        onClick={() => { runShor(); completeStep('applications-step-1'); }}
        className="px-4 py-2 bg-indigo-600 rounded font-semibold hover:bg-indigo-500"
      >
        Execute Shor&apos;s Period Finder (N = 15)
      </button>

      {shorExecuted && (
        <div className="p-4 bg-slate-800 rounded space-y-3 font-mono text-sm">
          <p className="text-cyan-400">Sequence Period (r): {shorData.period}</p>
          <p className="text-emerald-400">Extracted Factors of 15: {shorData.factors.join(' × ')}</p>
        </div>
      )}
    </div>
  );
};
