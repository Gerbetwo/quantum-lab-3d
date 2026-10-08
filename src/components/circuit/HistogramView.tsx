'use client';

import React from 'react';

interface HistogramViewProps {
  evaluation: any;
}

export function HistogramView({ evaluation }: HistogramViewProps) {
  if (!evaluation) {
    return <div className="text-slate-400 text-sm">Esperando evaluación del circuito...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full max-w-md">
      <h3 className="text-sm font-semibold text-slate-300 mb-2">Histograma de Probabilidad</h3>
      <p className="text-xs text-slate-500 mb-4">Distribución de probabilidad de medición |x|²</p>
      <div className="w-full h-32 bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-end justify-around gap-2">
        <div className="w-8 bg-cyan-500 rounded-t h-[80%] flex items-center justify-center text-[10px] text-slate-950 font-bold">00</div>
        <div className="w-8 bg-cyan-500/30 rounded-t h-[10%]"></div>
        <div className="w-8 bg-cyan-500/30 rounded-t h-[10%]"></div>
        <div className="w-8 bg-cyan-500 rounded-t h-[80%] flex items-center justify-center text-[10px] text-slate-950 font-bold">11</div>
      </div>
    </div>
  );
}
