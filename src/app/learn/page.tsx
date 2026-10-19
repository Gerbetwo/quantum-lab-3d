'use client';

import Link from 'next/link';
import { CheckCircle2, Lock, PlayCircle } from 'lucide-react';

import type { ReactNode } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/AppShell';
import { useQuantumStore } from '@/store/useQuantumStore';
import { MISSIONS, type MissionDefinition } from '@/features/missions/missionRegistry';

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
  const completedIds = useQuantumStore((s) => s.completedMissions ?? []);

  return (
    <PageContainer className="py-8">
      <PageHeader
        title="Quantum Learning Modules"
        description="Select a mission to explore interactive concepts through 3D simulations and guided modules."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {MISSIONS.map((mission: MissionDefinition, index: number) => {
          const isCompleted = completedIds.includes(mission.id) || completedIds.includes(index);
          const prereqs = mission.prerequisites || [];
          const isUnlocked = index === 0 || prereqs.every((p: string) => (completedIds as readonly string[]).includes(p));
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
                  <span className="text-xs font-semibold px-2.5 py-1 bg-surface-2 text-cyan border border-edge rounded-full font-mono">
                    Misión {mission.order}
                  </span>
                  {isCompleted ? (
                    <span className="flex items-center text-xs font-medium hud-badge-emerald px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Completada
                    </span>
                  ) : isUnlocked ? (
                    <span className="flex items-center text-xs font-medium hud-badge-cyan px-2 py-0.5 rounded-full">
                      <PlayCircle className="w-3.5 h-3.5 mr-1" /> Disponible
                    </span>
                  ) : (
                    <span className="flex items-center text-xs font-medium text-muted-foreground bg-surface-3 px-2 py-0.5 rounded-full">
                      <Lock className="w-3.5 h-3.5 mr-1" /> Bloqueada
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-foreground mt-4 group-hover:text-cyan transition-colors">
                  {mission.title}
                </h3>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  {mission.subtitle}
                </p>
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                  {mission.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">
                  Presets: θ={(mission.initialTheta / Math.PI).toFixed(2)}π
                </span>
                <span className="text-xs font-semibold text-cyan group-hover:translate-x-0.5 transition-transform">
                  Comenzar →
                </span>
              </div>
            </CardWrapper>
          );
        })}
      </div>
    </PageContainer>
  );
}