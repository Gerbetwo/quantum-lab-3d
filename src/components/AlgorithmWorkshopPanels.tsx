'use client';

import React from 'react';
import type { BitTriple } from '@/core/algorithms';

export interface GroverPanelProps {
  groverTarget: number;
  groverProbs: number[];
  onSelectTarget: (idx: number) => void;
  onRunGrover: () => void;
  onReset: () => void;
}

export function GroverPanel({
  groverTarget,
  groverProbs,
  onSelectTarget,
  onRunGrover,
  onReset,
}: GroverPanelProps) {
  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            6. Grover Search <span className="text-primary text-sm font-mono font-normal">[N=4]</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Oracle phase inversion and amplitude diffusion amplify target probability to 100%.
          </p>
        </div>

        {/* Target Index Selection */}
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
            Select Target Index (0-3)
          </span>
          <div className="grid grid-cols-4 gap-2">
            {(['|00⟩', '|01⟩', '|10⟩', '|11⟩'] as const).map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => onSelectTarget(idx)}
                className={`py-2 px-3 rounded-lg font-mono text-sm font-bold border transition-all cursor-pointer ${
                  groverTarget === idx
                    ? 'bg-secondary border-primary text-primary ring-2 ring-ring'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 4-State Probability Bar Chart */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
            4-State Probability Distribution
          </span>
          <div className="space-y-2.5">
            {(['|00⟩', '|01⟩', '|10⟩', '|11⟩'] as const).map((label, idx) => {
              const prob = groverProbs[idx] ?? 0;
              const pct = (prob * 100).toFixed(1);
              const isTarget = groverTarget === idx;
              return (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className={isTarget ? 'text-primary font-bold' : 'text-muted-foreground'}>
                      {label} {isTarget ? '★ Target' : ''}
                    </span>
                    <span className={isTarget ? 'text-primary font-bold' : 'text-muted-foreground'}>{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isTarget ? 'bg-primary' : 'bg-secondary'
                      }`}
                      style={{ width: `${Math.min(100, prob * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border/80 space-y-3">
        <button
          type="button"
          onClick={onRunGrover}
          className="w-full py-3 px-6 rounded-lg bg-linear-to-r from-primary to-primary hover:from-primary hover:to-primary text-background font-bold text-sm tracking-wide transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
        >
          Run Diffusion Step
        </button>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2.5 px-4 rounded-lg bg-secondary hover:bg-secondary border border-border hover:border-border text-foreground hover:text-white font-medium text-sm transition-all active:scale-95 cursor-pointer"
        >
          Reset Superposition
        </button>
      </div>
    </>
  );
}

export interface QECPanelProps {
  qecTriple: BitTriple;
  syndromeInfo: {
    syndrome: number;
    errorIndex: number;
    corrected: BitTriple;
  } | null;
  onInjectBitFlip: (idx?: 0 | 1 | 2) => void;
  onRunSyndromeCorrection: () => void;
  onReset: (bit?: 0 | 1) => void;
}

export function QECPanel({
  qecTriple,
  syndromeInfo,
  onInjectBitFlip,
  onRunSyndromeCorrection,
  onReset,
}: QECPanelProps) {
  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            7. Error Correction <span className="text-primary text-sm font-mono font-normal">[3-Qubit]</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detect and correct single-qubit bit flips via syndrome measurement without collapsing the logical state.
          </p>
        </div>

        {/* 3-Qubit State Display */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
              3-Qubit State Display
            </span>
            <span className="text-primary font-mono text-sm font-bold">
              [q0, q1, q2] = [{qecTriple.join(', ')}]
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {qecTriple.map((bit, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-center transition-all ${
                  syndromeInfo && syndromeInfo.errorIndex === idx
                    ? 'bg-secondary border-destructive ring-1 ring-destructive'
                    : 'bg-card border-border'
                }`}
              >
                <span className="text-muted-foreground text-xs font-mono block">q{idx}</span>
                <div className="text-2xl font-mono font-bold text-white my-1">|{bit}⟩</div>
                <button
                  type="button"
                  onClick={() => onInjectBitFlip(idx as 0 | 1 | 2)}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary hover:bg-muted text-primary border border-border cursor-pointer"
                >
                  Flip q{idx}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Syndrome Diagnostics */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
            Syndrome Diagnostics
          </span>
          {syndromeInfo ? (
            <div className="space-y-1.5 text-xs font-mono">
              <div className="text-success font-bold">
                {syndromeInfo.errorIndex === -1
                  ? 'No Bit Flip Detected (Code Clean)'
                  : `Bit Flip Detected at Qubit ${syndromeInfo.errorIndex}!`}
              </div>
              <div className="text-muted-foreground">
                Syndrome: {syndromeInfo.syndrome} &bull; Corrected State: [{syndromeInfo.corrected.join(', ')}]
              </div>
            </div>
          ) : (
            <div className="text-xs font-mono text-muted-foreground">
              Select a qubit or click &quot;Inject Bit Flip&quot;, then run syndrome correction.
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-border/80 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onInjectBitFlip()}
            className="py-3 px-4 rounded-lg bg-secondary hover:bg-rose-800/80 border border-destructive text-destructive font-bold text-sm tracking-wide transition-all active:scale-95 cursor-pointer"
          >
            Inject Bit Flip
          </button>
          <button
            type="button"
            onClick={onRunSyndromeCorrection}
            className="py-3 px-4 rounded-lg bg-linear-to-r from-success to-success hover:from-success hover:to-success text-background font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            Run Syndrome Correction
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onReset(0)}
            className="py-2 px-3 rounded-lg bg-secondary hover:bg-secondary border border-border text-foreground hover:text-white font-mono text-xs cursor-pointer"
          >
            Encode |000⟩
          </button>
          <button
            type="button"
            onClick={() => onReset(1)}
            className="py-2 px-3 rounded-lg bg-secondary hover:bg-secondary border border-border text-foreground hover:text-white font-mono text-xs cursor-pointer"
          >
            Encode |111⟩
          </button>
        </div>
      </div>
    </>
  );
}
