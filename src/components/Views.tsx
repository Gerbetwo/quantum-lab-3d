'use client';

import { MISSIONS } from '@/features/quantum-core/quantum-missions-core';
import { CircuitWorkbench, ViewModeSwitcher, BlochPairView, PhaseDiskView, HistogramView } from '@/features/quantum-core/quantum-ui-components';
import { createEmptyCircuit, placeGate, removeGate, evaluateFullCircuit } from '@/lib/quantumCore';
import type { StateVector } from '@/lib/quantumCore';
import * as PresetsModule from '@/lib/quantumCore';
import * as DecoherenceModule from '@/lib/quantumCore';
import { useSession } from '@/store/useQuantumStore';
import { Link } from 'lucide-react';
import { useRef, useState, useMemo, useCallback } from 'react';
import { MeasurementParticles, QuantumViewport } from './BlochCanvas';

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
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-border bg-background-50 p-4 flex flex-col space-y-6 overflow-y-auto">
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Circuitos Predefinidos
            </h2>
            <div className="flex flex-col gap-2">
              <button onClick={() => applyPreset('ghz6')} className="px-3 py-2 bg-card hover:bg-muted text-xs rounded-lg text-accent cursor-pointer">
                Cargar GHZ (6 Qubits)
              </button>
              <button onClick={() => applyPreset('teleportation3')} className="px-3 py-2 bg-card hover:bg-muted text-xs rounded-lg text-accent cursor-pointer">
                Teletransportación (3 Qubits)
              </button>
              <button onClick={() => applyPreset('qft3')} className="px-3 py-2 bg-card hover:bg-muted text-xs rounded-lg text-accent cursor-pointer">
                QFT (3 Qubits)
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Simulación de Ruido Térmico
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-muted-foreground mb-1">
                  <span>Factor de Ruido T1/T2</span>
                  <span>{(presetParams.t1Noise * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={presetParams.t1Noise}
                  onChange={(_e) =>
                    setPresetParams({ ...presetParams, t1Noise: parseFloat(_e.target.value) })
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="h-1/2 border-b border-border p-4 overflow-x-auto bg-background-20">
            <CircuitWorkbench />
          </div>

          <div className="h-1/2 flex flex-col relative">
            <div className="flex items-center justify-between px-4 py-2 bg-background-60 border-b border-border">
              <span className="text-xs font-mono text-muted-foreground">VISUALIZADOR CUÁNTICO</span>
              <ViewModeSwitcher
                mode={viewMode as unknown as Parameters<typeof ViewModeSwitcher>[0]['mode']}
                onChange={(_m: unknown) => setViewMode(_m as ViewMode)}
              />
            </div>

            <div className="flex-1 relative overflow-hidden bg-background-80 flex items-center justify-center">
              {isMeasuring && <MeasurementParticles sceneRef={dummySceneRef} />}

              {viewMode === ('2d-bloch' as unknown as ViewMode) && <BlochPairView evaluation={stateVector} />}
              {viewMode === ('2d-phase' as unknown as ViewMode) && <PhaseDiskView evaluation={stateVector} />}
              {viewMode === ('2d-histogram' as unknown as ViewMode) && <HistogramView evaluation={stateVector} />}

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

export type Circuit = ReturnType<typeof createEmptyCircuit>;
export type SandboxPreset = 'custom' | string;
export type ViewMode =
  | '2d-bloch'
  | '2d-phase'
  | '2d-histogram'
  | '3d-bloch'
  | '3d-entanglement'
  | '3d-shor'
  | '3d-cryostat';

export function useSandboxState(initialQubits: number = 3) {
  const [numQubits, setNumQubits] = useState<number>(initialQubits);
  const [circuit, setCircuit] = useState<Circuit>(() => createEmptyCircuit(initialQubits));
  const [activePreset, setActivePreset] = useState<SandboxPreset>('custom');
  const [viewMode, setViewMode] = useState<ViewMode>('2d-bloch' as ViewMode);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [lastMeasurement, setLastMeasurement] = useState<number[] | null>(null);

  const [presetParams, setPresetParams] = useState({
    groverTarget: '101',
    shorFactorTarget: 15,
    t1Noise: 0,
    t2Noise: 0,
  });

  const stateVector = useMemo(() => {
    let sv = evaluateFullCircuit(circuit) as unknown as StateVector;

    const decoherFn = (DecoherenceModule as Record<string, unknown>).applyDecoherence || (DecoherenceModule as Record<string, unknown>).applyNoise;
    if (typeof decoherFn === 'function' && (presetParams.t1Noise > 0 || presetParams.t2Noise > 0)) {
      sv = (decoherFn as (s: StateVector, t1: number, t2: number) => StateVector)(sv, presetParams.t1Noise, presetParams.t2Noise);
    }
    return sv;
  }, [circuit, presetParams.t1Noise, presetParams.t2Noise]);

  const handleQubitCountChange = useCallback((newCount: number) => {
    setNumQubits(newCount);
    setCircuit(createEmptyCircuit(newCount));
    setActivePreset('custom');
    setLastMeasurement(null);
  }, []);

  const applyPreset = useCallback((presetKey: SandboxPreset) => {
    setActivePreset(presetKey);
    if (presetKey === 'custom') return;

    const presetsObj = (PresetsModule as Record<string, unknown>).QUANTUM_PRESETS || (PresetsModule as Record<string, unknown>).PRESETS || PresetsModule;
    const presetConfig = (presetsObj as Record<string, unknown>)[presetKey] as { numQubits?: number; gates?: Array<{ type: string; targetQubits: number[] }> } | undefined;

    if (presetConfig) {
      const targetQubits = presetConfig.numQubits || 3;
      let newCircuit = createEmptyCircuit(targetQubits);
      if (Array.isArray(presetConfig.gates)) {
        presetConfig.gates.forEach((g) => {
          if (typeof placeGate === 'function') {
            const placement = { gate: g.type, type: g.type, qubit: g.targetQubits[0], target: g.targetQubits[0], step: 0 };
            newCircuit = (placeGate as unknown as (c: Circuit, p: unknown) => Circuit)(newCircuit, placement);
          }
        });
      }
      setNumQubits(targetQubits);
      setCircuit(newCircuit);
    }
  }, []);

  const addGate = useCallback(
    (gateType: string, targetQubit: number, _controlQubit?: number) => {
      if (typeof placeGate === 'function') {
        const payload = { gate: gateType, type: gateType, qubit: targetQubit, target: targetQubit, control: _controlQubit, step: 0 };
        const newCircuit = (placeGate as unknown as (c: Circuit, p: unknown) => Circuit)(circuit, payload);
        setCircuit(newCircuit);
      }
      setActivePreset('custom');

      if (soundEnabled && typeof (SoundModule as Record<string, unknown>).playGateSound === 'function') {
        ((SoundModule as Record<string, unknown>).playGateSound as (g: string) => void)(gateType);
      }
    },
    [circuit, soundEnabled]
  );

  const removeGateAtStep = useCallback(
    (_stepIndex: number, qubitIndex: number) => {
      if (typeof removeGate === 'function') {
        const payload = { step: _stepIndex, qubit: qubitIndex, target: qubitIndex };
        const newCircuit = (removeGate as unknown as (c: Circuit, p: unknown) => Circuit)(circuit, payload);
        setCircuit(newCircuit);
      }
      setActivePreset('custom');
    },
    [circuit]
  );

  const triggerMeasurement = useCallback(() => {
    setIsMeasuring(true);
    const measurementResult: number[] = Array.from({ length: numQubits }, () => (Math.random() > 0.5 ? 1 : 0));
    setLastMeasurement(measurementResult);

    if (soundEnabled && typeof (SoundModule as Record<string, unknown>).playMeasurementSound === 'function') {
      ((SoundModule as Record<string, unknown>).playMeasurementSound as () => void)();
    }

    setTimeout(() => {
      setIsMeasuring(false);
    }, 1200);
  }, [soundEnabled, numQubits]);

  return {
    numQubits,
    circuit,
    stateVector,
    activePreset,
    presetParams,
    viewMode,
    soundEnabled,
    isMeasuring,
    lastMeasurement,
    setNumQubits: handleQubitCountChange,
    setViewMode,
    setSoundEnabled,
    setPresetParams,
    applyPreset,
    addGate,
    removeGate: removeGateAtStep,
    triggerMeasurement,
  };
}

export function HomeDashboard() {
  const { session, isHydrated } = useSession();
  const completedIds = session?.completed || [];
  const hasProgress = isHydrated && completedIds.length > 0;

  let _targetMissionId = session?.activeMission || MISSIONS[0].id;
  if (isHydrated) {
    const nextIncomplete = MISSIONS.find((_m: { id: any; }) => !completedIds.includes(_m.id));
    if (nextIncomplete) {
      _targetMissionId = nextIncomplete.id;
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <section className="text-center mx-auto px-4 max-w-4xl">
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-indigo-500 tracking-tighter leading-tight drop-shadow-[0_0_40px_rgba(6,182,212,0.25)]">
          Quantum computing, through experimentation
        </h1>
        
        <p className="text-xl sm:text-2xl text-muted-foreground font-normal max-w-2xl mx-auto mt-6 leading-relaxed">
          Explore quantum states through interactive 3D simulations, superposition, entanglement, and thermal decoherence.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-8">
          <Link
            href={`/learn`}
            className="px-8 py-4 rounded-xl bg-accent hover:bg-accent text-accent-foreground font-bold shadow-xl shadow-hud-glow transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            {hasProgress ? 'Continue Journey' : 'Start Journey'} &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}