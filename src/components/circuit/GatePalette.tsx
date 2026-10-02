'use client';

import React, { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import type { GateType } from '@/domain/quantum/circuit';

const DEFAULT_GATES: readonly GateType[] = ['H', 'X', 'Y', 'Z', 'S', 'T', 'CNOT', 'CZ', 'SWAP'];

interface Props {
  gates?: readonly GateType[];
  selected: GateType | null;
  onSelect: (g: GateType) => void;
  disabled?: readonly GateType[];
}

const LABELS: Record<GateType, string> = {
  H: 'Hadamard', X: 'Pauli-X', Y: 'Pauli-Y', Z: 'Pauli-Z',
  S: 'Phase S', T: 'Phase T',
  CNOT: 'CNOT', CZ: 'Controlled-Z', SWAP: 'SWAP',
  CS: 'Controlled-S', CT: 'Controlled-T',
};

export default function GatePalette({ gates = DEFAULT_GATES, selected, onSelect, disabled = [] }: Props) {
  const disabledSet = useMemo(() => new Set(disabled), [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const g = gates[index];
        if (!disabledSet.has(g)) onSelect(g);
        return;
      }
      const parent = e.currentTarget.parentElement;
      if (!parent) return;
      const children = Array.from(parent.children) as HTMLElement[];
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (index + 1) % gates.length;
        children[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (index - 1 + gates.length) % gates.length;
        children[prev]?.focus();
      }
    },
    [gates, onSelect, disabledSet],
  );

  return (
    <div
      role="listbox"
      aria-label="Paleta de compuertas cuanticas"
      data-testid="gate-palette"
      className="flex flex-col gap-1.5 p-2 bg-surface-2 rounded-xl border border-edge w-24 shrink-0"
    >
      {gates.map((g, i) => {
        const isDisabled = disabledSet.has(g);
        const isSelected = selected === g;
        return (
          <div
            key={g}
            role="option"
            aria-selected={isSelected}
            aria-disabled={isDisabled || undefined}
            tabIndex={isSelected ? 0 : -1}
            data-testid={'gate-option-' + g}
            title={LABELS[g]}
            onClick={() => { if (!isDisabled) onSelect(g); }}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={clsx(
              'px-2 py-1.5 rounded-lg text-xs font-orbitron font-bold text-center cursor-pointer select-none border transition-all outline-none focus:ring-2 focus:ring-cyan/40',
              isSelected ? 'bg-cyan/20 border-cyan text-cyan'
                : isDisabled ? 'bg-surface-3 border-edge text-slate-600 opacity-50 cursor-not-allowed'
                : 'bg-surface-3 border-edge text-slate-300 hover:bg-slate-700',
            )}
          >
            {g}
          </div>
        );
      })}
    </div>
  );
}