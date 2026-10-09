import Link from 'next/link';
import { MISSIONS, type MissionDefinition } from '@/features/missions/config/missions';
import LeanLabLayout from '@/shared/layout/LeanLabLayout';
import { PageContainer } from '@/shared/layout/PageContainer';
import { PageHeader } from '@/shared/layout/PageHeader';

export default function LearnPage() {
  return (
    <LeanLabLayout>
      <PageContainer className="py-8">
        <PageHeader
          title="Módulos de Aprendizaje Cuántico"
          description="Selecciona una misión para explorar conceptos interactivos mediante simulaciones 3D."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {MISSIONS.map((mission: MissionDefinition, index: number) => (
            <Link
              key={mission.id}
              href={`/missions/${mission.id}`}
              className="group flex flex-col justify-between p-6 bg-slate-900/70 border border-slate-800 rounded-2xl hover:border-cyan-500/50 hover:bg-slate-800/60 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2.5 py-1 bg-cyan-950/80 text-cyan-400 rounded-md border border-cyan-800/40">
                    Misión {index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 mt-4 group-hover:text-cyan-300 transition-colors">
                  {mission.title}
                </h3>
                <p className="text-sm text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {mission.description}
                </p>
              </div>

              <div className="mt-6 flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                Iniciar Misión &rarr;
              </div>
            </Link>
          ))}
        </div>
      </PageContainer>
    </LeanLabLayout>
  );
}
