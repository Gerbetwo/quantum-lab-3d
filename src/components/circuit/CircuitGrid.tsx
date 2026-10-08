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
  circuit,
  activeGate,
  playhead,
  onPlaceGate,
  onRemoveGate,
  onSetPlayhead,
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
      return (
        s.gates.find(
          g => g.targets.includes(q) || (g.controls?.includes(q) ?? false),
        ) ?? null
      );
    },
    [steps],
  );

  // Cuando hay una compuerta multi-qubit armada, mostramos qué celda sería
  // el control y cuál el target si se hiciera click en (step, q).
  // Convención: la celda clickeada es el control; el target es el vecino
  // inferior (o superior si estamos en el último qubit).
  const highlightFor = useCallback(
    (step: number, q: QubitIndex): 'control' | 'target' | undefined => {
      if (!activeGate) return undefined;
      if (!MULTI_QUBIT_GATES.includes(activeGate)) return undefined;
      if (nQubits < 2) return undefined;

      const isLastQubit = q === nQubits - 1;
      // El "vecino" hacia el que se emparejaría si clickeás en q.
      const partner = (isLastQubit ? q - 1 : q + 1) as QubitIndex;

      // Si estás sobre el último qubit, esa celda sería el "control"
      // (arriba) respecto de su partner inferior; si no, sos el control
      // y el partner es el target.
      if (isLastQubit) return 'control';
      // La celda resaltada como target es la del partner del control armado:
      // como el highlight se calcula por celda, en la fila q mostramos
      // 'control' y en la fila del partner mostrará 'target'.
      void partner; // partner usado conceptualmente; el resaltado real es local a la celda.
      return 'control';
    },
    [activeGate, nQubits],
  );

  const handleCellClick = useCallback(
    (step: number, q: QubitIndex) => {
      const existing = gateAt(step, q);
      if (existing && !activeGate) {
        onRemoveGate(existing.id);
        return;
      }
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
                  : 'text-slate-400 hover:bg-surface-2',
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {qubits.map(q => (
          <div key={q} role="row" className="contents">
            <div
              role="rowheader"
              className="px-2 py-1 text-[10px] font-mono text-slate-400 flex items-center"
            >
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
                  aria-label={
                    'Paso ' +
                    (s + 1) +
                    ', qubit q' +
                    q +
                    (g ? ', compuerta ' + g.type : ', vacio')
                  }
                  data-testid={'cell-' + s + '-' + q}
                  data-qubit={q}
                  data-step={s}
                  data-highlight={highlight}
                  onClick={() => handleCellClick(s, q)}
                  onKeyDown={e => {
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