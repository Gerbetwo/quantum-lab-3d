/**
 * Canonical Mission Registry for QuantumLab 3D
 */

export type MissionGroup = 'core' | 'sandbox';

export type MissionId =
  | 'superposition'
  | 'entanglement'
  | 'decoherence'
  | 'applications'
  | 'gates'
  | 'grover'
  | 'error-correction';

export interface MissionDefinition {
  id: MissionId;
  title: string;
  subtitle: string;
  description: string;
  group: MissionGroup;
  order: number;
  icon?: string;
}

export const MISSIONS: readonly MissionDefinition[] = [
  {
    id: 'superposition',
    title: '1. Superposición Cuántica',
    subtitle: 'El estado base del qubit',
    description: 'Explora cómo un qubit puede existir simultáneamente en |0⟩ y |1⟩.',
    group: 'core',
    order: 1,
  },
  {
    id: 'entanglement',
    title: '2. Entrelazamiento Cuántico',
    subtitle: 'Estados Bell y no-localidad',
    description: 'Comprende la correlación instantánea entre qubits entrelazados.',
    group: 'core',
    order: 2,
  },
  {
    id: 'decoherence',
    title: '3. Decoherecia y Ruido',
    subtitle: 'Interacción con el entorno',
    description: 'Observa cómo la pérdida de fase destruye la superposición.',
    group: 'core',
    order: 3,
  },
  {
    id: 'applications',
    title: '4. Aplicaciones Cuánticas',
    subtitle: 'Criptografía y Teletransportación',
    description: 'Aplica los principios cuánticos a protocolos de comunicación.',
    group: 'core',
    order: 4,
  },
  {
    id: 'gates',
    title: 'Puertas lógicas',
    subtitle: 'Sandbox Avanzado',
    description: 'Manipula las puertas Pauli, Hadamard y CNOT directamente.',
    group: 'sandbox',
    order: 5,
  },
  {
    id: 'grover',
    title: 'Algoritmo de Grover',
    subtitle: 'Búsqueda Cuántica',
    description: 'Aceleración cuadrática para búsqueda en bases no estructuradas.',
    group: 'sandbox',
    order: 6,
  },
  {
    id: 'error-correction',
    title: 'Corrección de Errores',
    subtitle: 'Qubits lógicos',
    description: 'Protección contra el ruido mediante redundancia cuántica.',
    group: 'sandbox',
    order: 7,
  },
];

export const CORE_MISSION_IDS: readonly MissionId[] = MISSIONS
  .filter(m => m.group === 'core')
  .map(m => m.id);

export function getCoreMissions(): MissionDefinition[] {
  return MISSIONS.filter(m => m.group === 'core').sort((a, b) => a.order - b.order);
}

export function getSandboxMissions(): MissionDefinition[] {
  return MISSIONS.filter(m => m.group === 'sandbox').sort((a, b) => a.order - b.order);
}

export function getMissionById(id: string): MissionDefinition | undefined {
  return MISSIONS.find(m => m.id === id);
}

export function isMissionId(val: unknown): val is MissionId {
  return typeof val === 'string' && MISSIONS.some(m => m.id === val);
}


export function isMainJourneyComplete(completed: string[] | Set<string> | Record<string, boolean>): boolean {
  const coreIds = ['superposition', 'entanglement', 'decoherence', 'applications'];
  if (Array.isArray(completed)) {
    return coreIds.every((id) => completed.includes(id));
  }
  if (completed instanceof Set) {
    return coreIds.every((id) => completed.has(id));
  }
  if (completed && typeof completed === 'object') {
    return coreIds.every((id) => Boolean(completed[id]));
  }
  return false;
}

export const missions = MISSIONS;
