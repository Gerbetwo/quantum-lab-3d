'use client';

import React, { useState, useTransition, useCallback, useMemo } from 'react';
import GatePalette from './GatePalette';
import CircuitGrid from './CircuitGrid';
import ViewModeSwitcher, { ViewMode } from './ViewModeSwitcher';
import { PhaseDiskView } from './PhaseDiskView';
import { BlochPairView } from './BlochPairView';
import { HistogramView } from './HistogramView';
import {
  createEmptyCircuit,
  evaluateFullCircuit,
  placeGate,
  removeGate,
  QuantumCircuit,
  GateType,
  QubitIndex,
} from '@/domain/quantum/circuit';
import {
  teleportation3Circuit,
  qft3Circuit,
} from '@/domain/quantum/presets';

// Constructores de circuitos predefinidos para presets
function createBellCircuit(): QuantumCircuit {
  let c = createEmptyCircuit(2, 8);
  c = placeGate(c, { type: 'H' as GateType, targets: [0 as QubitIndex], step: 0 });
  c = placeGate(c, {
    type: 'CNOT' as GateType,
    targets: [1 as QubitIndex],
    controls: [0 as QubitIndex],
    step: 1,
  });
  return c;
}

function createGhzCircuit(): QuantumCircuit {
  let c = createEmptyCircuit(3, 8);
  c = placeGate(c, { type: 'H' as GateType, targets: [0 as QubitIndex], step: 0 });
  c = placeGate(c, {
    type: 'CNOT' as GateType,
    targets: [1 as QubitIndex],
    controls: [0 as QubitIndex],
    step: 1,
  });
  c = placeGate(c, {
    type: 'CNOT' as GateType,
    targets: [2 as QubitIndex],
    controls: [1 as QubitIndex],
    step: 2,
  });
  return c;
}

function createWStateCircuit(): QuantumCircuit {
  let c = createEmptyCircuit(3, 8);
  c = placeGate(c, { type: 'H' as GateType, targets: [0 as QubitIndex], step: 0 });
  c = placeGate(c, {
    type: 'CNOT' as GateType,
    targets: [1 as QubitIndex],
    controls: [0 as QubitIndex],
    step: 1,
  });
  c = placeGate(c, { type: 'X' as GateType, targets: [2 as QubitIndex], step: 2 });
  return c;
}

interface PresetOption {
  id: string;
  name: string;
  getCircuit: () => QuantumCircuit;
}

const PRESET_OPTIONS: PresetOption[] = [
  { id: 'bell', name: 'Estado Bell (|Φ+⟩)', getCircuit: createBellCircuit },
  { id: 'ghz', name: 'Estado GHZ (3 Qubits)', getCircuit: createGhzCircuit },
  { id: 'w', name: 'Estado W', getCircuit: createWStateCircuit },
  {
    id: 'teleportation',
    name: 'Teletransportación Cuántica',
    getCircuit: () => teleportation3Circuit(),
  },
  { id: 'qft', name: 'QFT (3 Qubits)', getCircuit: () => qft3Circuit() },
];

export function CircuitWorkbench() {
  const [circuit, setCircuit] = useState<QuantumCircuit>(() => createEmptyCircuit(3, 8));
  const [selectedGate, setSelectedGate] = useState<GateType | null>(null);
  const [playhead, setPlayhead] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('phase-disk');
  const [, startTransition] = useTransition();

  const handleSelectGate = useCallback((gateType: string) => {
    setSelectedGate(prev => (prev === gateType ? null : (gateType as GateType)));
  }, []);

  // CircuitGrid llama a onPlaceGate(step, qubit) — el orden importa.
  const handlePlaceGate = useCallback(
    (stepIndex: number, qubitIndex: QubitIndex) => {
      if (!selectedGate) return;

      setCircuit(prevCircuit => {
        try {
          const isControlled =
            selectedGate === 'CNOT' ||
            selectedGate === 'CZ' ||
            selectedGate === 'SWAP';

          let targetQubit: QubitIndex = qubitIndex;
          let controlQubit: QubitIndex | undefined = undefined;

          if (isControlled) {
            controlQubit = qubitIndex;
            targetQubit = (
              qubitIndex + 1 < prevCircuit.nQubits ? qubitIndex + 1 : qubitIndex - 1
            ) as QubitIndex;
          }

          return placeGate(prevCircuit, {
            type: selectedGate,
            targets: [targetQubit],
            controls: controlQubit !== undefined ? [controlQubit] : undefined,
            step: stepIndex,
          });
        } catch (e) {
          console.warn('Ubicación de puerta no válida:', e);
          return prevCircuit;
        }
      });
    },
    [selectedGate],
  );

  const handleRemoveGate = useCallback((gateId: string) => {
    setCircuit(prevCircuit => removeGate(prevCircuit, gateId));
  }, []);

  const handleLoadPreset = useCallback((presetId: string) => {
    const option = PRESET_OPTIONS.find(p => p.id === presetId || p.name === presetId);
    if (option) {
      startTransition(() => {
        setCircuit(option.getCircuit());
      });
    }
  }, []);

  const handleReset = useCallback(() => {
    setCircuit(createEmptyCircuit(3, 8));
    setSelectedGate(null);
    setPlayhead(0);
  }, []);

  const evaluationResult = useMemo(() => {
    try {
      return evaluateFullCircuit(circuit);
    } catch (e) {
      console.error('Error al evaluar el circuito:', e);
      return null;
    }
  }, [circuit]);

  return (
    <div
      className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-6"
      data-testid="circuit-workbench"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Laboratorio Cuántico Interactivo</h1>
          <p className="text-sm text-slate-400">
            Diseña, simula e inspecciona circuitos cuánticos en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            onChange={e => handleLoadPreset(e.target.value)}
            defaultValue=""
            data-testid="preset-selector"
          >
            <option value="" disabled>
              Cargar circuito predefinido...
            </option>
            {PRESET_OPTIONS.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            data-testid="reset-circuit-btn"
          >
            Reiniciar
          </button>
        </div>
      </header>

      <section className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Paleta de Puertas
        </h2>
        <GatePalette selected={selectedGate} onSelect={handleSelectGate} />
      </section>

      <section className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow-xl overflow-x-auto">
        <CircuitGrid
          circuit={circuit}
          activeGate={selectedGate}
          playhead={playhead}
          onPlaceGate={handlePlaceGate}
          onRemoveGate={handleRemoveGate}
          onSetPlayhead={setPlayhead}
        />
      </section>

      <section className="flex flex-col gap-4 bg-slate-900/60 p-6 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Visualización del Estado</h2>
          <ViewModeSwitcher mode={viewMode} onChange={setViewMode} />
        </div>

        <div className="min-h-62.5 flex items-center justify-center bg-slate-950 rounded-lg p-4 border border-slate-800/80">
          {viewMode === 'phase-disk' && <PhaseDiskView evaluation={evaluationResult} />}
          {viewMode === 'bloch' && <BlochPairView evaluation={evaluationResult} />}
          {viewMode === 'histogram' && <HistogramView evaluation={evaluationResult} />}
        </div>
      </section>
    </div>
  );
}