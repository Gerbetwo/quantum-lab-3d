import { LeanLabLayout } from '@/components/AppLayout';
import { MISSIONS, MissionDefinition } from '@/features/quantum-core/quantum-missions-core';
import { MissionRegistry } from '@/features/quantum-core/quantum-ui-components';
import { isMissionId, getMissionById } from '@/store/useQuantumStore';

import { notFound } from 'next/navigation';

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
  const mission = isMissionId(id) ? getMissionById(id) : null;

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
  
  if (!isMissionId(id)) {
    notFound();
  }

  const mission = getMissionById(id);

  if (!mission) {
    notFound();
  }

  return (
    <LeanLabLayout>
      <MissionRegistry missionId={id} />
    </LeanLabLayout>
  );
}