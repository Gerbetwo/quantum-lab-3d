'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from '@/hooks/useSession';
import { getCoreMissions, MissionId, isMainJourneyComplete } from '@/config/missions';

const SuperpositionMission = dynamic(
  () => import('@/components/missions/Mission1Superposition'),
  {
    loading: () => <div className="p-8 text-center text-slate-400">Cargando Misión 1...</div>,
  }
);

const EntanglementMission = dynamic(
  () => import('@/components/missions/Mission2Entanglement'),
  {
    loading: () => <div className="p-8 text-center text-slate-400">Cargando Misión 2...</div>,
  }
);

const DecoherenceMission = dynamic(
  () => import('@/components/missions/Mission3Decoherence'),
  {
    loading: () => <div className="p-8 text-center text-slate-400">Cargando Misión 3...</div>,
  }
);

const ApplicationsMission = dynamic(
  () => import('@/components/missions/Mission4Applications'),
  {
    loading: () => <div className="p-8 text-center text-slate-400">Cargando Misión 4...</div>,
  }
);

export default function HomePage() {
  const { session, isHydrated, setActiveMission, completeMission, recordTime, isUnlocked } = useSession();
  const coreMissions = getCoreMissions();

  const activeMissionId: MissionId =
    session.activeMission && coreMissions.some((m) => m.id === session.activeMission)
      ? session.activeMission
      : 'superposition';

  useEffect(() => {
    if (!isHydrated || !activeMissionId) return;
    const interval = setInterval(() => {
      recordTime(activeMissionId, 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isHydrated, activeMissionId, recordTime]);

  const journeyFinished = isMainJourneyComplete(session.completed);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              QuantumLab 3D
            </h1>
            <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full font-mono">
              v0.3.1
            </span>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto py-1">
            {coreMissions.map((m) => {
              const unlocked = isUnlocked(m.id);
              const completed = session.completed.includes(m.id);
              const isActive = activeMissionId === m.id;

              return (
                <button
                  key={m.id}
                  disabled={!unlocked}
                  onClick={() => setActiveMission(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : unlocked
                        ? 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                        : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800/40'
                  }`}
                >
                  {completed && <span className="text-emerald-400 font-bold">✓</span>}
                  <span>{m.title}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/sandbox"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md transition"
              data-testid="open-lab-btn"
            >
              Abrir Laboratorio
            </a>
          </div>
        </div>
      </header>

      <section className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {journeyFinished && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-200 text-sm flex items-center justify-between">
            <span>
              🎉 ¡Felicidades! Has completado el recorrido principal de aprendizaje cuántico.
            </span>
            <a
              href="/sandbox"
              className="underline font-bold text-emerald-300 hover:text-white"
            >
              Explorar Sandbox Avanzado &rarr;
            </a>
          </div>
        )}

        {activeMissionId === 'superposition' && (
          <SuperpositionMission onComplete={() => completeMission('superposition')} />
        )}
        {activeMissionId === 'entanglement' && (
          <EntanglementMission
            onComplete={() => completeMission('entanglement')}
            onBack={() => setActiveMission('superposition')}
          />
        )}
        {activeMissionId === 'decoherence' && (
          <DecoherenceMission
            onComplete={() => completeMission('decoherence')}
            onBack={() => setActiveMission('entanglement')}
          />
        )}
        {activeMissionId === 'applications' && (
          <ApplicationsMission
            onFinishAll={() => completeMission('applications')}
            onBack={() => setActiveMission('decoherence')}
          />
        )}
      </section>
    </main>
  );
}
