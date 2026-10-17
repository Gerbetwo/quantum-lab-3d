'use client';

import React, { useEffect, useCallback } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { soundEngine } from '@/lib/soundEngine';
import { Sparkles, Terminal } from 'lucide-react';

export function TitleScreenOverlay() {
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
      className="fixed inset-0 z-50 flex flex-col justify-between items-center p-6 md:p-10 bg-background/60 backdrop-blur-sm cursor-pointer select-none transition-all duration-500"
    >
      {/* Telemetry Header */}
      <header className="w-full max-w-6xl flex justify-between items-center text-xs font-mono tracking-wider text-muted-foreground border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-foreground font-semibold">QUANTUM SIMULATION ENGINE</span>
          <span className="hidden sm:inline text-muted-foreground/60">| FLIGHT-DECK ONLINE</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">SYS.TEMP: 15 mK</span>
          <span className="text-cyan font-bold tracking-normal">v0.3.0-QUANTUM-CORE</span>
        </div>
      </header>

      {/* Hero Typography & Interactive Prompt */}
      <main className="flex flex-col items-center text-center gap-4 my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" /> BLOCH SPHERE VIEWPORT
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-sans">
          QUANTUM<span className="bg-gradient-to-r from-cyan via-purple-400 to-emerald-400 bg-clip-text text-transparent">LAB 3D</span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-md font-mono">
          TACTICAL STATE MANIPULATION & DECOHERENCE HARNESS
        </p>

        <div className="mt-8 px-6 py-3 rounded-xl border border-cyan/40 bg-cyan/10 backdrop-blur-md shadow-[0_0_25px_rgba(0,243,255,0.2)] text-cyan font-mono text-xs sm:text-sm tracking-widest font-bold animate-pulse flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span>PRESS ANY KEY / ENTER QUANTUM LAB</span>
        </div>
      </main>

      {/* Telemetry Footer */}
      <footer className="w-full max-w-6xl flex justify-between items-center text-[10px] font-mono text-muted-foreground/60 border-t border-border/40 pt-3">
        <span>SINGLE WEBGL CONTEXT // DETERMINISTIC PHYSICS</span>
        <span>CLICK ANYWHERE OR PRESS ANY KEY TO INITIALIZE</span>
      </footer>
    </div>
  );
}
