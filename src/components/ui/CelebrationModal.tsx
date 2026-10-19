'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useQuantumStore } from '@/store/useQuantumStore';
import { useTranslation } from '@/lib/i18n';
import { Sparkles, Trophy, ArrowRight, X } from 'lucide-react';

export function CelebrationModal() {
  const { t } = useTranslation();
  const completedMissions = useQuantumStore((s) => s.completedMissions);
  const isSandboxUnlocked = useQuantumStore((s) => s.isSandboxUnlocked);

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hasCompletedCourse = completedMissions.includes(6) || isSandboxUnlocked;
    const alreadyShown = sessionStorage.getItem('quantum_celebration_shown');
    if (hasCompletedCourse && !alreadyShown) {
      sessionStorage.setItem('quantum_celebration_shown', 'true');
      return true;
    }
    return false;
  });

  // Subscribe to external store transitions for dynamic in-session completion
  useEffect(() => {
    const unsub = useQuantumStore.subscribe((state, prev) => {
      const justCompleted =
        (state.completedMissions.includes(6) && !prev.completedMissions.includes(6)) ||
        (state.isSandboxUnlocked && !prev.isSandboxUnlocked);
      if (justCompleted) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('quantum_celebration_shown', 'true');
        }
        setIsOpen(true);
      }
    });
    return unsub;
  }, []);

  // Fire celebratory multi-stage confetti
  useEffect(() => {
    if (!isOpen) return;

    try {
      const colors = ['#00f3ff', '#a855f7', '#10b981', '#f59e0b'];
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors,
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.5 },
          colors,
        });
      }, 350);

      return () => clearTimeout(timer);
    } catch (_err) {
      // Safe fallback if canvas is not available
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-lg p-6 rounded-2xl hud-panel glow-cyan flex flex-col gap-5 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label={t('celebration.close_aria')}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Milestone Badge */}
        <div className="mx-auto w-14 h-14 rounded-2xl hud-badge-cyan flex items-center justify-center shadow-inner">
          <Trophy className="w-7 h-7 text-quantum-cyan animate-pulse" />
        </div>

        <div>
          <span className="text-xs telemetry-mono font-semibold text-quantum-cyan uppercase tracking-wider">
            {t('celebration.curriculum_complete')}
          </span>
          <h2 className="text-xl font-bold text-foreground mt-1 tracking-tight">
            {t('celebration.mastery_title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            {t('celebration.mastery_body')}{" "}
            Bloch sphere superposition to Shor&apos;s factorization and 3-qubit error correction.
          </p>
        </div>

        {/* Unlock Perk Box */}
        <div className="p-3.5 rounded-xl bg-surface-2 border border-border text-left flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-quantum-purple shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-foreground">{t('celebration.sandbox_unlocked')}</span>
            <p className="text-muted-foreground mt-0.5">
              {t('celebration.sandbox_body')}{" "} real-time cryogenic thermal sweeps (15 mK – 300 K), and zero mission constraints.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-2 rounded-xl text-xs telemetry-mono font-semibold bg-surface-2 hover:bg-surface-3 text-muted-foreground border border-border transition-colors cursor-pointer"
          >
            {t('celebration.review_roadmap')}
          </button>
          <button
            type="button"
            onClick={() => {
              useQuantumStore.getState().setAppViewState('SANDBOX');
              setIsOpen(false);
            }}
            className="flex-1 px-4 py-2 rounded-xl text-xs telemetry-mono font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-1.5 glow-cyan transition-all active:scale-95 cursor-pointer"
          >
            {t('celebration.enter_sandbox')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}