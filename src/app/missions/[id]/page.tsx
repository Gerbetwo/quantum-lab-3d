import { notFound } from 'next/navigation';
import { MISSIONS, type MissionDefinition } from '@/features/missions/config/missions';
import { MissionShell } from '@/features/missions/components/MissionShell';
import { MissionRegistry } from '@/features/missions/components/MissionRegistry';
import LeanLabLayout from '@/shared/layout/LeanLabLayout';

interface MissionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return MISSIONS.map((m: MissionDefinition) => ({
    id: m.id,
  }));
}

export async function generateMetadata({ params }: MissionPageProps) {
  const { id } = await params;
  const mission = MISSIONS.find((m: MissionDefinition) => m.id === id);

  if (!mission) {
    return { title: 'Misión No Encontrada | Quantum Lab 3D' };
  }

  return {
    title: `${mission.title} | Quantum Lab 3D`,
    description: mission.description,
  };
}

export default async function MissionPage({ params }: MissionPageProps) {
  const { id } = await params;
  const mission = MISSIONS.find((m: MissionDefinition) => m.id === id);

  if (!mission) {
    notFound();
  }

  return (
    <LeanLabLayout>
      <MissionShell mission={mission}>
        <MissionRegistry missionId={mission.id} />
      </MissionShell>
    </LeanLabLayout>
  );
}
