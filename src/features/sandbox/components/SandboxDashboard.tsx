'use client';

import React, { useRef } from 'react';
import { useSandboxState, ViewMode } from '../hooks/useSandboxState';
import ViewModeSwitcher from '@/features/circuit/components/ViewModeSwitcher';
import { BlochPairView, PhaseDiskView, HistogramView } from '@/features/circuit/components/viewports';
import QuantumViewport from '@/features/quantum-3d/components/QuantumViewport';
import { MeasurementParticles } from '@/features/quantum-3d/canvas/MeasurementParticles';
import { CircuitWorkbench } from '@/features/circuit/components/CircuitWorkbench';

export function SandboxDashboard() {
  const dummySceneRef = useRef(null);

  const {
    numQubits,
    stateVector,
    presetParams,
    viewMode,
    isMeasuring,
    setViewMode,
    setPresetParams,
    applyPreset,
  } = useSandboxState(3);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-4 flex flex-col space-y-6 overflow-y-auto">
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Circuitos Predefinidos
            </h2>
            <div className="flex flex-col gap-2">
              <button onClick={() => applyPreset('ghz6')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-cyan-300">
                Cargar GHZ (6 Qubits)
              </button>
              <button onClick={() => applyPreset('teleportation3')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-cyan-300">
                Teletransportación (3 Qubits)
              </button>
              <button onClick={() => applyPreset('qft3')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-cyan-300">
                QFT (3 Qubits)
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Simulación de Ruido Térmico
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Factor de Ruido T1/T2</span>
                  <span>{(presetParams.t1Noise * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={presetParams.t1Noise}
                  onChange={(e) =>
                    setPresetParams({ ...presetParams, t1Noise: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          <div className="h-1/2 border-b border-slate-800 p-4 overflow-x-auto bg-slate-900/20">
            <CircuitWorkbench />
          </div>

          <div className="h-1/2 flex flex-col relative">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-400">VISUALIZADOR CUÁNTICO</span>
              <ViewModeSwitcher
                mode={viewMode as unknown as Parameters<typeof ViewModeSwitcher>[0]['mode']}
                onChange={(m: unknown) => setViewMode(m as ViewMode)}
              />
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-950/80 flex items-center justify-center">
              {isMeasuring && <MeasurementParticles sceneRef={dummySceneRef} />}

              {viewMode === '2d-bloch' && <BlochPairView evaluation={stateVector} />}
              {viewMode === '2d-phase' && <PhaseDiskView evaluation={stateVector} />}
              {viewMode === '2d-histogram' && <HistogramView evaluation={stateVector} />}

              {viewMode.startsWith('3d-') && (
                <QuantumViewport state={stateVector} nQubits={numQubits} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
