'use client';

import React from 'react';
import { Atom, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  header?: React.ReactNode;
  viewport: React.ReactNode;
  circuitBar?: React.ReactNode;
}

export default function LeanLabLayout({ header, viewport, circuitBar }: Props) {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header data-testid="lean-lab-header"
              className="border-b border-edge px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Atom className="w-5 h-5 text-cyan" aria-hidden="true" />
          <span className="font-orbitron font-bold text-sm">Lean QuantumLab</span>
        </div>
        <div className="flex items-center gap-2">
          {header}
          <button type="button" onClick={toggle}
                  aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                  className="p-2 rounded-lg border border-edge hover:bg-surface-1 transition-colors">
            {theme === 'dark'
              ? <Sun className="w-4 h-4" aria-hidden="true" />
              : <Moon className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
      </header>
      <main data-testid="lean-lab-viewport"
            className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">{viewport}</div>
      </main>
      <footer data-testid="lean-lab-circuit-bar"
              className="border-t border-edge px-4 py-3">
        {circuitBar ?? <div className="h-10" />}
      </footer>
    </div>
  );
}
