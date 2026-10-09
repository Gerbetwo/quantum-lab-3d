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
      <main data-testid="lean-lab-viewport" className="flex-1 flex items-top justify-center p-4">
        <div className="w-full">{children || viewport}</div>
      </main>
    </div>
  );
}
