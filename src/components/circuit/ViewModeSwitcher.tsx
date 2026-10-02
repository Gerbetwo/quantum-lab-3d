'use client';

import React from 'react';
import clsx from 'clsx';

export type ViewMode = 'bloch' | 'histogram' | 'phase-disk';

const LABELS: Record<ViewMode, string> = {
  bloch: 'Esferas de Bloch',
  histogram: 'Histograma',
  'phase-disk': 'Discos de Fase',
};

interface Props {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  available?: readonly ViewMode[];
}

export default function ViewModeSwitcher({ mode, onChange, available }: Props) {
  const modes: readonly ViewMode[] = available ?? ['bloch', 'histogram', 'phase-disk'];
  return (
    <div role="tablist" aria-label="Modo de visualizacion" data-testid="view-mode-switcher" className="flex gap-1.5 mb-3 flex-wrap">
      {modes.map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          data-testid={'view-mode-' + m}
          onClick={() => onChange(m)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-mono transition-colors',
            mode === m ? 'bg-cyan/20 text-cyan border border-cyan/60'
              : 'bg-surface-2 text-slate-400 border border-edge hover:bg-surface-3',
          )}
        >
          {LABELS[m]}
        </button>
      ))}
    </div>
  );
}