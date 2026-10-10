'use client';

import Link from 'next/link';
import { useSession } from '@/features/session/components/SessionProvider';
import { MISSIONS } from '@/features/missions/config/missions';

export function HomeDashboard() {
  const { session, isHydrated } = useSession();
  const completedIds = session?.completed || [];
  const hasProgress = isHydrated && completedIds.length > 0;

  let targetMissionId = session?.activeMission || MISSIONS[0].id;
  if (isHydrated) {
    const nextIncomplete = MISSIONS.find((m) => !completedIds.includes(m.id));
    if (nextIncomplete) {
      targetMissionId = nextIncomplete.id;
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <section className="text-center mx-auto px-4 max-w-4xl">
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-indigo-500 tracking-tighter leading-tight drop-shadow-[0_0_40px_rgba(6,182,212,0.25)]">
          Quantum computing, through experimentation
        </h1>
        
        <p className="text-xl sm:text-2xl text-muted-foreground font-normal max-w-2xl mx-auto mt-6 leading-relaxed">
          Explore quantum states through interactive 3D simulations, superposition, entanglement, and thermal decoherence.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-8">
          <Link
            href={`/missions/${targetMissionId}`}
            className="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            {hasProgress ? 'Continue Journey' : 'Start Journey'} &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
