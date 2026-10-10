'use client';

import Link from 'next/link';
import { MISSIONS, type MissionDefinition } from '@/features/missions/config/missions';
import LeanLabLayout from '@/shared/layout/LeanLabLayout';
import { PageContainer } from '@/shared/layout/PageContainer';
import { PageHeader } from '@/shared/layout/PageHeader';
import { useSession } from '@/features/session/components/SessionProvider';
import { CheckCircle2, Lock, PlayCircle } from 'lucide-react';

export default function LearnPage() {
  const { session, isHydrated } = useSession();
  const completedIds = session?.completed || [];

  return (
    <LeanLabLayout>
      <PageContainer className="py-8">
        <PageHeader
          title="Quantum Learning Modules"
          description="Select a mission to explore interactive concepts through 3D simulations and guided modules."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {MISSIONS.map((mission: MissionDefinition, index: number) => {
            const isCompleted = isHydrated && completedIds.includes(mission.id);
            const prereqs = mission.prerequisites || [];
            const isUnlocked = !isHydrated || index === 0 || prereqs.every((p) => completedIds.includes(p));

            return (
              <div
                key={mission.id}
                className={`group flex flex-col justify-between p-6 rounded-2xl border transition-all duration-350 ${
                  isUnlocked
                    ? 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/60'
                    : 'bg-slate-950/40 border-slate-900/80 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono px-2.5 py-1 bg-cyan-950/80 text-cyan-400 rounded-md border border-cyan-800/40">
                      Mission {index + 1}
                    </span>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium" role="status" aria-label="Completed">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </span>
                    ) : isUnlocked ? (
                      <span className="flex items-center gap-1 text-xs text-cyan-400 font-medium" role="status" aria-label="Available">
                        <PlayCircle className="w-4 h-4" /> Available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-slate-500 font-medium" role="status" aria-label="Locked">
                        <Lock className="w-4 h-4" /> Locked
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-4 group-hover:text-cyan-300 transition-colors">
                    {mission.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {mission.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  {isUnlocked ? (
                    <Link
                      href={`/missions/${mission.id}`}
                      className="text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded"
                    >
                      {isCompleted ? 'Review Mission' : 'Start Mission'} &rarr;
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 cursor-not-allowed">
                      Prerequisite Required
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </LeanLabLayout>
  );
}
