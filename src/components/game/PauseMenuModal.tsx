'use client';

import React, { useEffect, useState } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { soundEngine, isAudioEnabled, toggleAudio } from '@/lib/soundEngine';
import {
  Play,
  Grid,
  RotateCcw,
  LogOut,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Sliders,
  X,
} from 'lucide-react';

interface PauseMenuModalProps {
  forceVisible?: boolean;
}

export function PauseMenuModal({ forceVisible = false }: PauseMenuModalProps = {}) {
  const isPauseMenuOpen = useQuantumStore((s) => s.isPauseMenuOpen);
  const togglePauseMenu = useQuantumStore((s) => s.togglePauseMenu);
  const appViewState = useQuantumStore((s) => s.appViewState);
  const setAppViewState = useQuantumStore((s) => s.setAppViewState);
  const returnToTitle = useQuantumStore((s) => s.returnToTitle);
  const resetState = useQuantumStore((s) => s.resetState);
  const currentMissionId = useQuantumStore((s) => s.currentMissionId);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('quantum_theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });

  const [soundOn, setSoundOn] = useState<boolean>(() => isAudioEnabled());
  const [resetFeedback, setResetFeedback] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (appViewState === 'IN_MISSION' || appViewState === 'SANDBOX' || isPauseMenuOpen) {
          e.preventDefault();
          togglePauseMenu();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appViewState, isPauseMenuOpen, togglePauseMenu]);

  if (!isPauseMenuOpen && !forceVisible) {
    return null;
  }

  const handleResume = () => {
    soundEngine.unlock();
    soundEngine.playVectorSnap();
    togglePauseMenu();
  };

  const handleMissionSelector = () => {
    soundEngine.unlock();
    soundEngine.playVectorSnap();
    togglePauseMenu();
    setAppViewState('CAMPAIGN_SELECT');
  };

  const handleResetState = () => {
    soundEngine.unlock();
    soundEngine.playVectorSnap();
    resetState();
    setResetFeedback(true);
    setTimeout(() => setResetFeedback(false), 1500);
  };

  const handleExitToTitle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEngine.unlock();
    soundEngine.playVectorSnap();
    returnToTitle();
  };

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('quantum_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('quantum_theme', 'light');
    }
  };

  const handleToggleSound = () => {
    const next = toggleAudio();
    setSoundOn(next);
  };

  return (
    <div
      data-testid="pause-menu-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm select-none"
    >
      <div
        data-testid="pause-menu-modal"
        className="w-full max-w-md p-6 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl flex flex-col gap-5 text-foreground"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-cyan uppercase font-semibold">
              Flight-Deck Control
            </span>
            <h2 className="text-base font-bold tracking-tight">PAUSE SIMULATION</h2>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              Active: <span className="text-foreground uppercase">{currentMissionId}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleResume}
            data-testid="pause-close-button"
            className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground border border-edge transition-colors"
            title="Resume Simulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Menu List */}
        <div className="flex flex-col gap-2">
          {/* 1. RESUME */}
          <button
            type="button"
            onClick={handleResume}
            data-testid="pause-resume-button"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold bg-cyan/15 hover:bg-cyan/25 text-cyan border border-cyan/40 hover:border-cyan flex items-center justify-between transition-all active:scale-98 shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" />
              <span>RESUME</span>
            </span>
            <span className="text-[10px] text-cyan/70 font-normal">ESC</span>
          </button>

          {/* 2. MISSION SELECTOR */}
          <button
            type="button"
            onClick={handleMissionSelector}
            data-testid="pause-mission-selector-button"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-semibold bg-surface-2 hover:bg-surface-3 text-foreground border border-edge flex items-center gap-2 transition-all active:scale-98"
          >
            <Grid className="w-4 h-4 text-purple-400" />
            <span>MISSION SELECTOR</span>
          </button>

          {/* 3. RESET QUANTUM STATE */}
          <button
            type="button"
            onClick={handleResetState}
            data-testid="pause-reset-state-button"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-semibold bg-surface-2 hover:bg-surface-3 text-foreground border border-edge flex items-center justify-between transition-all active:scale-98"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>RESET QUANTUM STATE</span>
            </span>
            {resetFeedback && (
              <span className="text-[10px] text-amber-400 font-normal animate-pulse">|0⟩ RESET</span>
            )}
          </button>

          {/* 4. EXIT TO TITLE */}
          <button
            type="button"
            onClick={handleExitToTitle}
            data-testid="pause-exit-title-button"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-semibold bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground border border-edge flex items-center gap-2 transition-all active:scale-98"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>EXIT TO TITLE</span>
          </button>
        </div>

        {/* Options Drawer: Theme & Sound Controls */}
        <div className="pt-3 border-t border-border/80 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-cyan" />
            <span>System Options</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={handleToggleTheme}
              data-testid="pause-theme-toggle"
              className="py-2 px-3 rounded-lg text-xs font-mono bg-surface-2 hover:bg-surface-3 border border-edge flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-cyan" />}
                <span>Theme</span>
              </span>
              <span className="text-[11px] font-bold text-foreground">
                {isDark ? 'Dark' : 'Light'}
              </span>
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              data-testid="pause-sound-toggle"
              className="py-2 px-3 rounded-lg text-xs font-mono bg-surface-2 hover:bg-surface-3 border border-edge flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {soundOn ? <Volume2 className="w-3.5 h-3.5 text-cyan" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
                <span>Audio</span>
              </span>
              <span className="text-[11px] font-bold text-foreground">
                {soundOn ? 'ON' : 'MUTED'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="text-center text-[10px] font-mono text-muted-foreground/60 border-t border-border/40 pt-2">
          PRESS [ESC] OR CLICK RESUME TO RETURN TO SIMULATION
        </div>
      </div>
    </div>
  );
}
