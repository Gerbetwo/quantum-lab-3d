/**
- Header Component
- Displays active mission title, canonical timer, pause/resume control, 
- stable user ID, non-blocking storage warnings, theme toggle, and fullscreen control.
- Optimized for 375px mobile viewports using Tailwind v4 semantic variables.
 */
'use client';

import React from 'react';

interface HeaderProps {
  title?: string;
  onAction?: () => void;
  actionLabel?: React.ReactNode;
  timeLeft?: string | number;
  isRunning?: boolean;
  onToggleTimer?: () => void;
  userId?: string | null;
  isHydrated?: boolean;
  storageWarning?: string | null;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function Header({
  title = 'Quantum Lab 3D',
  onAction,
  actionLabel,
  timeLeft,
  isRunning = false,
  onToggleTimer,
  userId,
  isHydrated = false,
  storageWarning,
  theme = 'dark',
  onToggleTheme,
  isFullscreen = false,
  onToggleFullscreen,
}: HeaderProps) {
  const formattedTime = typeof timeLeft === 'number'
    ? `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
    : timeLeft;

  return (
    <header className="w-full flex flex-col bg-background border-b border-border text-foreground transition-colors duration-300">
      {storageWarning && (
        <div 
          role="alert" 
          aria-live="polite" 
          className="bg-amber-500/10 border-b border-amber-500/20 px-3 sm:px-6 py-2 text-xs text-amber-300 flex items-center justify-between"
        >
          <span className="truncate">⚠️ Storage Notice: {storageWarning}</span>
        </div>
      )}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 min-h-14 gap-2 overflow-x-auto">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <span 
            className="font-bold tracking-wider text-accent text-xs sm:text-base truncate max-w-25 sm:max-w-xs" 
            title={title}
          >
            {title}
          </span>
          {formattedTime !== undefined && (
            <span data-testid="timer-display" className="text-xs px-2 py-1 bg-card rounded font-mono shrink-0">
              {formattedTime}
            </span>
          )}
          {onToggleTimer && (
            <button
              onClick={onToggleTimer}
              aria-label={isRunning ? 'Pausar cronómetro' : 'Reanudar cronómetro'}
              className="text-xs text-accent hover:underline shrink-0 px-1 py-0.5"
            >
              {isRunning ? 'Pausar' : 'Reanudar'}
            </button>
          )}
          {isHydrated && userId ? (
            <span data-testid="user-id-value" className="text-xs text-muted-foreground truncate max-w-17.5 sm:max-w-30" title={userId}>
              {userId}
            </span>
          ) : (
            <div aria-busy="true" data-testid="user-id-skeleton" className="w-12 sm:w-16 h-4 bg-card animate-pulse rounded shrink-0" />
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="px-2 py-1 bg-card hover:bg-muted text-foreground rounded text-xs transition-colors"
              title="Cambiar tema"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          )}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Entrar en pantalla completa'}
              className="px-2 py-1 bg-card hover:bg-muted text-foreground rounded text-xs transition-colors"
              title="Pantalla completa"
            >
              {isFullscreen ? '⤫ Exit FS' : '⤢ Fullscreen'}
            </button>
          )}
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;