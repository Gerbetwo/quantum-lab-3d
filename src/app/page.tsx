'use client';

import React from 'react';
import Link from 'next/link';
import { MissionRoadmap } from '@/features/missions/MissionRoadmap';
import { CelebrationModal } from '@/components/ui/CelebrationModal';
import { Sparkles, ArrowRight, Atom, ThermometerSnowflake, Binary, Beaker } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center bg-background text-foreground overflow-y-auto px-4 py-8 md:py-12 gap-10">
      {/* Course Completion Confetti Modal */}
      <CelebrationModal />

      {/* Hero Section */}
      <section className="text-center max-w-3xl flex flex-col items-center gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" /> Interactive 3D Quantum Learning Platform
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
          Master Quantum Computing{' '}
          <span className="bg-gradient-to-r from-cyan via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            in Real-Time 3D
          </span>
        </h1>

        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
          Move beyond abstract linear algebra matrices. Explore quantum states through interactive Bloch spheres,
          test zero-spoiler Born rule predictions, model cryogenic thermal decoherence, and factor numbers with Shor&apos;s algorithm.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/missions/superposition"
            className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-cyan hover:bg-cyan/90 text-background flex items-center gap-2 shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all active:scale-95"
          >
            Start Mission 0: Superposition <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/sandbox"
            className="px-5 py-2.5 rounded-xl text-xs font-mono font-semibold bg-surface-2 hover:bg-surface-3 text-foreground border border-edge flex items-center gap-2 transition-all active:scale-95"
          >
            <Beaker className="w-4 h-4 text-purple-400" /> Open Sandbox Lab
          </Link>
        </div>
      </section>

      {/* Core Learning Outcomes Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl w-full">
        <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/30 flex items-center justify-center text-cyan">
            <Atom className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Geometric 3D Intuition</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Manipulate state vectors on the Bloch sphere with continuous spherical rotation and smooth Great Circle arc transitions.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Binary className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Zero-Spoiler Predictions</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Formulate Born rule probability hypotheses before measurement triggers irreversible quantum state collapse.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ThermometerSnowflake className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Cryogenic Physics (15 mK – 300 K)</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Experience environmental thermal decoherence and observe how coherence time $T_2(T)$ decays exponentially.
          </p>
        </div>
      </section>

      {/* Level Progression Roadmap Grid */}
      <section className="w-full">
        <MissionRoadmap />
      </section>
    </div>
  );
}