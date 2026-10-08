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
  shortTitle: string;
  mode: 'core' | 'sandbox';
  order: number;
  description: string;
}

export const MISSIONS: MissionDefinition[] = [
  {
    id: 'superposition',
    title: '01 Superposición y Colapso',
    shortTitle: 'Superposición',
    mode: 'core',
    order: 1,
    description: 'Explora la esfera de Bloch y la probabilidad de colapso cuántico.'
  },
  {
    id: 'entanglement',
    title: '02 Entrelazamiento y Par de Bell',
    shortTitle: 'Entrelazamiento',
    mode: 'core',
    order: 2,
    description: 'Mide correlaciones no locales entre Alice y Bob sin canal superlumínico.'
  },
  {
    id: 'decoherence',
    title: '03 Decoherencia y Criogenia',
    shortTitle: 'Decoherencia',
    mode: 'core',
    order: 3,
    description: 'Analiza el impacto del ruido térmico en el tiempo de coherencia.'
  },
  {
    id: 'applications',
    title: '04 Aplicaciones y Límites',
    shortTitle: 'Aplicaciones',
    mode: 'core',
    order: 4,
    description: 'Simulación de algoritmos, optimización y criptografía (Shor N=15).'
  },
  {
    id: 'gates',
    title: 'Puertas Cuánticas',
    shortTitle: 'Gates',
    mode: 'sandbox',
    order: 5,
    description: 'Sandbox interactivo de puertas lógicas cuánticas.'
  },
  {
    id: 'grover',
    title: 'Búsqueda de Grover',
    shortTitle: 'Grover',
    mode: 'sandbox',
    order: 6,
    description: 'Algoritmo de amplificación de amplitud.'
  },
  {
    id: 'error-correction',
    title: 'Corrección de Errores',
    shortTitle: 'Error Correction',
    mode: 'sandbox',
    order: 7,
    description: 'Modelo didáctico de códigos de repetición.'
  }
];

export const getCoreMissions = () => MISSIONS.filter((m) => m.mode === 'core');
export const getSandboxMissions = () => MISSIONS.filter((m) => m.mode === 'sandbox');
export const getMission = (id: MissionId) => MISSIONS.find((m) => m.id === id);
