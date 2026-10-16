'use client';

import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import type { MissionId } from './missionRegistry';

interface FoundationsControlsProps {
  missionId: MissionId;
}

export function FoundationsControls({ missionId }: FoundationsControlsProps) {
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const temperatureK = useQuantumStore((s) => s.temperatureK);
  const setTheta = useQuantumStore((s) => s.setTheta);
  const setPhi = useQuantumStore((s) => s.setPhi);
  const setTemperatureK = useQuantumStore((s) => s.setTemperatureK);
  const applyGate = useQuantumStore((s) => s.applyGate);
  const setEntangled = useQuantumStore((s) => s.setEntangled);
  const isEntangled = useQuantumStore((s) => s.isEntangled);

  if (missionId === 'superposition') {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-2 border border-edge">
        <span className="text-xs font-mono font-semibold text-cyan uppercase">
          Mission 0: Superposition Presets
        </span>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            type="button"
            onClick={() => { setTheta(0); setPhi(0); }}
            className={`px-3 py-2 rounded text-xs font-mono border transition-all ${
              theta === 0 ? 'bg-cyan/20 border-cyan text-cyan' : 'bg-surface-3 border-edge text-muted-foreground'
            }`}
          >
            |0⟩ Ground (θ=0)
          </button>
          <button
            type="button"
            onClick={() => { setTheta(Math.PI); setPhi(0); }}
            className={`px-3 py-2 rounded text-xs font-mono border transition-all ${
              Math.abs(theta - Math.PI) < 0.05 ? 'bg-cyan/20 border-cyan text-cyan' : 'bg-surface-3 border-edge text-muted-foreground'
            }`}
          >
            |1⟩ Excited (θ=π)
          </button>
          <button
            type="button"
            onClick={() => { setTheta(Math.PI / 2); setPhi(0); }}
            className={`px-3 py-2 rounded text-xs font-mono border transition-all ${
              Math.abs(theta - Math.PI / 2) < 0.05 && phi === 0 ? 'bg-cyan/20 border-cyan text-cyan' : 'bg-surface-3 border-edge text-muted-foreground'
            }`}
          >
            |+⟩ Superposition
          </button>
          <button
            type="button"
            onClick={() => { setTheta(Math.PI / 2); setPhi(Math.PI); }}
            className={`px-3 py-2 rounded text-xs font-mono border transition-all ${
              Math.abs(theta - Math.PI / 2) < 0.05 && Math.abs(phi - Math.PI) < 0.05 ? 'bg-cyan/20 border-cyan text-cyan' : 'bg-surface-3 border-edge text-muted-foreground'
            }`}
          >
            |−⟩ Phase Opposite
          </button>
        </div>
      </div>
    );
  }

  if (missionId === 'entanglement') {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-2 border border-edge">
        <span className="text-xs font-mono font-semibold text-purple-400 uppercase">
          Mission 1: Bell State |Φ⁺⟩ Controls
        </span>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => { setEntangled(true); setTheta(Math.PI / 2); }}
            className={`flex-1 px-3 py-2 rounded text-xs font-mono border transition-all ${
              isEntangled ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-surface-3 border-edge text-muted-foreground'
            }`}
          >
            Create |Φ⁺⟩ = 1/√2(|00⟩+|11⟩)
          </button>
          <button
            type="button"
            onClick={() => { setEntangled(false); setTheta(0); }}
            className="px-3 py-2 rounded text-xs font-mono bg-surface-3 border border-edge text-muted-foreground hover:bg-muted"
          >
            Separate
          </button>
        </div>
      </div>
    );
  }

  if (missionId === 'decoherence') {
    const temps = [
      { label: '15 mK (Base)', val: 0.015 },
      { label: '4 K (L-He)', val: 4.0 },
      { label: '77 K (L-N2)', val: 77.0 },
      { label: '300 K (Room)', val: 300.0 },
    ];
    return (
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-2 border border-edge">
        <span className="text-xs font-mono font-semibold text-amber-400 uppercase">
          Mission 2: Cryogenic Temperature
        </span>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {temps.map((t) => (
            <button
              key={t.val}
              type="button"
              onClick={() => setTemperatureK(t.val)}
              className={`px-3 py-2 rounded text-xs font-mono border transition-all ${
                Math.abs(temperatureK - t.val) < 0.001
                  ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                  : 'bg-surface-3 border-edge text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Mission 3: Gates
  const gates = ['H', 'X', 'Y', 'Z', 'S', 'T'] as const;
  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-2 border border-edge">
      <span className="text-xs font-mono font-semibold text-emerald-400 uppercase">
        Mission 3: Quantum Gate Palette
      </span>
      <div className="grid grid-cols-3 gap-2 mt-1">
        {gates.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => applyGate(g)}
            className="px-3 py-2 rounded text-xs font-mono font-bold bg-surface-3 hover:bg-muted border border-edge text-foreground transition-all active:scale-95"
          >
            Gate [{g}]
          </button>
        ))}
      </div>
    </div>
  );
}
