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
      className={`p-4 rounded-xl border border-cyan/40 bg-card/90 backdrop-blur-md shadow-xl flex flex-col gap-3 text-foreground ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan animate-pulse" />
          <h3 className="text-xs font-mono font-bold tracking-wider text-cyan uppercase">
            Bell State |Φ⁺⟩ Correlation
          </h3>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            isEntangled
              ? 'bg-cyan/10 border-cyan text-cyan'
              : 'bg-muted/30 border-border text-muted-foreground'
          }`}
        >
          {isEntangled ? '100% Entangled' : 'Separable'}
        </span>
      </div>

      <p className="text-xs text-muted-foreground font-mono">
        {bell.pair} (P(00)={bell.probability00 * 100}%, P(11)={bell.probability11 * 100}%)
      </p>

      {/* Visual Dual-Qubit Correlation Channel */}
      <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-background/80 border border-border">
        {/* Qubit A (Local / Alice) */}
        <div className="flex-1 flex flex-col items-center text-center p-2 rounded bg-surface-2 border border-edge">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Local (Alice)</span>
          <span className="text-base font-bold font-mono text-cyan mt-1">{aliceState}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {lastOutcome !== null ? `Collapsed: ${lastOutcome}` : 'Superposition'}
          </span>
        </div>

        {/* Entanglement Correlation Channel */}
        <div className="flex flex-col items-center px-2">
          <div
            className={`h-1 w-16 transition-all duration-300 rounded-full ${
              isEntangled
                ? 'bg-gradient-to-r from-cyan via-purple-500 to-cyan animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.8)]'
                : 'bg-border'
            }`}
          />
          <span className="text-[9px] font-mono text-muted-foreground mt-1">EPR Channel</span>
        </div>

        {/* Qubit B (Distant / Bob) */}
        <div className="flex-1 flex flex-col items-center text-center p-2 rounded bg-surface-2 border border-edge">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Distant (Bob)</span>
          <span className="text-base font-bold font-mono text-purple-400 mt-1">{bobState}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {lastOutcome !== null ? `Instant: ${lastOutcome}` : 'Superposition'}
          </span>
        </div>
      </div>

      {lastOutcome !== null && (
        <div className="p-2.5 rounded hud-badge-emerald text-xs font-mono">
          ✓ Non-local correlation confirmed: Alice={lastOutcome} ↔ Bob={lastOutcome} (Zero |01⟩/|10⟩)
        </div>
      )}

      {/* Action Controls */}
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={handlePrepareBellState}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-cyan/15 hover:bg-cyan/25 text-cyan border border-cyan/40 transition-colors"
        >
          Prepare |Φ⁺⟩ Pair
        </button>
        <button
          type="button"
          onClick={handleMeasureAlice}
          disabled={!isEntangled}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Measure Alice
        </button>
      </div>
    </div>
  );
}

export const BlochPairView = EntanglementOverlay;
