'use client';

import React, { useState } from 'react';
import LeanLabLayout from '@/components/LeanLabLayout';
import QuantumViewport from '@/components/QuantumViewport';
import { bellState, ghzState } from '@/domain/quantum/presets';
import type { StateVector } from '@/domain/quantum/statevector';

type Preset = 'bell' | 'ghz3' | 'ghz5';

const PRESETS: Record<Preset, { nQubits: number; label: string }> = {
  bell: { nQubits: 2, label: 'Bell (2 qubits)' },
  ghz3: { nQubits: 3, label: 'GHZ (3 qubits)' },
  ghz5: { nQubits: 5, label: 'GHZ (5 qubits)' },
};

export default function LabPage() {
  const [preset, setPreset] = useState<Preset>('bell');
  const nQubits = PRESETS[preset].nQubits;
  const state: StateVector = preset === 'bell' ? bellState('phi+') : ghzState(nQubits);
  return (
    <LeanLabLayout
      viewport={<QuantumViewport state={state} nQubits={nQubits} />}
      circuitBar={(
        <div className="flex gap-2 justify-center">
          {(Object.keys(PRESETS) as Preset[]).map((key) => (
            <button key={key} type="button" onClick={() => setPreset(key)}
                    aria-pressed={preset === key}
                    className="px-3 py-1.5 text-xs rounded-lg border border-edge hover:bg-surface-1 transition-colors">
              {PRESETS[key].label}
            </button>
          ))}
        </div>
      )}
    />
  );
}
