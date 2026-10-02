'use client';

import React from 'react';
import clsx from 'clsx';
import { Atom, BarChart3, Circle } from 'lucide-react';

export type ViewMode = 'bloch' | 'histogram' | 'phase-disk';

const LABELS: Record<ViewMode, string> = {
  bloch: 'Esferas de Bloch',
  histogram: 'Histograma',
  'phase-disk': 'Discos de Fase',
};

const ICONS: Record<ViewMode, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  bloch: Atom,
  histogram: BarChart3,
  'phase-disk': Circle,
};

interface Props {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  available?: readonly ViewMode[];
}

export default function ViewModeSwitcher({ mode, onChange, available }: Props) {
  const modes: readonly ViewMode[] = available ?? ['bloch', 'histogram', 'phase-disk'];
  return (
    <div
      role="tablist"
      aria-label="Modo de visualizacion"
      data-testid="view-mode-switcher"
      className="flex gap-1.5 mb-3 flex-wrap"
    >
      {modes.map((m) => {
        const Icon = ICONS[m];
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            aria-label={LABELS[m]}
            data-testid={'view-mode-' + m}
            onClick={() => onChange(m)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-mono transition-colors',
              'inline-flex items-center gap-1.5',
              mode === m
                ? 'bg-cyan/20 text-cyan border border-cyan/60'
                : 'bg-surface-2 text-slate-400 border border-edge hover:bg-surface-3',
            )}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden />
            <span>{LABELS[m]}</span>
          </button>
        );
      })}
    </div>
  );
}
