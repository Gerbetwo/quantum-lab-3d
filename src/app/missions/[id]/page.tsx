import {
  MISSIONS,
  type MissionDefinition,
  isMissionId,
  getMissionById,
} from '@/features/missions/missionRegistry';
import { MissionWorkspace } from '@/features/missions/MissionWorkspace';
import { notFound } from 'next/navigation';
import { MissionLauncher } from './MissionLauncher';

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
    <>
      <MissionLauncher missionId={id} />
      <MissionWorkspace missionId={id} />
    </>
  );
}