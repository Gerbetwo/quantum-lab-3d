'use client';

import React, { useEffect } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { BlochViewport } from '@/features/quantum-core/BlochViewport';
import { PauseMenuModal } from '@/components/game/PauseMenuModal';

interface AppShellProps {
  children?: React.ReactNode;
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
  const theme = useQuantumStore((s) => s.theme);

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
