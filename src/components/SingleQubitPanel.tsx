'use client';

import React from 'react';
import type { QubitState, StateMetrics } from '@/lib/quantumCore';

export interface SingleQubitPanelProps {
  activeTab: number;
  state: QubitState;
  metrics: StateMetrics;
  lastOutcome: 0 | 1 | null;
  onGate: (gate: 'H' | 'X' | 'Z') => void;
  onMeasure: () => void;
  onReset: () => void;
}

export function formatDirac(m: StateMetrics): string {
  const round = (val: number) => {
    const v = Math.abs(val) < 1e-4 ? 0 : val;
    return v.toFixed(3);
  };

  const alpha = round(m.alpha);
  const br = m.betaReal;
  const bi = m.betaImag;

  let betaTerm = '';
  if (Math.abs(bi) < 1e-4) {
    betaTerm = br < -1e-4 ? `- ${round(Math.abs(br))}|1⟩` : `+ ${round(br)}|1⟩`;
  } else if (Math.abs(br) < 1e-4) {
    betaTerm = bi < -1e-4 ? `- ${round(Math.abs(bi))}i|1⟩` : `+ ${round(bi)}i|1⟩`;
  } else {
    const sign = bi < 0 ? '-' : '+';
    betaTerm = `+ (${round(br)} ${sign} ${round(Math.abs(bi))}i)|1⟩`;
  }

  return `|ψ⟩ = ${alpha}|0⟩ ${betaTerm}`;
}

export function SingleQubitPanel({
  activeTab,
  state,
  metrics,
  lastOutcome,
  onGate,
  onMeasure,
  onReset,
}: SingleQubitPanelProps) {
  const p0Percent = (metrics.prob0 * 100).toFixed(1);
  const p1Percent = (metrics.prob1 * 100).toFixed(1);

  const stepDescriptions = [
    'Single-qubit quantum simulation workspace with real-time state kinematics.',
    'Apply unitary transformation gates (H, X, Z) to rotate the state on the sphere.',
    'Projective measurement collapses superposition into an eigenstate |0⟩ or |1⟩.',
  ];

  const stepTitles = ['1. Superposition', '2. Quantum Gates', '3. Measurement Collapse'];

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            {stepTitles[activeTab]} <span className="text-primary text-sm font-mono font-normal">[v1.0]</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{stepDescriptions[activeTab]}</p>
        </div>

        {/* State Vector Readout */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-1.5">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
            State Vector Readout
          </span>
          <div className="text-xl sm:text-2xl font-mono text-primary font-bold tracking-wide">
            {formatDirac(metrics)}
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            θ: {(state.theta / Math.PI).toFixed(3)}π rad &bull; φ: {(state.phi / Math.PI).toFixed(3)}π rad
          </div>
        </div>

        {/* Born Probabilities */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
            Born Probabilities
          </span>
          <div className="flex justify-between items-center text-sm font-mono font-semibold">
            <span className="text-primary">P(|0⟩): {p0Percent}%</span>
            <span className="text-foreground">P(|1⟩): {p1Percent}%</span>
          </div>
          <div
            className="w-full h-3.5 bg-secondary rounded-full overflow-hidden flex"
            role="progressbar"
            aria-label="[Born Probabilities]"
            aria-valuenow={Math.round(metrics.prob0 * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${metrics.prob0 * 100}%` }} />
            <div className="h-full bg-secondary transition-all duration-300" style={{ width: `${metrics.prob1 * 100}%` }} />
          </div>
        </div>

        {/* Gate Action Buttons */}
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
            Quantum Gates
          </span>
          <div className="grid grid-cols-3 gap-3">
            {(['H', 'X', 'Z'] as const).map((gate) => (
              <button
                key={gate}
                type="button"
                onClick={() => onGate(gate)}
                className="py-2.5 px-4 rounded-lg bg-secondary hover:bg-muted active:scale-95 border border-primary text-primary font-mono font-bold text-sm transition-all shadow-sm hover:shadow-cyan-500/10 cursor-pointer"
              >
                {gate === 'H' ? 'Hadamard (H)' : gate === 'X' ? 'Pauli-X (X)' : 'Pauli-Z (Z)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Measurement & Reset */}
      <div className="pt-4 border-t border-border/80 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={onMeasure}
            className="flex-1 py-3 px-6 rounded-lg bg-linear-to-r from-success to-success hover:from-success hover:to-success text-background font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            Measure State
          </button>
          {lastOutcome !== null && (
            <div className="px-4 py-2.5 rounded-lg bg-secondary border border-success text-success font-mono text-base font-bold text-center">
              Outcome: |{lastOutcome}⟩
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2.5 px-4 rounded-lg bg-secondary hover:bg-secondary border border-border hover:border-border text-foreground hover:text-white font-medium text-sm transition-all active:scale-95 cursor-pointer"
        >
          Reset to |0⟩
        </button>
      </div>
    </>
  );
}
