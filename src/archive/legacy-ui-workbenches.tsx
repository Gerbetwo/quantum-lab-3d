// @ts-nocheck
/* eslint-disable */
// Archived from src/features/quantum-core/quantum-ui-components.tsx

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import clsx from 'clsx';
import {
  X as XIcon,
  Link as LinkIcon,
  Hash,
  Activity,
  type LucideIcon,
  Sparkles,
  Zap,
  Sigma,
  Triangle,
  Snowflake,
  RefreshCw,
  Atom,
  BarChart3,
  Circle,
} from 'lucide-react';
import { useQuantumStore } from '@/store/useQuantumStore';
import {
  QuantumCircuit,
  QubitIndex,
  createEmptyCircuit,
  StateVectorHistory,
  evaluateFullCircuit,
  GateType,
  StateVector,
} from '@/core/qubitMath';

// Symbol: KnowledgeCheck
export function KnowledgeCheck({
  quiz,
  question: propQuestion,
  options: propOptions,
  correctOptionId: propCorrectOptionId,
  selectedOptionId,
  onSelectOption,
  onPass,
  title = 'Comprobación de Conocimiento',
}: any) {
  const question = quiz?.question ?? propQuestion ?? '';
  const options = quiz?.options ?? propOptions ?? [];
  const correctOptionId = quiz?.correctOptionId ?? propCorrectOptionId ?? '';

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [passedCalled, setPassedCalled] = useState<boolean>(false);

  const isCorrect = selectedOptionId === correctOptionId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOptionId) return;
    setSubmitted(true);
    if (selectedOptionId === correctOptionId && !passedCalled) {
      setPassedCalled(true);
      onPass?.();
    }
  };

  return (
    <section className="bg-background-90 border border-border rounded-xl p-6 shadow-xl flex flex-col gap-4 text-foreground">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="text-xl">🧠</span>
        <h2 className="text-lg font-bold text-accent">{title}</h2>
      </div>
      <p className="text-base font-medium">{question}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
        <div className="flex flex-col gap-2">
          {options.map((opt: any) => (
            <label key={opt.id} className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer">
              <input
                type="radio"
                name="quiz-option"
                value={opt.id}
                checked={selectedOptionId === opt.id}
                disabled={submitted}
                onChange={() => !submitted && onSelectOption?.(opt.id)}
              />
              <span>{opt.text}</span>
            </label>
          ))}
        </div>
        <button type="submit" disabled={!selectedOptionId} className="px-6 py-2 rounded-lg bg-accent text-accent-foreground font-semibold">
          Validar Respuesta
        </button>
      </form>
    </section>
  );
}

// Symbol: CircuitWorkbench
export function CircuitWorkbench() {
  const [circuit] = useState<QuantumCircuit>(() => createEmptyCircuit(3));
  const [evaluationResult] = useState<StateVectorHistory>(() => evaluateFullCircuit(circuit));
  const [viewMode] = useState<string>('bloch');

  const finalState = evaluationResult?.final || [{ re: 1, im: 0 }];

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground p-4">
      <div className="flex-1 flex items-center justify-center">
        {viewMode === 'phase-disk' && <PhaseDiskView evaluation={finalState} />}
        {viewMode === 'bloch' && <BlochPairView evaluation={finalState} />}
        {viewMode === 'histogram' && <HistogramView evaluation={finalState} />}
      </div>
    </div>
  );
}

// Symbol: ViewModeSwitcher
export function ViewModeSwitcher({ mode, onChange, available }: any) {
  const modes = available ?? ['bloch', 'histogram', 'phase-disk'];
  return (
    <div role="tablist" className="flex gap-1.5 mb-3 flex-wrap">
      {modes.map((m: any) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange?.(m)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-mono transition-colors',
            mode === m ? 'bg-cyan/20 text-cyan border border-cyan/60' : 'bg-surface-2 text-muted-foreground'
          )}
        >
          <span>{m}</span>
        </button>
      ))}
    </div>
  );
}

// Symbol: BlochPairView
export function BlochPairView(_props: any) {
  return (
    <div className="flex items-center justify-center h-full w-full bg-background-90 rounded-xl overflow-hidden p-4">
      <span className="text-xs text-muted-foreground font-mono">Legacy Bloch Pair View</span>
    </div>
  );
}

// Symbol: HistogramView
export function HistogramView(_props: any) {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <canvas role="img" aria-label="Histogram View" className="w-full h-full" />
    </div>
  );
}

// Symbol: PhaseDiskView
export function PhaseDiskView(_props: any) {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <canvas role="img" aria-label="Phase Disk View" className="w-full h-full" />
    </div>
  );
}
