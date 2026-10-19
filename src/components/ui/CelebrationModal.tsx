'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useQuantumStore } from '@/store/useQuantumStore';
import { Sparkles, Trophy, ArrowRight, X } from 'lucide-react';

export function CelebrationModal() {
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
      <div className="relative w-full max-w-lg p-6 rounded-2xl border border-cyan/40 bg-card/95 shadow-[0_0_50px_rgba(0,243,255,0.2)] flex flex-col gap-5 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close celebration modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Milestone Badge */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan/20 to-purple-500/20 border border-cyan/40 flex items-center justify-center shadow-inner">
          <Trophy className="w-7 h-7 text-cyan animate-pulse" />
        </div>

        <div>
          <span className="text-xs font-mono font-semibold text-cyan uppercase tracking-wider">
            Curriculum Complete
          </span>
          <h2 className="text-xl font-bold text-foreground mt-1 tracking-tight">
            🎉 Quantum Mastery Achieved!
          </h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Congratulations! You have completed all 7 core missions of QuantumLab 3D—from single-qubit
            Bloch sphere superposition to Shor&apos;s factorization and 3-qubit error correction.
          </p>
        </div>

        {/* Unlock Perk Box */}
        <div className="p-3.5 rounded-xl bg-surface-2 border border-edge text-left flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-foreground">Sandbox Lab Unlocked</span>
            <p className="text-muted-foreground mt-0.5">
              Access the freeform workspace with continuous angle rotations, real-time cryogenic thermal sweeps (15 mK – 300 K), and zero mission constraints.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-surface-2 hover:bg-surface-3 text-muted-foreground border border-edge transition-colors"
          >
            Review Roadmap
          </button>
          <button
            type="button"
            onClick={() => {
              useQuantumStore.getState().setAppViewState('SANDBOX');
              setIsOpen(false);
            }}
            className="flex-1 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan hover:bg-cyan/90 text-background flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all active:scale-95 cursor-pointer"
          >
            Enter Sandbox Lab <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
