'use client';

import React, { useCallback, useState, lazy, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const Mission1Superposition = lazy(() => import('@/components/missions/Mission1Superposition'));
const Mission2Entanglement = lazy(() => import('@/components/missions/Mission2Entanglement'));
const Mission3Decoherence = lazy(() => import('@/components/missions/Mission3Decoherence'));
const Mission4Applications = lazy(() => import('@/components/missions/Mission4Applications'));
const Mission5Gates = lazy(() => import('@/components/missions/Mission5Gates'));

interface MissionEntry {
  id: number;
  label: string;
  short: string;
}

// Extend this array when Missions 5-7 ship in later phases.
const MISSIONS: MissionEntry[] = [
  { id: 0, label: 'Tarea 1', short: 'Superposicion' },
  { id: 1, label: 'Tarea 2', short: 'Entrelazamiento' },
  { id: 2, label: 'Tarea 3', short: 'Decoherencia' },
  { id: 3, label: 'Tarea 4', short: 'Aplicaciones' },
  { id: 4, label: 'Tarea 5', short: 'Compuertas' },
];

function Loading() {
  return (
    <div
      data-testid="sandbox-loading"
      className="flex-1 flex items-center justify-center py-16 text-slate-400"
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="w-6 h-6 animate-spin text-cyan" />
      <span className="ml-3 text-sm font-mono">Cargando modulo...</span>
    </div>
  );
}

export default function SandboxPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = useCallback(() => {
    setActiveIndex((i) => Math.min(i + 1, MISSIONS.length - 1));
  }, []);
  const goPrev = useCallback(() => {
    setActiveIndex((i) => Math.max(i - 1, 0));
  }, []);

  return (
    <main className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      <header className="sticky top-0 z-40 bg-[#070913]/90 backdrop-blur-md border-b border-edge/80 px-4 sm:px-6 lg:px-8 py-3">
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-surface-2 border border-edge text-slate-400 hover:text-white hover:bg-surface-3 transition-colors"
              aria-label="Volver al laboratorio"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-cyan" aria-hidden="true" />
              <span className="font-orbitron font-bold text-sm tracking-wider text-white">
                SANDBOX <span className="text-cyan text-xs font-mono font-normal">modo libre</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full">
        <div role="tablist" aria-label="Selector de misiones" className="flex items-center gap-2 mb-6 flex-wrap">
          {MISSIONS.map((m, i) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={i === activeIndex}
              onClick={() => setActiveIndex(i)}
              className={clsx(
                'px-4 py-2 rounded-xl text-xs font-orbitron font-bold tracking-wider border transition-all',
                i === activeIndex
                  ? 'bg-cyan text-slate-950 border-cyan shadow-md shadow-cyan/25'
                  : 'bg-surface-2 text-slate-300 border-edge hover:bg-surface-3'
              )}
            >
              {m.label}: {m.short}
            </button>
          ))}
        </div>

        <Suspense fallback={<Loading />}>
          {activeIndex === 0 && <Mission1Superposition onComplete={goNext} />}
          {activeIndex === 1 && <Mission2Entanglement onComplete={goNext} onBack={goPrev} />}
          {activeIndex === 2 && <Mission3Decoherence onComplete={goNext} onBack={goPrev} />}
          {activeIndex === 3 && <Mission4Applications onFinishAll={goNext} onBack={goPrev} />}
          {activeIndex === 4 && <Mission5Gates onComplete={goNext} onBack={goPrev} />}
        </Suspense>
      </div>
    </main>
  );
}
