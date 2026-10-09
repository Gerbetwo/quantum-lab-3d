'use client';

import React, { useRef } from 'react';
import { useSandboxState, ViewMode } from '../hooks/useSandboxState';
import GatePalette from '@/features/circuit/components/GatePalette';
import ViewModeSwitcher from '@/features/circuit/components/ViewModeSwitcher';
import { BlochPairView } from '@/features/circuit/components/BlochPairView';
import { PhaseDiskView } from '@/features/circuit/components/PhaseDiskView';
import { HistogramView } from '@/features/circuit/components/HistogramView';
import QuantumViewport from '@/features/quantum-3d/components/QuantumViewport';
import { MeasurementParticles } from '@/features/quantum-3d/canvas/MeasurementParticles';
import { CircuitWorkbench } from '@/features/circuit/components/CircuitWorkbench';

export function SandboxDashboard() {
  const dummySceneRef = useRef(null);

  const {
    numQubits,
    circuit,
    stateVector,
    presetParams,
    viewMode,
    isMeasuring,
    setViewMode,
    setPresetParams,
    addGate,
    removeGate,
  } = useSandboxState(3);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-4 flex flex-col space-y-6 overflow-y-auto">
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Catálogo de Puertas
            </h2>
            <GatePalette
              selected={null}
              onSelect={(gate: unknown) => {
                const gateName = typeof gate === 'string' ? gate : (gate as { id?: string })?.id || 'H';
                addGate(gateName, 0);
              }}
            />
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Simulación de Ruido
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Ruido T1 (Relajación)</span>
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
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Ruido T2 (Desfase)</span>
                  <span>{(presetParams.t2Noise * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={presetParams.t2Noise}
                  onChange={(e) =>
                    setPresetParams({ ...presetParams, t2Noise: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          <div className="h-1/2 border-b border-slate-800 p-4 overflow-x-auto bg-slate-900/20">
            <CircuitWorkbench
              {...({
                circuit,
                numQubits,
                onAddGate: addGate,
                onRemoveGate: removeGate,
              } as unknown as Record<string, unknown>)}
            />
          </div>

          <div className="h-1/2 flex flex-col relative">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-400">VISUALIZADOR CUÁNTICO</span>
              <ViewModeSwitcher
                mode={viewMode as unknown as Parameters<typeof ViewModeSwitcher>[0]['mode']}
                onChange={(m: unknown) => setViewMode(m as ViewMode)}
              />
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-950/80">
              {isMeasuring && <MeasurementParticles sceneRef={dummySceneRef} />}

              {viewMode === '2d-bloch' && <BlochPairView evaluation={stateVector as unknown} />}
              {viewMode === '2d-phase' && <PhaseDiskView evaluation={stateVector as unknown} />}
              {viewMode === '2d-histogram' && <HistogramView evaluation={stateVector as unknown} />}

              {viewMode.startsWith('3d-') && (
                <QuantumViewport
                  {...({
                    state: stateVector,
                    nQubits: numQubits,
                    scene: viewMode,
                    activeScene: viewMode,
                    mode: viewMode,
                  } as unknown as React.ComponentProps<typeof QuantumViewport>)}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
