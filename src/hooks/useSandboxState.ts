'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  createEmptyCircuit,
  placeGate,
  removeGate,
  evaluateFullCircuit,
  type QuantumCircuit,
} from '@/core/quantum/circuit';
import type { StateVector } from '@/core/quantum/types';
import * as PresetsModule from '@/core/quantum/presets';
import * as DecoherenceModule from '@/core/quantum/decoherence';
import * as SoundModule from '@/shared/lib/sound';

export type SandboxPreset = 'custom' | 'ghz6' | 'teleportation3' | 'qft3';
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
  const [circuit, setCircuit] = useState<QuantumCircuit>(() => createEmptyCircuit(initialQubits));
  const [activePreset, setActivePreset] = useState<SandboxPreset>('custom');
  const [viewMode, setViewMode] = useState<ViewMode>('2d-bloch');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [lastMeasurement, setLastMeasurement] = useState<number[] | null>(null);

  const [presetParams, setPresetParams] = useState({
    t1Noise: 0,
    t2Noise: 0,
  });

  const stateVector = useMemo(() => {
    let sv = evaluateFullCircuit(circuit).final as StateVector;
    
    if (presetParams.t1Noise > 0 || presetParams.t2Noise > 0) {
      const tempKelvin = (presetParams.t1Noise + presetParams.t2Noise) * 100000;
      const t2 = DecoherenceModule.calculateCoherenceTime(tempKelvin);
      if (t2 < 100 && sv.length > 0) {
        sv = DecoherenceModule.applyDecoherenceToState(sv, 0.95);
      }
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
    let newCircuit = createEmptyCircuit(numQubits);
    
    if (presetKey === 'ghz6') {
      newCircuit = PresetsModule.ghz6Circuit();
      setNumQubits(6);
    } else if (presetKey === 'teleportation3') {
      newCircuit = PresetsModule.teleportation3Circuit();
      setNumQubits(3);
    } else if (presetKey === 'qft3') {
      newCircuit = PresetsModule.qft3Circuit();
      setNumQubits(3);
    }
    setCircuit(newCircuit);
  }, [numQubits]);

  const addGate = useCallback(
    (gateType: string, stepIndex: number, targetQubit: number, controlQubit?: number) => {
      const placement = {
        id: `gate-${Math.random().toString(36).substr(2, 9)}`,
        type: gateType,
        targets: [targetQubit],
        controls: controlQubit !== undefined ? [controlQubit] : undefined,
        step: stepIndex,
      };
      const newCircuit = placeGate(circuit, placement, stepIndex);
      setCircuit(newCircuit);
      setActivePreset('custom');

      if (soundEnabled) {
        SoundModule.playButtonClick();
      }
    },
    [circuit, soundEnabled]
  );

  const removeGateAtId = useCallback(
    (gateId: string) => {
      const newCircuit = removeGate(circuit, gateId);
      setCircuit(newCircuit);
      setActivePreset('custom');
    },
    [circuit]
  );

  const triggerMeasurement = useCallback(() => {
    setIsMeasuring(true);
    const measurementResult: number[] = Array.from({ length: numQubits }, () => (Math.random() > 0.5 ? 1 : 0));
    setLastMeasurement(measurementResult);

    if (soundEnabled) {
      SoundModule.playQuantumCollapse();
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
    removeGate: removeGateAtId,
    triggerMeasurement,
  };
}
