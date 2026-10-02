'use client';

import React, { useEffect, useState } from 'react';
import { Atom, Play, Pause, User, Clock } from 'lucide-react';
import { getOrCreateUserId } from '@/lib/cookies';
import { playButtonClick } from '@/lib/sound';

interface Props {
  timeLeft: number;
  isRunning: boolean;
  onToggleTimer: () => void;
}

export default function Header({ timeLeft, isRunning, onToggleTimer }: Props) {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    setUserId(getOrCreateUserId());
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070913]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3 w-full">
      <div className="w-full flex justify-between items-center">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan/10 border border-cyan/40 flex items-center justify-center text-cyan shadow-sm shadow-cyan/20">
            <Atom className="w-5 h-5 text-cyan" />
          </div>
          <div>
            <div className="font-orbitron font-bold text-sm sm:text-base text-white tracking-wider flex items-center gap-2">
              QUANTUMLAB <span className="text-cyan text-xs font-mono font-normal">3D</span>
            </div>
            <div className="text-[11px] font-sans text-slate-400 hidden sm:block">
              Simulación Experimental Cuántica
            </div>
          </div>
        </div>

        {/* Right Tools: User ID & Timer */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* User ID Badge */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-mono">
            <User className="w-3.5 h-3.5 text-cyan" />
            <span className="text-slate-400 hidden sm:inline">Usuario:</span>
            <span className="font-semibold text-slate-200">{userId || 'Cargando...'}</span>
          </div>

          {/* 10 Min Countdown Timer */}
          <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan" />
            <span className="text-xs text-slate-400 hidden sm:inline font-sans">Tiempo:</span>
            <span
              data-testid="timer-display"
              className={`font-mono font-bold text-sm tracking-wide ${
                timeLeft <= 60 ? 'text-rose-400 animate-pulse' : 'text-cyan'
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
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
