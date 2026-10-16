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

export interface MissionConfig {
  id: MissionId;
  index: number;
  title: string;
  subtitle: string;
  initialTheta: number;
  initialPhi: number;
  initialTemperatureK: number;
  theta: number;
  phi: number;
  temperatureK: number;
}

export const MISSION_CONFIGS: readonly MissionConfig[] = [
  {
    id: 'superposition',
    index: 0,
    title: '1. Superposición Cuántica',
    subtitle: 'El estado base del qubit',
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
    title: '2. Entrelazamiento Cuántico',
    subtitle: 'Estados Bell y no-localidad',
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
    title: '3. Decoherencia y Ruido',
    subtitle: 'Interacción con el entorno térmico',
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
    title: '4. Puertas Cuánticas',
    subtitle: 'Operaciones unitarias sobre qubits',
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
    title: '5. Algoritmo de Grover',
    subtitle: 'Amplificación de amplitud en búsqueda',
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
    title: '6. Factorización de Shor',
    subtitle: 'Algoritmo de Shor (N = 15)',
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
    title: '7. Corrección de Errores',
    subtitle: 'Código de repetición de 3 qubits',
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
