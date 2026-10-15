// src/components/layout/AppShell.tsx
'use client';

import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { MISSIONS } from '@/features/missions/config/missions';

export interface AppShellProps {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AppShell({ children, header, footer, className = '' }: AppShellProps) {
  const activeMissionId = useQuantumStore((s) => s.activeMissionId);
  const selectMission = useQuantumStore((s) => s.selectMission);
  const resetState = useQuantumStore((s) => s.resetState);

  const missionList = MISSIONS.slice(0, 7);

  const defaultTopBar = (
    <header className="w-full border-b border-border bg-background-80/90 backdrop-blur-md px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold text-accent tracking-wider uppercase">
          QUANTUM LAB 3D
        </span>
      </div>

      {/* 7 Unlocked Mission Buttons (M0 to M6) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {missionList.map((m, index) => {
          const isSelected = activeMissionId === index;
          return (
            <button
              key={m.id || index}
              type="button"
              onClick={() => selectMission(index)}
              title={m.title}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-accent text-accent-foreground shadow-md shadow-accent/20 border border-accent'
                  : 'bg-card/70 hover:bg-card text-foreground hover:text-accent border border-border/80'
              }`}
            >
              M{index}
            </button>
          );
        })}
      </div>

      {/* Prominent Reset State Button */}
      <div>
        <button
          type="button"
          onClick={() => resetState()}
          className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/50 transition-all cursor-pointer shadow-sm shadow-destructive/20"
        >
          Reset State
        </button>
      </div>
    </header>
  );

  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col ${className}`}>
      {header ?? defaultTopBar}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      {footer}
    </div>
  );
}

export default AppShell;
