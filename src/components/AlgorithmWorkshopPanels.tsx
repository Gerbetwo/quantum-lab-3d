'use client';

import React from 'react';
import type { BitTriple } from '@/core/algorithms';
import { useTranslation } from '@/hooks/useTranslation';

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
  const { t } = useTranslation();

  return (
    <div className="space-y-3.5">
      <div>
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center justify-between">
          <span>{t('panels.grover.title')}</span>
          <span className="text-primary text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary border border-border">N=4</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('panels.grover.desc')}
        </p>
      </div>

      {/* Target Index Selection */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
          {t('panels.grover.select_target')}
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {(['|00⟩', '|01⟩', '|10⟩', '|11⟩'] as const).map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => onSelectTarget(idx)}
              className={`py-1.5 px-2 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                groverTarget === idx
                  ? 'bg-secondary border-primary text-primary ring-1 ring-ring'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 4-State Probability Bar Chart */}
      <div className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
          {t('panels.grover.probability_distribution')}
        </span>
        <div className="space-y-2">
          {(['|00⟩', '|01⟩', '|10⟩', '|11⟩'] as const).map((label, idx) => {
            const prob = groverProbs[idx] ?? 0;
            const pct = (prob * 100).toFixed(1);
            const isTarget = groverTarget === idx;
            return (
              <div key={label} className="space-y-0.5">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className={isTarget ? 'text-primary font-bold' : 'text-muted-foreground'}>
                    {label} {isTarget ? t('panels.grover.target_badge') : ''}
                  </span>
                  <span className={isTarget ? 'text-primary font-bold' : 'text-muted-foreground'}>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
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

      <div className="pt-2 border-t border-border/80 space-y-2">
        <button
          type="button"
          onClick={onRunGrover}
          className="w-full py-2 px-4 rounded-lg bg-linear-to-r from-primary to-primary hover:from-primary hover:to-primary text-background font-bold text-xs tracking-wide transition-all shadow-md shadow-primary/20 active:scale-95 cursor-pointer"
        >
          {t('panels.grover.run_diffusion')}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-1.5 px-3 rounded-lg bg-secondary hover:bg-secondary border border-border hover:border-border text-foreground hover:text-foreground font-medium text-xs transition-all active:scale-95 cursor-pointer"
        >
          {t('panels.grover.reset')}
        </button>
      </div>
    </div>
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
  const { t } = useTranslation();
  const s1 = qecTriple[0] ^ qecTriple[1];
  const s2 = qecTriple[1] ^ qecTriple[2];

  return (
    <div className="space-y-3.5">
      <div>
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center justify-between">
          <span>{t('panels.qec.title')}</span>
          <span className="text-primary text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary border border-border">3-Qubit</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('panels.qec.desc')}
        </p>
      </div>

      {/* 3-Qubit State Display */}
      <div className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
            {t('panels.qec.state_display')}
          </span>
          <span className="text-primary font-mono text-xs font-bold">
            [q0, q1, q2] = [{qecTriple.join(', ')}]
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {qecTriple.map((bit, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg border text-center transition-all ${
                syndromeInfo && syndromeInfo.errorIndex === idx
                  ? 'bg-secondary border-destructive ring-1 ring-destructive'
                  : 'bg-card border-border'
              }`}
            >
              <span className="text-muted-foreground text-[10px] font-mono block">q{idx}</span>
              <div className="text-lg font-mono font-bold text-foreground my-0.5">|{bit}⟩</div>
              <button
                type="button"
                onClick={() => onInjectBitFlip(idx as 0 | 1 | 2)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary hover:bg-muted text-primary border border-border cursor-pointer w-full truncate"
              >
                {t('panels.qec.flip_qubit', { idx })}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2 Floating Syndrome Parity Check Nodes (S1 = q0 ⊕ q1, S2 = q1 ⊕ q2) */}
      <div className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
          {t('panels.qec.parity_nodes')}
        </span>
        <div className="grid grid-cols-2 gap-2">
          <div
            className={`p-2.5 rounded-lg border transition-all ${
              s1 === 1
                ? 'bg-secondary border-destructive ring-1 ring-destructive'
                : 'bg-card border-border'
            }`}
          >
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-muted-foreground font-bold">{t('panels.qec.s1_label')}</span>
              <span
                className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                  s1 === 1 ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'
                }`}
              >
                {s1 === 1 ? t('panels.qec.parity_violated') : t('panels.qec.parity_ok')}
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-foreground mt-1">
              |{s1}⟩
            </div>
          </div>

          <div
            className={`p-2.5 rounded-lg border transition-all ${
              s2 === 1
                ? 'bg-secondary border-destructive ring-1 ring-destructive'
                : 'bg-card border-border'
            }`}
          >
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-muted-foreground font-bold">{t('panels.qec.s2_label')}</span>
              <span
                className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                  s2 === 1 ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'
                }`}
              >
                {s2 === 1 ? t('panels.qec.parity_violated') : t('panels.qec.parity_ok')}
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-foreground mt-1">
              |{s2}⟩
            </div>
          </div>
        </div>
      </div>

      {/* Syndrome Diagnostics */}
      <div className="p-3 rounded-xl bg-background/90 border border-border space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
          {t('panels.qec.syndrome_diagnostics')}
        </span>
        {syndromeInfo ? (
          <div className="space-y-1 text-xs font-mono">
            <div className="text-success font-bold">
              {syndromeInfo.errorIndex === -1
                ? t('panels.qec.no_error')
                : t('panels.qec.error_detected', { index: syndromeInfo.errorIndex })}
            </div>
            <div className="text-muted-foreground text-[11px]">
              {t('panels.qec.syndrome_status', {
                syndrome: syndromeInfo.syndrome,
                corrected: syndromeInfo.corrected.join(', '),
              })}
            </div>
          </div>
        ) : (
          <div className="text-[11px] font-mono text-muted-foreground">
            {t('panels.qec.hint')}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border/80 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onInjectBitFlip()}
            className="py-2 px-3 rounded-lg bg-secondary hover:bg-rose-800/80 border border-destructive text-destructive font-bold text-xs tracking-wide transition-all active:scale-95 cursor-pointer"
          >
            {t('panels.qec.inject_bit_flip')}
          </button>
          <button
            type="button"
            onClick={onRunSyndromeCorrection}
            className="py-2 px-3 rounded-lg bg-linear-to-r from-success to-success hover:from-success hover:to-success text-background font-bold text-xs tracking-wide transition-all shadow-md shadow-success/20 active:scale-95 cursor-pointer"
          >
            {t('panels.qec.run_syndrome_correction')}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onReset(0)}
            className="py-1.5 px-2 rounded-lg bg-secondary hover:bg-secondary border border-border text-foreground hover:text-foreground font-mono text-xs cursor-pointer"
          >
            {t('panels.qec.encode_zero')}
          </button>
          <button
            type="button"
            onClick={() => onReset(1)}
            className="py-1.5 px-2 rounded-lg bg-secondary hover:bg-secondary border border-border text-foreground hover:text-foreground font-mono text-xs cursor-pointer"
          >
            {t('panels.qec.encode_one')}
          </button>
        </div>
      </div>
    </div>
  );
}
