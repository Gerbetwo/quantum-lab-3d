'use client';

import React, { useEffect, useState } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { useTranslation } from '@/lib/i18n';
import { soundEngine } from '@/lib/soundEngine';
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
  const { t } = useTranslation();
  const isPauseMenuOpen = useQuantumStore((s) => s.isPauseMenuOpen);
  const togglePauseMenu = useQuantumStore((s) => s.togglePauseMenu);
  const appViewState = useQuantumStore((s) => s.appViewState);
  const setAppViewState = useQuantumStore((s) => s.setAppViewState);
  const returnToTitle = useQuantumStore((s) => s.returnToTitle);
  const resetState = useQuantumStore((s) => s.resetState);
  const currentMissionId = useQuantumStore((s) => s.currentMissionId);
  const isSoundEnabled = useQuantumStore((s) => s.isSoundEnabled);
  const toggleSound = useQuantumStore((s) => s.toggleSound);
  const theme = useQuantumStore((s) => s.theme);
  const toggleTheme = useQuantumStore((s) => s.toggleTheme);

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

  return (
    <div
      data-testid="pause-menu-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md select-none"
    >
      <div
        data-testid="pause-menu-modal"
        className="w-full max-w-md p-6 rounded-2xl hud-panel glow-cyan flex flex-col gap-5 text-foreground"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-quantum-cyan uppercase font-semibold">
              {t('pause.flight_deck_control')}
            </span>
            <h2 className="text-base font-bold tracking-tight">{t('pause.pause_simulation')}</h2>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              {t('pause.active_label')} <span className="text-foreground uppercase">{currentMissionId}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleResume}
            data-testid="pause-close-button"
            className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
            title={t('pause.close_button')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Menu List */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleResume}
            data-testid="pause-resume-button"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold hud-badge-cyan hover:opacity-90 flex items-center justify-between transition-all active:scale-98 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" />
              <span>{t('pause.resume')}</span>
            </span>
            <span className="text-[10px] opacity-80 font-normal">ESC</span>
          </button>

          <button
            type="button"
            onClick={handleMissionSelector}
            data-testid="pause-mission-selector-button"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-semibold bg-surface-2 hover:bg-surface-3 text-foreground border border-border flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <Grid className="w-4 h-4 text-quantum-purple" />
            <span>{t('pause.mission_selector')}</span>
          </button>

          <button
            type="button"
            onClick={handleResetState}
            data-testid="pause-reset-state-button"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-semibold bg-surface-2 hover:bg-surface-3 text-foreground border border-border flex items-center justify-between transition-all active:scale-98 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-warning" />
              <span>{t('pause.reset_quantum_state')}</span>
            </span>
            {resetFeedback && (
              <span className="text-[10px] text-warning font-normal animate-pulse">{t('pause.reset_feedback')}</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleExitToTitle}
            data-testid="pause-exit-title-button"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-semibold bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground border border-border flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-destructive" />
            <span>{t('pause.exit_to_title')}</span>
          </button>
        </div>

        {/* Options Drawer */}
        <div className="pt-3 border-t border-border flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-quantum-cyan" />
            <span>{t('pause.system_options')}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              data-testid="pause-theme-toggle"
              className="py-2 px-3 rounded-lg text-xs font-mono bg-surface-2 hover:bg-surface-3 border border-border flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-warning" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-quantum-cyan" />
                )}
                <span>{t('pause.theme')}</span>
              </span>
              <span className="text-[11px] font-bold text-foreground">
                {theme === 'dark' ? t('pause.theme_dark') : t('pause.theme_light')}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleSound}
              data-testid="pause-sound-toggle"
              className="py-2 px-3 rounded-lg text-xs font-mono bg-surface-2 hover:bg-surface-3 border border-border flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {isSoundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-quantum-cyan" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-destructive" />
                )}
                <span>{t('pause.audio')}</span>
              </span>
              <span className="text-[11px] font-bold text-foreground">
                {isSoundEnabled ? t('pause.audio_on') : t('pause.audio_muted')}
              </span>
            </button>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="text-center text-[10px] font-mono text-muted-foreground border-t border-border pt-2">
          {t('pause.footer_hint')}
        </div>
      </div>
    </div>
  );
}
