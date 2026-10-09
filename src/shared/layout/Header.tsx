'use client';

import React from 'react';
import { getOrCreateUserId } from '@/features/session/lib/sessionService';

interface HeaderProps {
  title?: string;
  onAction?: () => void;
  actionLabel?: React.ReactNode;
  timeLeft?: number;
  isRunning?: boolean;
  onToggleTimer?: () => void;
}

export function Header({
  title = 'Quantum Lab 3D',
  onAction,
  actionLabel,
  timeLeft,
  isRunning = false,
  onToggleTimer,
}: HeaderProps) {
  const userId = getOrCreateUserId();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 text-slate-100">
      <div className="flex items-center space-x-3">
        <span className="font-bold tracking-wider text-cyan-400">{title}</span>
        {timeLeft !== undefined && (
          <span data-testid="timer-display" className="text-xs px-2 py-1 bg-slate-800 rounded">
            {formatTime(timeLeft)}
          </span>
        )}
        {onToggleTimer && (
          <button
            onClick={onToggleTimer}
            aria-label={isRunning ? 'Pausar' : 'Reanudar'}
            className="text-xs text-cyan-400 underline"
          >
            {isRunning ? 'Pausar' : 'Reanudar'}
          </button>
        )}
        {userId ? (
          <span data-testid="user-id-value" className="text-xs text-slate-400">
            {userId}
          </span>
        ) : (
          <div aria-busy="true" data-testid="user-id-skeleton" className="w-16 h-4 bg-slate-800 animate-pulse rounded" />
        )}
      </div>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </header>
  );
}

export default Header;
