'use client';

import React from 'react';

interface PhaseDiskViewProps {
  evaluation: unknown;
}

export function PhaseDiskView({ evaluation }: PhaseDiskViewProps) {
  if (!evaluation) {
    return <div className="text-slate-400 text-sm">Esperando evaluación del circuito...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-2">Disco de Fase Cuántica</h3>
      <p className="text-xs text-slate-500 mb-4">Representación visual de la amplitud y fase del vector de estado.</p>
      <div className="w-32 h-32 rounded-full border-2 border-cyan-500/40 bg-cyan-950/20 flex items-center justify-center shadow-inner">
        <span className="text-xs text-cyan-300 font-mono">|Ψ⟩ Estado Activo</span>
      </div>
    </div>
  );
}
