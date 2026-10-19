'use client';

import React, { useMemo } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { measureEntangledQubit, createBellState } from '@/core/qubitMath';

interface EntanglementOverlayProps {
  className?: string;
}

export function EntanglementOverlay({ className = '' }: EntanglementOverlayProps) {
  const isEntangled = useQuantumStore((s) => s.isEntangled);
  const setEntangled = useQuantumStore((s) => s.setEntangled);
  const lastOutcome = useQuantumStore((s) => s.lastOutcome);
  const setLastOutcome = useQuantumStore((s) => s.setLastOutcome);
  const setTheta = useQuantumStore((s) => s.setTheta);

  const bell = useMemo(() => createBellState(), []);

  const handlePrepareBellState = () => {
    setEntangled(true);
    setTheta(Math.PI / 2);
    setLastOutcome(null);
  };

  const handleMeasureAlice = () => {
    const result = measureEntangledQubit();
    setLastOutcome(result.localOutcome);
    setTheta(result.localOutcome === 0 ? 0 : Math.PI);
  };

  const aliceState = lastOutcome !== null ? `|${lastOutcome}⟩` : isEntangled ? '1/√2(|0⟩+|1⟩)' : '|0⟩';
  const bobState = lastOutcome !== null ? `|${lastOutcome}⟩` : isEntangled ? '1/√2(|0⟩+|1⟩)' : '|0⟩';

  return (
    <div
      data-testid="entanglement-overlay"
      className={`p-4 rounded-xl hud-panel flex flex-col gap-3 text-foreground ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-quantum-cyan animate-pulse" />
          <h3 className="text-xs telemetry-mono font-bold tracking-wider text-quantum-cyan uppercase">
            Bell State |Φ⁺⟩ Correlation
          </h3>
        </div>
        <span
          className={`text-[10px] telemetry-mono px-2 py-0.5 rounded-full ${
            isEntangled
              ? 'hud-badge-cyan'
              : 'bg-surface-2 text-muted-foreground border border-border'
          }`}
        >
          {isEntangled ? '100% Entangled' : 'Separable'}
        </span>
      </div>

      <p className="text-xs text-muted-foreground telemetry-mono">
        {bell.pair} (P(00)={bell.probability00 * 100}%, P(11)={bell.probability11 * 100}%)
      </p>

      {/* Visual Dual-Qubit Correlation Channel */}
      <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-surface-2 border border-border">
        {/* Qubit A (Local / Alice) */}
        <div className="flex-1 flex flex-col items-center text-center p-2 rounded bg-surface-1 border border-border">
          <span className="text-[10px] telemetry-mono text-muted-foreground uppercase">Local (Alice)</span>
          <span className="text-base font-bold telemetry-mono text-quantum-cyan mt-1">{aliceState}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {lastOutcome !== null ? `Collapsed: ${lastOutcome}` : 'Superposition'}
          </span>
        </div>

        {/* Entanglement Correlation Channel */}
        <div className="flex flex-col items-center px-2">
          <div
            className={`h-1 w-16 transition-all duration-300 rounded-full ${
              isEntangled
                ? 'bg-linear-to-r from-quantum-cyan via-quantum-purple to-quantum-cyan animate-pulse glow-cyan'
                : 'bg-surface-3'
            }`}
          />
          <span className="text-[9px] telemetry-mono text-muted-foreground mt-1">EPR Channel</span>
        </div>

        {/* Qubit B (Distant / Bob) */}
        <div className="flex-1 flex flex-col items-center text-center p-2 rounded bg-surface-1 border border-border">
          <span className="text-[10px] telemetry-mono text-muted-foreground uppercase">Distant (Bob)</span>
          <span className="text-base font-bold telemetry-mono text-quantum-purple mt-1">{bobState}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {lastOutcome !== null ? `Instant: ${lastOutcome}` : 'Superposition'}
          </span>
        </div>
      </div>

      {lastOutcome !== null && (
        <div className="p-2.5 rounded hud-badge-emerald text-xs telemetry-mono">
          ✓ Non-local correlation confirmed: Alice={lastOutcome} ↔ Bob={lastOutcome} (Zero |01⟩/|10⟩)
        </div>
      )}

      {/* Action Controls */}
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={handlePrepareBellState}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs telemetry-mono font-semibold hud-badge-cyan hover:opacity-90 transition-all cursor-pointer"
        >
          Prepare |Φ⁺⟩ Pair
        </button>
        <button
          type="button"
          onClick={handleMeasureAlice}
          disabled={!isEntangled}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs telemetry-mono font-semibold hud-badge-purple hover:opacity-90 transition-all cursor-pointer disabled:opacity-40"
        >
          Measure Alice
        </button>
      </div>
    </div>
  );
}

export const BlochPairView = EntanglementOverlay;