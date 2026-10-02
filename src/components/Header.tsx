'use client';

import React, { useEffect, useState, memo } from 'react';
import { Atom, Play, Pause, User, Clock, Maximize2, Minimize2 } from 'lucide-react';
import { getOrCreateUserId } from '@/lib/cookies';
import { playButtonClick } from '@/lib/sound';
import { useIsDesktop } from '@/hooks/useBreakpoint';

interface Props {
  timeLeft: number;
  isRunning: boolean;
  onToggleTimer: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

const timeCache = new Map<number, string>();

function formatTime(seconds: number): string {
  const cached = timeCache.get(seconds);
  if (cached !== undefined) return cached;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const out = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  timeCache.set(seconds, out);
  return out;
}

const BrandSection = memo(function BrandSection({ compact }: { compact: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-cyan/10 border border-cyan/40 flex items-center justify-center text-cyan shadow-sm shadow-cyan/20">
        <Atom className="w-5 h-5 text-cyan" />
      </div>

      {!compact && (
        <div className="hidden md:block">
          <div className="font-orbitron font-bold text-sm sm:text-base text-white tracking-wider flex items-center gap-2">
            QUANTUMLAB <span className="text-cyan text-xs font-mono font-normal">3D</span>
          </div>

          <div className="text-[11px] font-sans text-slate-400">
            Simulación Experimental Cuántica
          </div>
        </div>
      )}
    </div>
  );
});

const UserBadge = memo(function UserBadge({
  userId,
  compact,
}: {
  userId: string;
  compact: boolean;
}) {
  const loading = userId.length === 0;

  return (
    <div
      data-testid="user-badge"
      className="bg-surface-2 border border-edge rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-mono"
      aria-busy={loading}
      title={userId || 'Cargando…'}
    >
      <User className="w-3.5 h-3.5 text-cyan" aria-hidden="true" />

      {!compact && (
        <span className="text-slate-400 hidden md:inline">
          Usuario:
        </span>
      )}

      {loading ? (
        <span
          data-testid="user-id-skeleton"
          className="inline-block w-14 h-3 rounded bg-slate-700/60 animate-pulse"
          aria-hidden="true"
        />
      ) : (
        <span
          data-testid="user-id-value"
          className={`font-semibold text-slate-200 ${
            compact ? 'inline-block max-w-[6ch] truncate align-bottom' : ''
          }`}
        >
          {userId}
        </span>
      )}
    </div>
  );
});

const TimerDisplay = memo(function TimerDisplay({
  timeLeft,
  isRunning,
  onToggleTimer,
  compact,
}: {
  timeLeft: number;
  isRunning: boolean;
  onToggleTimer: () => void;
  compact: boolean;
}) {
  const isUrgent = timeLeft <= 60;

  return (
    <div className="flex items-center gap-2.5 bg-surface-2 border border-edge rounded-lg px-3 py-1.5">
      <Clock className="w-3.5 h-3.5 text-cyan" aria-hidden="true" />

      {!compact && (
        <span className="text-xs text-slate-400 hidden md:inline font-sans">
          Tiempo:
        </span>
      )}

      <span
        data-testid="timer-display"
        className={`font-mono font-bold text-sm tracking-wide ${
          isUrgent
            ? 'text-rose-400 animate-pulse'
            : 'text-cyan'
        }`}
      >
        {formatTime(timeLeft)}
      </span>

      <button
        onClick={() => {
          playButtonClick();
          onToggleTimer();
        }}
        className="text-slate-400 hover:text-white transition-colors p-0.5 rounded hover:bg-slate-800"
        title={isRunning ? 'Pausar temporizador' : 'Reanudar temporizador'}
        aria-label={isRunning ? 'Pausar' : 'Reanudar'}
      >
        {isRunning ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
});

export default function Header({
  timeLeft,
  isRunning,
  onToggleTimer,
  onToggleFullscreen,
  isFullscreen,
}: Props) {
  const [userId, setUserId] = useState<string>('');
  const isDesktop = useIsDesktop();
  const compact = !isDesktop;

  useEffect(() => {
    setUserId(getOrCreateUserId());
  }, []);

  return (
    <header
      data-compact={compact ? 'true' : 'false'}
      className="sticky top-0 z-40 bg-[#070913]/85 backdrop-blur-md border-b border-edge/80 px-4 sm:px-6 lg:px-8 py-2 lg:py-3 w-full animate-hudFade"
    >
      <div className="w-full flex justify-between items-center gap-3">
        <BrandSection compact={compact} />

        <div className="flex items-center gap-2 sm:gap-3">
          <UserBadge userId={userId} compact={compact} />

          <TimerDisplay
            timeLeft={timeLeft}
            isRunning={isRunning}
            onToggleTimer={onToggleTimer}
            compact={compact}
          />

          {onToggleFullscreen && (
            <button
              onClick={() => {
                playButtonClick();
                onToggleFullscreen();
              }}
              className="p-2 rounded-lg bg-surface-2 border border-edge text-slate-400 hover:text-white hover:bg-surface-3 transition-colors"
              aria-label={
                isFullscreen
                  ? 'Salir de pantalla completa'
                  : 'Pantalla completa'
              }
              title={
                isFullscreen
                  ? 'Salir de pantalla completa'
                  : 'Pantalla completa (F)'
              }
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
