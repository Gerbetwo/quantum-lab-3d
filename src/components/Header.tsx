'use client';

import React, { useEffect, useState } from 'react';
import { Atom, Play, Pause, UserCheck } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-[#070913]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan to-purple-600 flex items-center justify-center shadow-lg shadow-cyan/20">
            <Atom className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="font-orbitron font-bold text-sm sm:text-base text-white tracking-wider flex items-center gap-1.5">
              QUANTUMLAB <span className="text-cyan text-xs">3D</span>
            </h1>
            <p className="text-[10px] font-mono text-slate-400 hidden sm:block">
              ENTRENAMIENTO EXPERIMENTAL INTERACTIVO
            </p>
          </div>
        </div>

        {/* Center / Right: Student ID & 10 Min Timer */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* User ID Badge */}
          <div className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-mono text-slate-300">
            <UserCheck className="w-3.5 h-3.5 text-cyan" />
            <span className="hidden sm:inline text-slate-400">ID:</span>
            <span className="font-bold text-white">{userId || 'Cargando...'}</span>
          </div>

          {/* Timer Display */}
          <div className="flex items-center gap-2 bg-black/60 border border-slate-800 rounded-full px-3.5 py-1">
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">⏱️ TIEMPO:</span>
            <span
              className={`font-orbitron font-bold text-sm tracking-wider ${
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
              className="text-slate-400 hover:text-white transition-colors ml-1 p-0.5"
              title={isRunning ? 'Pausar temporizador' : 'Reanudar temporizador'}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
