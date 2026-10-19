'use client';

import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { simulateGroverStep, runShorDemo, simulate3QubitBitFlipEC } from '@/core/algorithms';
import type { MissionId } from './missionRegistry';

interface AlgorithmControlsProps {
  missionId: MissionId;
}

export function AlgorithmControls({ missionId }: AlgorithmControlsProps) {
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
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-2 border border-edge">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-cyan uppercase">
            HU-MVP-06: Grover Search (N=4)
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">Step {groverStep}/2</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-muted-foreground">Target:</span>
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { setTargetIndex(idx); setGroverStep(0); }}
              className={`px-2 py-0.5 rounded border ${
                targetIndex === idx ? 'bg-cyan/20 border-cyan text-cyan' : 'bg-surface-3 border-edge text-muted-foreground'
              }`}
            >
              |{idx}⟩
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs font-mono mt-1">
          <span>Target P(|{targetIndex}⟩): {targetProb}%</span>
          <span className={groverResult.targetFound ? 'text-emerald-400 font-bold' : 'text-muted-foreground'}>
            {groverResult.targetFound ? '✓ AMPLIFIED' : 'Uniform'}
          </span>
        </div>
        <div className="w-full bg-surface-3 h-2 rounded-full overflow-hidden">
          <div className="bg-cyan h-full transition-all duration-300" style={{ width: `${targetProb}%` }} />
        </div>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => setGroverStep((s) => Math.min(2, s + 1))}
            className="flex-1 px-3 py-1.5 rounded text-xs font-mono bg-cyan/15 hover:bg-cyan/25 text-cyan border border-cyan/40"
          >
            Apply Oracle + Diffusion
          </button>
          <button
            type="button"
            onClick={() => setGroverStep(0)}
            className="px-3 py-1.5 rounded text-xs font-mono bg-surface-3 border border-edge text-muted-foreground"
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  if (missionId === 'applications') {
    const bases = [2, 7, 8, 11, 13];
    return (
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-2 border border-edge">
        <span className="text-xs font-mono font-semibold text-purple-400 uppercase">
          HU-MVP-07: Shor Factoring (N = 15)
        </span>
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-muted-foreground">Base a:</span>
          {bases.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setShorBase(b)}
              className={`px-2 py-0.5 rounded border ${
                shorBase === b ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-surface-3 border-edge text-muted-foreground'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        <div className="p-2 rounded bg-surface-3 border border-edge text-xs font-mono flex flex-col gap-1">
          <span>Seq: [{shorResult.sequence.join(', ')}...] (Period r = {shorResult.period})</span>
          <span className="text-purple-300 font-bold">
            Factors: gcd(a^(r/2) ± 1, 15) → {shorResult.factors.join(' × ')} = 15
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground italic font-mono">
          Didactic N=15 model. (Pedagogical demonstration, not RSA-2048).
        </span>
      </div>
    );
  }

  // Mission 6: 3-Qubit QEC
  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-2 border border-edge">
      <span className="text-xs font-mono font-semibold text-emerald-400 uppercase">
        HU-MVP-08: 3-Qubit Bit-Flip QEC
      </span>
      <div className="text-xs font-mono text-muted-foreground">
        Logical: |ψ⟩ → α|000⟩ + β|111⟩
      </div>
      <div className="flex gap-1.5 text-xs font-mono">
        <span className="text-muted-foreground self-center">Inject Error:</span>
        {[0, 1, 2].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setInjectedError(q)}
            className={`px-2 py-1 rounded border ${
              injectedError === q ? 'bg-red-500/20 border-red-400 text-red-300' : 'bg-surface-3 border-edge text-muted-foreground'
            }`}
          >
            Flip q{q}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setInjectedError(null)}
          className={`px-2 py-1 rounded border ${
            injectedError === null ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-surface-3 border-edge text-muted-foreground'
          }`}
        >
          Clean
        </button>
      </div>
      <div className="p-2 rounded bg-surface-3 border border-edge text-xs font-mono flex flex-col gap-1">
        <span>Syndrome: [{qecResult.syndrome.join(', ')}] (Error on {qecResult.errorQubitIndex !== null ? `q${qecResult.errorQubitIndex}` : 'None'})</span>
        <span className="text-emerald-300 font-bold">{qecResult.recoveredState}</span>
      </div>
    </div>
  );
}
