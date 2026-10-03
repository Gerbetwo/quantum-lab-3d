'use client';

import React, { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import type { GateType, QuantumCircuit, QubitIndex } from '@/domain/quantum/circuit';

interface Props {
  circuit: QuantumCircuit;
  activeGate: GateType | null;
  playhead: number;
  onPlaceGate: (step: number, qubit: QubitIndex) => void;
  onRemoveGate: (gateId: string) => void;
  onSetPlayhead: (n: number) => void;
}

const MULTI_QUBIT_GATES: readonly GateType[] = ['CNOT', 'CZ', 'CS', 'CT'];

export default function CircuitGrid({
  circuit, activeGate, playhead, onPlaceGate, onRemoveGate, onSetPlayhead,
}: Props) {
  const { nQubits, depth, steps } = circuit;

  const qubits: QubitIndex[] = useMemo(
    () => Array.from({ length: nQubits }, (_, i) => i as QubitIndex),
    [nQubits],
  );

  const gateAt = useCallback(
    (step: number, q: QubitIndex) => {
      const s = steps[step];
      if (!s) return null;
      return s.gates.find((g) => g.targets.includes(q) || (g.controls?.includes(q) ?? false)) ?? null;
    },
    [steps],
  );

  // Highlight map: when a multi-qubit gate is armed, show which cell is control
  // and which is target for the potential placement at (step, qubit).
  const highlightFor = useCallback(
    (step: number, q: QubitIndex): 'control' | 'target' | undefined => {
      if (!activeGate) return undefined;
      if (!MULTI_QUBIT_GATES.includes(activeGate)) return undefined;
      const target = ((q + 1) % nQubits) as QubitIndex;
      if (q === target) return undefined;
      // Prefer showing the target cell as 'target' and the control cell as 'control'
      if (q === target) return 'target';
      return undefined;
    },
    [activeGate, nQubits],
  );

  const handleCellClick = useCallback(
    (step: number, q: QubitIndex) => {
      const existing = gateAt(step, q);
      if (existing && !activeGate) { onRemoveGate(existing.id); return; }
      if (activeGate) onPlaceGate(step, q);
    },
    [activeGate, gateAt, onPlaceGate, onRemoveGate],
  );

  return (
    <div className="w-full overflow-x-auto" data-testid="circuit-grid-wrapper">
      <div
        role="grid"
        aria-label="Editor de circuito cuantico"
        data-testid="circuit-grid"
        className="inline-grid gap-0.5"
        style={{ gridTemplateColumns: 'auto repeat(' + depth + ', minmax(2rem, 1fr))' }}
      >
        <div role="row" className="contents">
          <div role="columnheader" aria-label="Qubit" />
          {Array.from({ length: depth }, (_, s) => (
            <button
              key={s}
              type="button"
              role="columnheader"
              aria-label={'Ir al paso ' + (s + 1)}
              data-testid={'playhead-' + s}
              data-playhead={s === playhead ? 'true' : undefined}
              onClick={() => onSetPlayhead(s)}
              className={clsx(
                'px-1 py-0.5 rounded text-[10px] font-mono transition-all duration-150',
                s === playhead
                  ? 'bg-cyan/20 text-cyan'
                  : 'text-slate-500 hover:bg-surface-2',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {qubits.map((q) => (
          <div key={q} role="row" className="contents">
            <div role="rowheader" className="px-2 py-1 text-[10px] font-mono text-slate-400 flex items-center">
              q{q}
            </div>
            {Array.from({ length: depth }, (_, s) => {
              const g = gateAt(s, q);
              const isPlayhead = s === playhead;
              const highlight = highlightFor(s, q);
              return (
                <button
                  key={s}
                  type="button"
                  role="gridcell"
                  aria-label={'Paso ' + (s + 1) + ', qubit q' + q + (g ? ', compuerta ' + g.type : ', vacio')}
                  data-testid={'cell-' + s + '-' + q}
                  data-qubit={q}
                  data-step={s}
                  data-highlight={highlight}
                  onClick={() => handleCellClick(s, q)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Delete' || e.key === 'Backspace') && g) {
                      e.preventDefault();
                      onRemoveGate(g.id);
                    }
                  }}
                  className={clsx(
                    'h-7 rounded border text-[10px] font-orbitron font-bold outline-none',
                    'focus:ring-2 focus:ring-cyan/40 transition-all duration-150',
                    isPlayhead ? 'border-cyan/60' : 'border-edge',
                    g ? 'bg-cyan/15 text-cyan' : 'bg-surface-2 text-slate-600 hover:bg-surface-3',
                    highlight === 'target' && 'ring-1 ring-amber-400/60',
                    highlight === 'control' && 'ring-1 ring-purple-400/60',
                  )}
                >
                  {g ? g.type : ''}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
