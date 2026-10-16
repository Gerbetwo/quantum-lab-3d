/**
 * Static Mission Registry & Initial Presets (Missions 0–6)
 * Pedagogical alignment: Pure configuration, zero runtime side-effects.
 */

export type MissionId =
  | 'superposition'
  | 'entanglement'
  | 'decoherence'
  | 'gates'
  | 'grover'
  | 'applications'
  | 'error-correction';

export const CORE_MISSION_IDS: readonly MissionId[] = [
  'superposition',
  'entanglement',
  'decoherence',
  'gates',
  'grover',
  'applications',
  'error-correction',
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
    id: 'entanglement',
    index: 1,
    order: 2,
    title: '2. Entrelazamiento Cuántico',
    subtitle: 'Estados Bell y no-localidad',
    description: 'Comprende la correlación instantánea entre qubits entrelazados en el estado |Φ⁺⟩.',
    learningObjective: 'Preparar un par Bell y verificar el colapso correlacionado idéntico entre Alice y Bob.',
    prerequisites: ['superposition'],
    initialTheta: Math.PI / 2,
    initialPhi: 0,
    initialTemperatureK: 0.015,
    theta: Math.PI / 2,
    phi: 0,
    temperatureK: 0.015,
  },
  {
    id: 'decoherence',
    index: 2,
    order: 3,
    title: '3. Decoherencia y Ruido',
    subtitle: 'Interacción con el entorno térmico',
    description: 'Experimenta cómo la temperatura acelera la pérdida de coherencia cuántica (T₂).',
    learningObjective: 'Comprender la necesidad del enfriamiento criogénico (15 mK) en computadores cuánticos.',
    prerequisites: ['superposition'],
    initialTheta: Math.PI / 2,
    initialPhi: 0,
    initialTemperatureK: 0.015,
    theta: Math.PI / 2,
    phi: 0,
    temperatureK: 0.015,
  },
  {
    id: 'gates',
    index: 3,
    order: 4,
    title: '4. Puertas Cuánticas',
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
    id: 'grover',
    index: 4,
    order: 5,
    title: '5. Algoritmo de Grover',
    subtitle: 'Amplificación de amplitud en búsqueda',
    description: 'Acelera cuadráticamente la búsqueda en bases no estructuradas mediante oráculo y difusión.',
    learningObjective: 'Observar cómo la inversión sobre la media amplifica la probabilidad del estado objetivo.',
    prerequisites: ['gates'],
    initialTheta: Math.PI / 2,
    initialPhi: 0,
    initialTemperatureK: 0.015,
    theta: Math.PI / 2,
    phi: 0,
    temperatureK: 0.015,
  },
  {
    id: 'applications',
    index: 5,
    order: 6,
    title: '6. Factorización de Shor',
    subtitle: 'Algoritmo de Shor (N = 15)',
    description: 'Factorización didáctica de N = 15 con bases coprimas a ∈ {2, 7, 8, 11, 13}.',
    learningObjective: 'Encontrar el período r de aˣ mod 15 y deducir los factores primos gcd(a^(r/2) ± 1, 15).',
    prerequisites: ['gates'],
    initialTheta: 0,
    initialPhi: 0,
    initialTemperatureK: 0.015,
    theta: 0,
    phi: 0,
    temperatureK: 0.015,
  },
  {
    id: 'error-correction',
    index: 6,
    order: 7,
    title: '7. Corrección de Errores',
    subtitle: 'Código de repetición de 3 qubits',
    description: 'Protección contra bit-flips mediante codificación lógica |ψ⟩ → α|000⟩ + β|111⟩.',
    learningObjective: 'Medir el síndrome de paridad y recuperar el estado original con 100% de fidelidad.',
    prerequisites: ['entanglement', 'gates'],
    initialTheta: 0,
    initialPhi: 0,
    initialTemperatureK: 0.015,
    theta: 0,
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
