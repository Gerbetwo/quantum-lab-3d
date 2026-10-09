
/**
 * Fallback accesible cuando WebGL no está disponible
 */
import React from 'react';

export function SceneFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-slate-900 text-slate-300 rounded-xl border border-slate-700">
      <svg className="w-12 h-12 mb-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-sm font-medium text-center">WebGL no está disponible o no es compatible con este dispositivo.</p>
      <p className="text-xs text-slate-500 mt-1">Se muestra una representación simplificada de la simulación cuántica.</p>
    </div>
  );
}
