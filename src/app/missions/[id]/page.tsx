import {
  MISSIONS,
  type MissionDefinition,
  isMissionId,
  getMissionById,
} from '@/features/missions/missionRegistry';
import { Mission01StateVector } from '@/components/missions/Mission01StateVector';
import { Mission02GateRotations } from '@/components/missions/Mission02GateRotations';
import { Mission03Measurement } from '@/components/missions/Mission03Measurement';
import { Mission04Interference } from '@/components/missions/Mission04Interference';
import { Mission05Entanglement } from '@/components/missions/Mission05Entanglement';
import { Mission06Decoherence } from '@/components/missions/Mission06Decoherence';
import { Mission07GroverSearch } from '@/components/missions/Mission07GroverSearch';
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

  switch (id) {
    case 'superposition':
      return <Mission01StateVector />;
    case 'gates':
      return <Mission02GateRotations />;
    case 'measurement':
      return <Mission03Measurement missionId="measurement" />;
    case 'interference':
      return <Mission04Interference missionId="interference" />;
    case 'entanglement':
      return <Mission05Entanglement missionId="entanglement" />;
    case 'decoherence':
      return <Mission06Decoherence missionId="decoherence" />;
    case 'grover':
      return <Mission07GroverSearch missionId="grover" />;
    default:
      notFound();
  }
}
