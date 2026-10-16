'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuantumStore } from '@/store/useQuantumStore';
import { CORE_MISSION_IDS, type MissionId } from '@/features/missions/missionRegistry';
import { RotateCcw, Moon, Sun, Maximize2, Minimize2, Sparkles } from 'lucide-react';

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
  const jumpToMission = useQuantumStore((s) => s.jumpToMission);

  return (
    <nav aria-label="Mission Selector" className="flex items-center gap-1 overflow-x-auto py-1">
      {CORE_MISSION_IDS.map((id) => {
        const isActive = currentMissionId === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => jumpToMission(id)}
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
  const resetState = useQuantumStore((s) => s.resetState);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('quantum_theme') as 'dark' | 'light' | null;
    return saved === 'light' ? 'light' : 'dark';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('quantum_theme', next);
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <GlobalListeners />
      {/* Shell Header */}
      <header className="h-[60px] border-b border-border bg-card/80 backdrop-blur-md px-4 flex items-center justify-between gap-4 sticky top-0 z-50">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <Sparkles className="w-5 h-5 text-cyan group-hover:rotate-12 transition-transform" />
            <span className="font-orbitron font-bold text-sm tracking-wide bg-gradient-to-r from-cyan to-purple-400 bg-clip-text text-transparent">
              QuantumLab 3D
            </span>
          </Link>
          <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground border-l border-border pl-3">
            v0.3.0 MVP
          </span>
        </div>

        {/* Center: Unlocked 1-Click Mission 0-6 Selector (HU-MVP-09) */}
        <div className="flex-1 max-w-2xl hidden md:flex justify-center">
          <AppNavigation />
        </div>

        {/* Right Tools: Reset (HU-MVP-10) + Theme + Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}

export function LeanLabLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
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
