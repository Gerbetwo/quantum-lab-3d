'use client';

import React, { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import {
  Hash, X as XIcon, Sparkles, Zap, Sigma, Triangle,
  Link as LinkIcon, Snowflake, RefreshCw, Activity,
  type LucideIcon,
} from 'lucide-react';
import type { GateType } from '@/core/math/circuit';
import Tooltip from '@/shared/ui/Tooltip';
import { useGuidedMission } from '@/features/missions/hooks/useGuidedMission';

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
  CNOT: 'Controlled-NOT', CZ: 'Controlled-Z', SWAP: 'SWAP',
  CS: 'Controlled-S', CT: 'Controlled-T',
};

const ICONS: Record<GateType, LucideIcon> = {
  H: Hash,
  X: XIcon,
  Y: Sparkles,
  Z: Zap,
  S: Sigma,
  T: Triangle,
  CNOT: LinkIcon,
  CZ: Snowflake,
  SWAP: RefreshCw,
  CS: Activity,
  CT: Activity,
};

export default function GatePalette({ gates = DEFAULT_GATES, selected, onSelect, disabled = [] }: Props) {
  const { isManipulationAllowed, currentStepConfig, executeGate } = useGuidedMission();
  const disabledSet = useMemo(() => new Set(disabled), [disabled]);

  const handleGateSelect = useCallback(
    (g: GateType) => {
      if (disabledSet.has(g)) return;
      if (isManipulationAllowed) {
        executeGate?.(g);
      }
      onSelect(g);
    },
    [disabledSet, isManipulationAllowed, executeGate, onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const g = gates[index];
        handleGateSelect(g);
        return;
      }
      const parent = e.currentTarget.parentElement;
      if (!parent) return;
      const children = Array.from(parent.children) as HTMLElement[];
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        children[(index + 1) % gates.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        children[(index - 1 + gates.length) % gates.length]?.focus();
      }
    },
    [gates, handleGateSelect],
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
        const isAllowed = Boolean(currentStepConfig?.allowedGates?.includes(g));
        const Icon = ICONS[g];

        return (
          <Tooltip key={g} content={LABELS[g]} delayDuration={200} side="right">
            <div
              role="option"
              aria-selected={isSelected}
              aria-disabled={isDisabled || undefined}
              aria-label={LABELS[g]}
              tabIndex={isSelected ? 0 : -1}
              data-testid={'gate-option-' + g}
              onClick={() => handleGateSelect(g)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className={clsx(
                'px-2 py-1.5 rounded-lg text-xs font-orbitron font-bold text-center',
                'cursor-pointer select-none border transition-all outline-none',
                'focus:ring-2 focus:ring-cyan/40 flex items-center justify-center gap-1.5',
                'active:scale-95 active:bg-cyan/30',
                isSelected
                  ? 'bg-cyan/20 border-cyan text-cyan'
                  : isDisabled
                  ? 'bg-surface-3 border-edge text-slate-600 opacity-50 cursor-not-allowed'
                  : 'bg-surface-3 border-edge text-muted-foreground hover:bg-muted',
                !isDisabled && isAllowed && 'border-cyan-400 animate-pulse',
              )}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-mono text-[10px]">{g}</span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
