'use client';

import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { useTranslation } from '@/lib/i18n';
import { simulateGroverStep, runShorDemo, simulate3QubitBitFlipEC } from '@/core/algorithms';
import type { MissionId } from './missionRegistry';

interface AlgorithmControlsProps {
  missionId: MissionId;
}

export function AlgorithmControls({ missionId }: AlgorithmControlsProps) {
  const { t } = useTranslation();

  // Grover State (Mission 4)
  const groverStep = useQuantumStore((s) => s.groverStep);
  const targetIndex = useQuantumStore((s) => s.groverTargetIndex);
  const setGroverStep = useQuantumStore((s) => s.setGroverStep);
  const setTargetIndex = useQuantumStore((s) => s.setGroverTargetIndex);
  const groverResult = simulateGroverStep(2, targetIndex, groverStep);

  // Shor State (Mission 5, N=15)
  const shorBase = useQuantumStore((s) => s.shorBase);
  const setShorBase = useQuantumStore((s) => s.setShorBase);
  const shorResult = runShorDemo(shorBase);

  // 3-Qubit QEC State (Mission 6)
  const injectedError = useQuantumStore((s) => s.qecInjectedError);
  const setInjectedError = useQuantumStore((s) => s.setQecInjectedError);
  const qecResult = simulate3QubitBitFlipEC(injectedError);

  if (missionId === 'grover') {
    const targetProb = Math.round((groverResult.probabilities[targetIndex] || 0) * 100);
    return (
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-2 border border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs telemetry-mono font-semibold text-quantum-cyan uppercase">
            {t('algorithms.grover_title')}
          </span>
          <span className="text-[10px] telemetry-mono text-muted-foreground">Step {groverStep}/2</span>
        </div>
        <div className="flex items-center gap-2 text-xs telemetry-mono">
          <span className="text-muted-foreground">{t('algorithm_controls.target_label')}</span>
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { setTargetIndex(idx); setGroverStep(0); }}
              className={`px-2 py-0.5 rounded text-xs telemetry-mono cursor-pointer transition-all ${
                targetIndex === idx
                  ? 'hud-badge-cyan font-bold'
                  : 'bg-surface-3 border border-border text-muted-foreground hover:bg-surface-2'
              }`}
            >
              |{idx}⟩
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs telemetry-mono mt-1">
          <span>{t('algorithm_controls.target_prob', { i: targetIndex, p: targetProb })}: {targetProb}%</span>
          <span className={groverResult.targetFound ? 'text-success font-bold' : 'text-muted-foreground'}>
            {groverResult.targetFound ? t('algorithm_controls.amplified') : t('algorithm_controls.uniform')}
          </span>
        </div>
        <div className="w-full bg-surface-3 h-2 rounded-full overflow-hidden">
          <div className="bg-quantum-cyan h-full transition-all duration-300" style={{ width: `${targetProb}%` }} />
        </div>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => setGroverStep((s) => Math.min(2, s + 1))}
            className="flex-1 px-3 py-1.5 rounded text-xs telemetry-mono font-semibold hud-badge-cyan cursor-pointer transition-all hover:opacity-90"
          >
            {t('algorithm_controls.apply_grover')}
          </button>
          <button
            type="button"
            onClick={() => setGroverStep(0)}
            className="px-3 py-1.5 rounded text-xs telemetry-mono bg-surface-3 border border-border text-muted-foreground cursor-pointer transition-all hover:bg-surface-2"
          >{t('algorithm_controls.reset')}</button>
        </div>
      </div>
    );
  }

  if (missionId === 'applications') {
    const bases = [2, 7, 8, 11, 13];
    return (
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-2 border border-border">
        <span className="text-xs telemetry-mono font-semibold text-quantum-purple uppercase">
          {t('algorithms.shor_title')}
        </span>
        <div className="flex items-center gap-1.5 text-xs telemetry-mono">
          <span className="text-muted-foreground">{t('algorithms.base_a')}</span>
          {bases.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setShorBase(b)}
              className={`px-2 py-0.5 rounded text-xs telemetry-mono cursor-pointer transition-all ${
                shorBase === b
                  ? 'hud-badge-purple font-bold'
                  : 'bg-surface-3 border border-border text-muted-foreground hover:bg-surface-2'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        <div className="p-2 rounded bg-surface-3 border border-border text-xs telemetry-mono flex flex-col gap-1">
          <span>Seq: [{shorResult.sequence.join(', ')}...] (Period r = {shorResult.period})</span>
          <span className="text-quantum-purple font-bold">
            Factors: gcd(a^(r/2) ± 1, 15) → {shorResult.factors.join(' × ')} = 15
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground italic telemetry-mono">
          {t('algorithm_controls.didactic_notice')}
        </span>
      </div>
    );
  }

  // Mission 6: 3-Qubit QEC
  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-2 border border-border">
      <span className="text-xs telemetry-mono font-semibold text-quantum-emerald uppercase">
        {t('algorithms.qec_title')}
      </span>
      <div className="text-xs telemetry-mono text-muted-foreground">
        Logical: |ψ⟩ → α|000⟩ + β|111⟩
      </div>
      <div className="flex gap-1.5 text-xs telemetry-mono">
        <span className="text-muted-foreground self-center">{t('algorithm_controls.inject_error')}</span>
        {[0, 1, 2].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setInjectedError(q)}
            className={`px-2 py-1 rounded text-xs telemetry-mono cursor-pointer transition-all ${
              injectedError === q
                ? 'hud-badge-rose font-bold'
                : 'bg-surface-3 border border-border text-muted-foreground hover:bg-surface-2'
            }`}
          >
            {t('algorithm_controls.flip_qubit', { index: q })}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setInjectedError(null)}
          className={`px-2 py-1 rounded text-xs telemetry-mono cursor-pointer transition-all ${
            injectedError === null
              ? 'hud-badge-emerald font-bold'
              : 'bg-surface-3 border border-border text-muted-foreground hover:bg-surface-2'
          }`}
        >{t('algorithm_controls.clean')}</button>
      </div>
      <div className="p-2 rounded bg-surface-3 border border-border text-xs telemetry-mono flex flex-col gap-1">
        <span>
          Syndrome: [{qecResult.syndrome.join(', ')}] (Error on{' '}
          {qecResult.errorQubitIndex !== null ? `q${qecResult.errorQubitIndex}` : 'None'})
        </span>
        <span className="text-success font-bold">{qecResult.recoveredState}</span>
      </div>
    </div>
  );
}