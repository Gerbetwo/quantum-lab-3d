'use client';

import type { SceneHandle } from '@/lib/three/createScene';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LeanLabLayout from '@/components/LeanLabLayout';
import GatePalette from '@/components/circuit/GatePalette';
import CircuitGrid from '@/components/circuit/CircuitGrid';
import ViewModeSwitcher, { type ViewMode } from '@/components/circuit/ViewModeSwitcher';
import PhaseDiskView from '@/components/viewports/PhaseDiskView';
import BlochPairView from '@/components/viewports/BlochPairView';
import HistogramView from '@/components/viewports/HistogramView';
import CommandPalette, { type Command } from '@/components/CommandPalette';
import {
  createEmptyCircuit, placeGate, removeGate, evaluateUpToStep,
  type GateType, type QuantumCircuit, type QubitIndex,
} from '@/domain/quantum/circuit';
import { ghz6Circuit, teleportation3Circuit, qft3Circuit } from '@/domain/quantum/presets';
import {
  playButtonClick, playChimeSuccess, playGatePlaced, playStepAdvance,
  playMeasurementCollapse,
} from '@/lib/sound';
import { useThreeScene } from '@/hooks/useThreeScene';
import { useMeasurementBurst } from '@/hooks/useMeasurementBurst';
import MeasurementParticles, {
  type MeasurementParticlesHandle,
} from '@/components/canvas/MeasurementParticles';

type Preset = 'ghz6' | 'teleportation3' | 'qft3';

const PRESETS: Record<Preset, { title: string; factory: () => QuantumCircuit }> = {
  ghz6: { title: 'GHZ 6-qubit', factory: ghz6Circuit },
  teleportation3: { title: 'Teleportacion 3-qubit', factory: teleportation3Circuit },
  qft3: { title: 'QFT 3-qubit', factory: qft3Circuit },
};

const CONTROLLED: readonly GateType[] = ['CNOT', 'CZ', 'CS', 'CT'];

export default function LabPage() {
  const [circuit, setCircuit] = useState<QuantumCircuit>(() => createEmptyCircuit(6, 16));
  const [activeGate, setActiveGate] = useState<GateType | null>(null);
  const [playhead, setPlayhead] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('histogram');
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);

  // Invisible overlay for particle bursts (own mini renderer, sized to grid area)
  const particleContainerRef = useRef<HTMLDivElement>(null);

  // Minimal scene just for particles (its own lifecycle, independent of missions)
  const particleScene = useRef<SceneHandle | null>(null);

  const { controllerRef: particleControllerRef, burst } = useMeasurementBurst(particleScene);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const state = useMemo(() => evaluateUpToStep(circuit, playhead), [circuit, playhead]);

  const handlePlaceGate = useCallback(
    (step: number, qubit: QubitIndex) => {
      if (!activeGate) return;
      try {
        const n = circuit.nQubits;
        if (CONTROLLED.includes(activeGate)) {
          const control = qubit;
          const target = ((qubit + 1) % n) as QubitIndex;
          if (control === target) return;
          setCircuit((c) => placeGate(c, { type: activeGate, step, targets: [target], controls: [control] }));
        } else if (activeGate === 'SWAP') {
          const target2 = ((qubit + 1) % n) as QubitIndex;
          if (qubit === target2) return;
          setCircuit((c) => placeGate(c, { type: activeGate, step, targets: [qubit, target2] }));
        } else {
          setCircuit((c) => placeGate(c, { type: activeGate, step, targets: [qubit] }));
        }
        playGatePlaced();
      } catch { /* ignore invalid placement */ }
    },
    [activeGate, circuit.nQubits],
  );

  const handleRemoveGate = useCallback((gateId: string) => {
    setCircuit((c) => removeGate(c, gateId));
    playButtonClick();
  }, []);

  const handleSetPlayhead = useCallback((n: number) => {
    setPlayhead(n);
    playStepAdvance();
  }, []);

  const handleRun = useCallback(() => {
    setPlayhead(circuit.depth);
    playChimeSuccess();
    playMeasurementCollapse(0);
    burst([0, 0, 0], 0x00f0ff);
  }, [circuit.depth, burst]);

  const handleStepNext = useCallback(() => {
    setPlayhead((p) => Math.min(p + 1, circuit.depth));
    playStepAdvance();
  }, [circuit.depth]);

  const handleReset = useCallback(() => {
    setCircuit(createEmptyCircuit(circuit.nQubits, circuit.depth));
    setPlayhead(0);
    playButtonClick();
  }, [circuit.nQubits, circuit.depth]);

  const loadPreset = useCallback((preset: Preset) => {
    setCircuit(PRESETS[preset].factory());
    setPlayhead(0);
    playChimeSuccess();
  }, []);

  const commands: Command[] = useMemo(() => [
    { id: 'circuits:run', title: 'Ejecutar circuito completo', keywords: ['run', 'ejecutar', 'simular'], category: 'circuits', action: handleRun },
    { id: 'circuits:step-next', title: 'Avanzar un paso', keywords: ['step', 'paso', 'next'], category: 'circuits', action: handleStepNext },
    { id: 'circuits:reset', title: 'Limpiar circuito', keywords: ['reset', 'limpiar', 'clear'], category: 'circuits', action: handleReset },
    { id: 'circuits:preset-ghz', title: 'Cargar estado GHZ 6-qubit', keywords: ['ghz', 'preset'], category: 'circuits', action: () => loadPreset('ghz6') },
    { id: 'circuits:preset-teleport', title: 'Cargar teleportacion 3-qubit', keywords: ['teleport', 'preset'], category: 'circuits', action: () => loadPreset('teleportation3') },
    { id: 'circuits:preset-qft', title: 'Cargar QFT 3-qubit', keywords: ['qft', 'fourier', 'preset'], category: 'circuits', action: () => loadPreset('qft3') },
  ], [handleRun, handleStepNext, handleReset, loadPreset]);

  return (
    <>
      <LeanLabLayout
        header={<span className="text-xs font-mono text-slate-400">Paso {playhead}/{circuit.depth}</span>}
        viewport={
          <div className="w-full flex flex-col lg:flex-row gap-4">
            <aside className="shrink-0">
              <GatePalette selected={activeGate} onSelect={setActiveGate} />
            </aside>
            <div className="flex-1 flex flex-col min-w-0">
              <ViewModeSwitcher mode={viewMode} onChange={setViewMode} />
              <div className="rounded-2xl overflow-hidden bg-surface-1 border border-edge relative">
                {viewMode === 'bloch' && circuit.nQubits <= 2 && (
                  <BlochPairView state={state} nQubits={circuit.nQubits} />
                )}
                {viewMode === 'bloch' && circuit.nQubits > 2 && (
                  <div className="p-4 text-xs text-slate-400">
                    La vista de Bloch solo aplica a 1-2 qubits. Usa histograma o discos de fase.
                  </div>
                )}
                {viewMode === 'histogram' && <HistogramView state={state} />}
                {viewMode === 'phase-disk' && <PhaseDiskView state={state} />}
                {/* Particle overlay (absolute, pointer-events-none) */}
                <div
                  ref={particleContainerRef}
                  aria-hidden="true"
                  data-testid="measurement-particles-overlay"
                  className="absolute inset-0 pointer-events-none"
                />
                <MeasurementParticles
                  ref={particleControllerRef}
                  sceneRef={particleScene}
                  maxInstances={1000}
                />
              </div>
            </div>
          </div>
        }
        circuitBar={
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 justify-center">
              {(Object.keys(PRESETS) as Preset[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => loadPreset(k)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-edge hover:bg-surface-1 transition-colors"
                >
                  {PRESETS[k].title}
                </button>
              ))}
            </div>
            <CircuitGrid
              circuit={circuit}
              activeGate={activeGate}
              playhead={playhead}
              onPlaceGate={handlePlaceGate}
              onRemoveGate={handleRemoveGate}
              onSetPlayhead={handleSetPlayhead}
            />
          </div>
        }
      />
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
    </>
  );
}
