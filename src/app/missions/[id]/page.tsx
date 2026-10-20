import {
  MISSIONS,
  type MissionDefinition,
  isMissionId,
  getMissionById,
} from '@/features/missions/missionRegistry';
import { MissionWorkspace } from '@/features/missions/MissionWorkspace';
import { Mission01StateVector } from '@/components/missions/Mission01StateVector';
import { Mission02GateRotations } from '@/components/missions/Mission02GateRotations';
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

  if (id === 'superposition') {
    return <Mission01StateVector />;
  }

  if (id === 'gates') {
    return <Mission02GateRotations />;
  }

  return <MissionWorkspace missionId={id} />;
}
