'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuantumStore } from '@/store/useQuantumStore';
import { CORE_MISSION_IDS, type MissionId } from '@/features/missions/missionRegistry';
import { BlochViewport } from '@/features/quantum-core/BlochViewport';
import { PauseMenuModal } from '@/components/game/PauseMenuModal';
import { RotateCcw, Moon, Sun, Maximize2, Minimize2, Sparkles, Sliders } from 'lucide-react';

interface AppShellProps {
  children?: React.ReactNode;
}

const MISSION_SHORT_LABELS: Record<MissionId, string> = {
  superposition: '0: Superposition',
  entanglement: '1: Entanglement',
  decoherence: '2: Decoherence',
  gates: '3: Gates',
  grover: '4: Grover',
  applications: '5: Shor (N=15)',
  'error-correction': '6: 3-Qubit QEC',
};

// Internal un-exported subcomponent: Navigation and quick-jump mission selector (HU-MVP-09)
function AppNavigation() {
  const currentMissionId = useQuantumStore((s) => s.currentMissionId ?? s.activeMissionId ?? 'superposition');
  const launchMission = useQuantumStore((s) => s.launchMission);
  const jumpToMission = useQuantumStore((s) => s.jumpToMission);

  return (
    <nav aria-label="Mission Selector" className="flex items-center gap-1 overflow-x-auto py-1">
      {CORE_MISSION_IDS.map((id) => {
        const isActive = currentMissionId === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (launchMission) {
                launchMission(id);
              } else {
                jumpToMission(id);
              }
            }}
            data-testid={`mission-jump-${id}`}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-all border ${
              isActive
                ? 'bg-cyan/20 text-cyan border-cyan/60 font-semibold shadow-sm'
                : 'bg-surface-2 text-muted-foreground border-edge hover:bg-surface-3 hover:text-foreground'
            }`}
          >
            {MISSION_SHORT_LABELS[id]}
          </button>
        );
      })}
    </nav>
  );
}

// Internal un-exported subcomponent: Global listeners for theme & shortcuts
function GlobalListeners() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        // Safe key handler
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  return null;
}

export function AppShell({ children }: AppShellProps) {
  const appViewState = useQuantumStore((s) => s.appViewState);
  const togglePauseMenu = useQuantumStore((s) => s.togglePauseMenu);
  const resetState = useQuantumStore((s) => s.resetState);
  const theme = useQuantumStore((s) => s.theme);
  const toggleTheme = useQuantumStore((s) => s.toggleTheme);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark', 'theme-dark');
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.add('dark', 'theme-dark');
      document.documentElement.classList.remove('theme-light');
    }
  }, [theme]);

  // Notify WebGL canvas on view state transitions to adjust camera/aspect without context rebuild
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('resize'));
    }
  }, [appViewState]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden">
      <GlobalListeners />

      {/* 1. Fixed Background WebGL Canvas (Single context across entire session) */}
      <div className="fixed inset-0 z-0 w-full h-full pointer-events-auto">
        <BlochViewport className="fixed inset-0 z-0 w-full h-full rounded-none border-0 bg-transparent" />
      </div>

      {/* Global ESC Pause Menu Modal */}
      <PauseMenuModal />

      {/* 2. Floating Tactical Layer on z-10 */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen pointer-events-none">
        {/* Shell Header */}
        <header className="h-[60px] border-b border-border/80 bg-card/60 backdrop-blur-md px-4 flex items-center justify-between gap-4 sticky top-0 z-20 pointer-events-auto shrink-0">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <Sparkles className="w-5 h-5 text-cyan group-hover:rotate-12 transition-transform" />
              <span className="font-orbitron font-bold text-sm tracking-wide bg-gradient-to-r from-cyan to-purple-400 bg-clip-text text-transparent">
                QuantumLab 3D
              </span>
            </Link>
            <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground border-l border-border pl-3">
              v0.3.0-QUANTUM-CORE
            </span>
          </div>

          {/* Center: Unlocked 1-Click Mission 0-6 Selector (HU-MVP-09) */}
          <div className="flex-1 max-w-2xl hidden md:flex justify-center">
            <AppNavigation />
          </div>

          {/* Right Tools: Reset (HU-MVP-10) + Pause + Theme + Fullscreen */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => togglePauseMenu()}
              data-testid="toggle-pause-button"
              title="Pause Menu [ESC]"
              className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-cyan border border-edge transition-colors"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => resetState()}
              data-testid="reset-state-button"
              title="Reset Quantum State to |0⟩ (HU-MVP-10)"
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-surface-2 hover:bg-surface-3 text-foreground border border-edge flex items-center gap-1.5 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Reset |0⟩</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground border border-edge transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-cyan" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Toggle fullscreen"
              className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground border border-edge transition-colors hidden sm:block"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Main Content: Floating Tactical HUDs */}
        <main className="flex-1 flex flex-col relative overflow-hidden pointer-events-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function LeanLabLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function PageContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>{children}</div>;
}

export function PageHeader({ title, description }: { title: string; description?: string | null }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

