/**
 * Static Mission Registry & Initial Presets (Missions 0–6)
 * Pedagogical alignment: Pure configuration, zero runtime side-effects.
 */

export type MissionId =
  | 'superposition'
  | 'gates'
  | 'measurement'
  | 'interference'
  | 'entanglement'
  | 'decoherence'
  | 'grover'
  | 'applications'
  | 'error-correction';

export const CORE_MISSION_IDS: readonly MissionId[] = [
  'superposition',
  'gates',
  'measurement',
  'interference',
  'entanglement',
  'decoherence',
  'grover',
] as const;

export interface StepDefinition {
  id: string;
  phase: string;
  title: string;
  description: string;
}

export interface MissionConfig {
  id: MissionId;
  index: number;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  learningObjective: string;
  prerequisites: readonly MissionId[];
  initialTheta: number;
  initialPhi: number;
  initialTemperatureK: number;
  theta: number;
  phi: number;
  temperatureK: number;
  steps?: readonly StepDefinition[];
}

export type MissionDefinition = MissionConfig;

export const MISSION_CONFIGS: readonly MissionConfig[] = [
  {
    id: 'superposition',
    index: 0,
    order: 1,
    title: '1. Superposición Cuántica',
    subtitle: 'El estado base del qubit',
    description: 'Explora cómo un qubit puede existir simultáneamente en |0⟩ y |1⟩.',
    learningObjective: 'Distinguir el bit clásico del qubit y observar la superposición en la esfera de Bloch.',
    prerequisites: [],
    initialTheta: 0,
    initialPhi: 0,
    initialTemperatureK: 0.015,
    theta: 0,
    phi: 0,
    temperatureK: 0.015,
  },
  {
    id: 'gates',
    index: 1,
    order: 2,
    title: '2. Puertas Cuánticas',
    subtitle: 'Operaciones unitarias sobre qubits',
    description: 'Aplica rotaciones unitarias elementales (X, Y, Z, H, S, T) sobre la esfera de Bloch.',
    learningObjective: 'Dominar la geometría de las puertas de 1 qubit y sus matrices unitarias.',
    prerequisites: ['superposition'],
    initialTheta: 0,
    initialPhi: 0,
    initialTemperatureK: 0.015,
    theta: 0,
    phi: 0,
    temperatureK: 0.015,
  },
  {
    id: 'measurement',
    index: 2,
    order: 3,
    title: '3. Medición y Colapso',
    subtitle: 'Cámara de medición y Ley de Born',
    description: 'Observa el colapso probabilístico de la función de onda y verifica la regla de Born P₀ = cos²(θ/2).',
    learningObjective: 'Comprender la naturaleza probabilística de la medición cuántica y el colapso del vector de estado.',
    prerequisites: ['gates'],
    initialTheta: Math.PI / 2,
    initialPhi: 0,
    initialTemperatureK: 0.015,
    theta: Math.PI / 2,
    phi: 0,
    temperatureK: 0.015,
  },
  {
    id: 'interference',
    index: 3,
    order: 4,
    title: '4. Interferencia Cuántica',
    subtitle: 'Fase cuántica e interferómetro',
    description: 'Experimenta con la fase relativa φ y observa la interferencia constructiva y destructiva en dos caminos.',
    learningObjective: 'Dominar el concepto de fase cuántica relativa y su efecto en la interferencia de amplitudes.',
    prerequisites: ['measurement'],
    initialTheta: Math.PI / 2,
    initialPhi: 0,
    initialTemperatureK: 0.015,
    theta: Math.PI / 2,
    phi: 0,
    temperatureK: 0.015,
  },
  {
    id: 'entanglement',
    index: 4,
    order: 5,
    title: '5. Entrelazamiento Cuántico',
    subtitle: 'Estados Bell y no-localidad',
    description: 'Comprende la correlación instantánea entre qubits entrelazados en el estado |Φ⁺⟩.',
    learningObjective: 'Preparar un par Bell y verificar el colapso correlacionado idéntico entre Alice y Bob.',
    prerequisites: ['interference'],
    initialTheta: Math.PI / 2,
    initialPhi: 0,
    initialTemperatureK: 0.015,
    theta: Math.PI / 2,
    phi: 0,
    temperatureK: 0.015,
  },
  {
    id: 'decoherence',
    index: 5,
    order: 6,
    title: '6. Decoherencia y Ruido',
    subtitle: 'Interacción con el entorno térmico',
    description: 'Experimenta cómo la temperatura acelera la pérdida de coherencia cuántica (T₂).',
    learningObjective: 'Comprender la necesidad del enfriamiento criogénico (15 mK) en computadores cuánticos.',
    prerequisites: ['entanglement'],
    initialTheta: Math.PI / 2,
    initialPhi: 0,
    initialTemperatureK: 0.015,
    theta: Math.PI / 2,
    phi: 0,
    temperatureK: 0.015,
  },
  {
    id: 'grover',
    index: 6,
    order: 7,
    title: '7. Algoritmo de Grover',
    subtitle: 'Amplificación de amplitud en búsqueda',
    description: 'Acelera cuadráticamente la búsqueda en bases no estructuradas mediante oráculo y difusión.',
    learningObjective: 'Observar cómo la inversión sobre la media amplifica la probabilidad del estado objetivo.',
    prerequisites: ['decoherence'],
    initialTheta: Math.PI / 2,
    initialPhi: 0,
    initialTemperatureK: 0.015,
    theta: Math.PI / 2,
    phi: 0,
    temperatureK: 0.015,
  },
];

export const MISSIONS = Object.assign(
  [...MISSION_CONFIGS],
  Object.fromEntries(MISSION_CONFIGS.map((m) => [m.id, m]))
) as unknown as readonly MissionConfig[] & Record<MissionId, MissionConfig>;

export function isMissionId(id: unknown): id is MissionId {
  return typeof id === 'string' && CORE_MISSION_IDS.includes(id as MissionId);
}

export function getMissionById(id: string | number): MissionConfig | undefined {
  if (typeof id === 'number') {
    return MISSION_CONFIGS[id];
  }
  return MISSION_CONFIGS.find((m) => m.id === id);
}

export const TOTAL_MISSIONS = MISSION_CONFIGS.length;

export function getMissionIndex(id: string | number): number {
  if (typeof id === 'number') {
    return id >= 0 && id < MISSION_CONFIGS.length ? id : -1;
  }
  const config = getMissionById(id);
  return config ? config.index : -1;
}

export function isMissionUnlocked(missionIndex: number, completedMissions: readonly number[]): boolean {
  if (missionIndex === 0) return true;
  const config = getMissionById(missionIndex);
  if (!config) return false;
  return config.prerequisites.every((prereqId) => {
    const prereqIndex = getMissionIndex(prereqId);
    return completedMissions.includes(prereqIndex);
  });
}
