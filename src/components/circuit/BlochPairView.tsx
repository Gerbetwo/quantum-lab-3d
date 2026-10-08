'use client';

import React from 'react';

interface BlochPairViewProps {
  evaluation: any;
}

export function BlochPairView({ evaluation }: BlochPairViewProps) {
  if (!evaluation) {
    return <div className="text-slate-400 text-sm">Esperando evaluación del circuito...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-2">Esferas de Bloch Par</h3>
      <p className="text-xs text-slate-500 mb-4">Proyección individual por par de qubits.</p>
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-full border border-purple-500/50 bg-purple-950/20 flex items-center justify-center">
          <span className="text-xs text-purple-300 font-mono font-bold">q₀</span>
        </div>
        <div className="w-24 h-24 rounded-full border border-cyan-500/50 bg-cyan-950/20 flex items-center justify-center">
          <span className="text-xs text-cyan-300 font-mono font-bold">q₁</span>
        </div>
      </div>
    </div>
  );
}
