'use client';

import React from 'react';
import type { QubitState, StateMetrics } from '@/core/qubitMath';
import { useTranslation } from '@/hooks/useTranslation';

export interface SingleQubitPanelProps {
  activeTab: number;
  state: QubitState;
  metrics: StateMetrics;
  lastOutcome: 0 | 1 | null;
  onGate: (gate: 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T') => void;
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
  const { t } = useTranslation();
  const p0Percent = (metrics.prob0 * 100).toFixed(1);
  const p1Percent = (metrics.prob1 * 100).toFixed(1);

  const stepDescriptions = [
    t('panels.singleQubit.step_0_desc'),
    t('panels.singleQubit.step_1_desc'),
    t('panels.singleQubit.step_2_desc'),
  ];

  const stepTitles = [
    t('panels.singleQubit.step_0_title'),
    t('panels.singleQubit.step_1_title'),
    t('panels.singleQubit.step_2_title'),
  ];

  return (
    <div className="space-y-3.5">
      <div>
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center justify-between">
          <span>{stepTitles[activeTab]}</span>
          <span className="text-primary text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary border border-border">v1.0</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{stepDescriptions[activeTab]}</p>
      </div>

      {/* State Vector Readout */}
      <div className="p-3 rounded-xl bg-background/90 border border-border space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
          {t('panels.singleQubit.state_vector_readout')}
        </span>
        <div className="text-lg sm:text-xl font-mono text-primary font-bold tracking-wide">
          {formatDirac(metrics)}
        </div>
        <div className="text-[11px] font-mono text-muted-foreground">
          θ: {(state.theta / Math.PI).toFixed(3)}π rad &bull; φ: {(state.phi / Math.PI).toFixed(3)}π rad
        </div>
      </div>

      {/* Born Probabilities */}
      <div className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
          {t('panels.singleQubit.born_probabilities')}
        </span>
        <div className="flex justify-between items-center text-xs font-mono font-semibold">
          <span className="text-primary">{t('panels.singleQubit.p0', { p0: p0Percent })}</span>
          <span className="text-foreground">{t('panels.singleQubit.p1', { p1: p1Percent })}</span>
        </div>
        <div
          className="w-full h-2.5 bg-secondary rounded-full overflow-hidden flex"
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
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
          {t('panels.singleQubit.quantum_gates')}
        </span>
        <div className="grid grid-cols-3 gap-2">
          {(['H', 'X', 'Z'] as const).map((gate) => (
            <button
              key={gate}
              type="button"
              onClick={() => onGate(gate)}
              className="py-1.5 px-2 rounded-lg bg-secondary hover:bg-muted active:scale-95 border border-primary text-primary font-mono font-bold text-xs transition-all shadow-sm hover:shadow-primary/10 cursor-pointer"
            >
              {gate === 'H'
                ? t('panels.singleQubit.gate_hadamard')
                : gate === 'X'
                  ? t('panels.singleQubit.gate_pauli_x')
                  : t('panels.singleQubit.gate_pauli_z')}
            </button>
          ))}
        </div>
      </div>

      {/* Measurement & Reset */}
      <div className="pt-2 border-t border-border/80 space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMeasure}
            className="flex-1 py-2 px-3 rounded-lg bg-linear-to-r from-success to-success hover:from-success hover:to-success text-background font-bold text-xs tracking-wide transition-all shadow-md shadow-success/20 active:scale-95 cursor-pointer"
          >
            {t('panels.singleQubit.measure_state')}
          </button>
          {lastOutcome !== null && (
            <div className="px-2.5 py-1.5 rounded-lg bg-secondary border border-success text-success font-mono text-xs font-bold text-center">
              {t('panels.singleQubit.outcome', { outcome: lastOutcome })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-1.5 px-3 rounded-lg bg-secondary hover:bg-secondary border border-border hover:border-border text-foreground hover:text-foreground font-medium text-xs transition-all active:scale-95 cursor-pointer"
        >
          {t('panels.singleQubit.reset')}
        </button>
      </div>
    </div>
  );
}
