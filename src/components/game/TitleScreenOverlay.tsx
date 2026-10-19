'use client';

import React, { useEffect, useCallback } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { useTranslation } from '@/lib/i18n';
import { soundEngine } from '@/lib/soundEngine';
import { Sparkles, Terminal } from 'lucide-react';

export function TitleScreenOverlay() {
  const { t } = useTranslation();
  const appViewState = useQuantumStore((s) => s.appViewState);
  const setAppViewState = useQuantumStore((s) => s.setAppViewState);

  const handleStart = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playGateSound('H');
    setAppViewState('CAMPAIGN_SELECT');
  }, [setAppViewState]);

  useEffect(() => {
    if (appViewState !== 'TITLE') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      handleStart();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [appViewState, handleStart]);

  if (appViewState !== 'TITLE') return null;

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="title-screen-overlay"
      onClick={handleStart}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleStart();
      }}
      className="fixed inset-0 z-50 flex flex-col justify-between items-center p-6 md:p-10 bg-background/80 backdrop-blur-md cursor-pointer select-none transition-all duration-500"
    >
      {/* Telemetry Header */}
      <header className="w-full max-w-6xl flex justify-between items-center text-xs telemetry-mono tracking-wider text-muted-foreground border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-quantum-emerald animate-pulse" />
          <span className="text-foreground font-semibold">{t('title.engine_label')}</span>
          <span className="hidden sm:inline text-muted-foreground">| {t('title.flight_deck_online')}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">{t('title.sys_temp')}</span>
          <span className="text-quantum-cyan font-bold tracking-normal">{t('title.version')}</span>
        </div>
      </header>

      {/* Hero Typography & Interactive Prompt */}
      <main className="flex flex-col items-center text-center gap-4 my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full hud-badge-cyan text-xs telemetry-mono">
          <Sparkles className="w-3.5 h-3.5" /> {t('title.viewport_badge')}
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-sans">
          {t('title.headline')}<span className="bg-linear-to-r from-quantum-cyan via-quantum-purple to-quantum-emerald bg-clip-text text-transparent">{t('title.headline_accent')}</span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-md telemetry-mono">
          {t('title.tagline')}
        </p>

        <div className="mt-8 px-6 py-3 rounded-xl hud-badge-cyan glow-cyan telemetry-mono text-xs sm:text-sm tracking-widest font-bold animate-pulse flex items-center gap-2 cursor-pointer">
          <Terminal className="w-4 h-4" />
          <span>{t('title.press_any_key')}</span>
        </div>
      </main>

      {/* Telemetry Footer */}
      <footer className="w-full max-w-6xl flex justify-between items-center text-[10px] telemetry-mono text-muted-foreground border-t border-border pt-3">
        <span>{t('title.footer_physics')}</span>
        <span>{t('title.footer_init')}</span>
      </footer>
    </div>
  );
}