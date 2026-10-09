'use client';

import React from 'react';
import { Atom, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { useTheme } from '@/shared/hooks/useTheme';
import IconButton from '@/shared/ui/IconButton';
import { isAudioEnabled, setAudioEnabled } from '@/shared/lib/sound';

interface Props {
  header?: React.ReactNode;
  viewport?: React.ReactNode;
  circuitBar?: React.ReactNode;
  children?: React.ReactNode;
}

export default function LeanLabLayout({ header, viewport, circuitBar, children }: Props) {
  const { theme, toggle } = useTheme();
  const [audioOn, setAudioOn] = React.useState<boolean>(() => isAudioEnabled());

  const onToggleAudio = React.useCallback(() => {
    const next = !isAudioEnabled();
    setAudioEnabled(next);
    setAudioOn(next);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header
        data-testid="lean-lab-header"
        className="border-b border-edge px-4 py-2 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Atom className="w-5 h-5 text-cyan" aria-hidden="true" />
          <span className="font-orbitron font-bold text-sm">Lean QuantumLab</span>
        </div>
        <div className="flex items-center gap-2">
          {header}
          <IconButton
            icon={audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            label={audioOn ? 'Silenciar audio' : 'Activar audio'}
            tooltip={audioOn ? 'Silenciar' : 'Activar sonido'}
            onClick={onToggleAudio}
          />
          <IconButton
            icon={theme === 'dark'
              ? <Sun className="w-4 h-4" aria-hidden="true" />
              : <Moon className="w-4 h-4" aria-hidden="true" />}
            label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            onClick={toggle}
          />
        </div>
      </header>
      <main data-testid="lean-lab-viewport" className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">{children || viewport}</div>
      </main>
      <footer data-testid="lean-lab-circuit-bar" className="border-t border-edge px-4 py-3">
        {circuitBar ?? <div className="h-10" />}
      </footer>
    </div>
  );
}
