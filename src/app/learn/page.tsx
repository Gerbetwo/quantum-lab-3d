'use client';

import Link from 'next/link';
import { CheckCircle2, Lock, PlayCircle } from 'lucide-react';

import type { ReactNode } from 'react';
import { PageContainer, PageHeader } from '@/components/AppLayout';
import { useSession } from '@/archive/legacy-store-telemetry';
import { MISSIONS, type MissionDefinition } from '@/features/quantum-core/quantum-missions-core';

function CardWrapper({
  href,
  className,
  children,
}: {
  href?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
}


export default function LearnPage() {
  const { session, isHydrated } = useSession();
  const completedIds = session?.completed || [];

  return (
    <PageContainer className="py-8">
        <PageHeader
          title="Quantum Learning Modules"
          description="Select a mission to explore interactive concepts through 3D simulations and guided modules."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {MISSIONS.map((mission: MissionDefinition, index: number) => {
            const isCompleted = isHydrated && completedIds.includes(mission.id);
            const prereqs = mission.prerequisites || [];
            const isUnlocked = !isHydrated || index === 0 || prereqs.every((p: any) => completedIds.includes(p));
            const cardProps = isUnlocked ? { href: `/missions/${mission.id}` } : {};

            return (
              <CardWrapper
                key={mission.id}
                {...cardProps}
                className={`group flex flex-col justify-between p-6 rounded-2xl border transition-all duration-350 focus:outline-none focus:ring-2 focus:ring-ring-subtle ${
                  isUnlocked
                    ? 'bg-background-70 border-border hover:border-accent-glow hover:bg-card-60 cursor-pointer'
                    : 'bg-background-40 border-border-80 opacity-60 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono px-2.5 py-1 bg-accent-subtle text-accent rounded-md border border-accent-border">
                      Mission {index + 1}
                    </span>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-xs text-success font-medium" role="status" aria-label="Completed">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </span>
                    ) : isUnlocked ? (
                      <span className="flex items-center gap-1 text-xs text-accent font-medium" role="status" aria-label="Available">
                        <PlayCircle className="w-4 h-4" /> Available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium" role="status" aria-label="Locked">
                        <Lock className="w-4 h-4" /> Locked
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mt-4 group-hover:text-accent transition-colors">
                    {mission.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                    {mission.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border-60 flex items-center justify-between">
                  {isUnlocked ? (
                    <span className="text-xs font-semibold text-accent group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      {isCompleted ? 'Review Mission' : 'Start Mission'} &rarr;
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      Prerequisite Required
                    </span>
                  )}
                </div>
              </CardWrapper>
            );
          })}
        </div>
      </PageContainer>
  );
}