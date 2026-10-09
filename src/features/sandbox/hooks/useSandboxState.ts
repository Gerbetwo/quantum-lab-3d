'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  createEmptyCircuit,
  placeGate,
  removeGate,
  evaluateFullCircuit,
} from '@/core/quantum/circuit';
import type { StateVector } from '@/core/quantum/statevector';
import * as PresetsModule from '@/core/quantum/presets';
import * as DecoherenceModule from '@/core/quantum/decoherence';
import * as SoundModule from '@/shared/lib/sound';

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
  const [viewMode, setViewMode] = useState<ViewMode>('2d-bloch');
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
    (gateType: string, targetQubit: number, controlQubit?: number) => {
      if (typeof placeGate === 'function') {
        const payload = { gate: gateType, type: gateType, qubit: targetQubit, target: targetQubit, control: controlQubit, step: 0 };
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
    (stepIndex: number, qubitIndex: number) => {
      if (typeof removeGate === 'function') {
        const payload = { step: stepIndex, qubit: qubitIndex, target: qubitIndex };
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
