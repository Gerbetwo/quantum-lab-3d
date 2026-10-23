/**
 * QuantumLab 3D - Tab Objective Evaluation Engine
 * Evaluates completion criteria for all 7 quantum concept tabs using pure math.
 */

export interface QuantumObjectiveContext {
  state?: { theta: number; phi: number };
  gateCount?: number;
  totalShots?: number;
  observedP0?: number;
  expectedP0?: number;
  phasePhi?: number;
  entangledPair?: { alice: number; bob: number } | null;
  groverTargetProb?: number;
  temperature?: number;
  purity?: number;
  qecSyndrome?: number;
  qecErrorIndex?: number;
  qecCorrectedTriple?: [number, number, number];
}

export interface QuantumObjective {
  id: string;
  tabIndex: number;
  titleKey: string;
  descKey: string;
  criteriaText: string;
  check: (context: QuantumObjectiveContext) => boolean;
}

export const OBJECTIVES: QuantumObjective[] = [
  {
    id: 'superposition',
    tabIndex: 0,
    titleKey: 'goals.superposition.title',
    descKey: 'goals.superposition.desc',
    criteriaText: 'Reach state |1⟩ in ≤ 2 gates (θ > π - 0.035 rad)',
    check: (ctx) => {
      if (!ctx.state) return false;
      const isAtSouthPole = ctx.state.theta >= Math.PI - 0.035;
      const withinGateLimit = ctx.gateCount !== undefined ? ctx.gateCount <= 2 : true;
      return isAtSouthPole && withinGateLimit;
    },
  },
  {
    id: 'measurement',
    tabIndex: 1,
    titleKey: 'goals.measurement.title',
    descKey: 'goals.measurement.desc',
    criteriaText: 'Collect 100 shots matching Born rule P(|0⟩) = cos²(θ/2)',
    check: (ctx) => {
      const shots = ctx.totalShots ?? 0;
      if (shots < 100) return false;
      if (ctx.observedP0 === undefined || ctx.expectedP0 === undefined) return false;
      return Math.abs(ctx.observedP0 - ctx.expectedP0) <= 0.12;
    },
  },
  {
    id: 'interferometer',
    tabIndex: 2,
    titleKey: 'goals.gates.title',
    descKey: 'goals.gates.desc',
    criteriaText: 'Set lower-arm phase φ = π for total destructive interference (Pd = 0)',
    check: (ctx) => {
      const phi = ctx.phasePhi ?? ctx.state?.phi;
      if (phi === undefined) return false;
      const diff = Math.abs(phi - Math.PI) % (2 * Math.PI);
      const angleDistance = diff > Math.PI ? 2 * Math.PI - diff : diff;
      return angleDistance <= 0.05;
    },
  },
  {
    id: 'entanglement',
    tabIndex: 3,
    titleKey: 'goals.entanglement.title',
    descKey: 'goals.entanglement.desc',
    criteriaText: 'Collapse Alice & Bob to |11⟩',
    check: (ctx) => {
      if (!ctx.entangledPair) return false;
      return ctx.entangledPair.alice === 1 && ctx.entangledPair.bob === 1;
    },
  },
  {
    id: 'decoherence',
    tabIndex: 4,
    titleKey: 'goals.decoherence.title',
    descKey: 'goals.decoherence.desc',
    criteriaText: 'Maintain purity > 80% by tuning cryostat temperature (T ≤ 15 mK)',
    check: (ctx) => {
      const temp = ctx.temperature ?? 15;
      const purity = ctx.purity ?? 1;
      return temp <= 15 && purity > 0.8;
    },
  },
  {
    id: 'grover',
    tabIndex: 5,
    titleKey: 'goals.grover.title',
    descKey: 'goals.grover.desc',
    criteriaText: 'Amplify target amplitude to over 90% (|a_target|² > 0.90)',
    check: (ctx) => {
      if (ctx.groverTargetProb === undefined) return false;
      return ctx.groverTargetProb > 0.9;
    },
  },
  {
    id: 'qec',
    tabIndex: 6,
    titleKey: 'goals.qec.title',
    descKey: 'goals.qec.desc',
    criteriaText: 'Detect and repair a bit flip on Qubit 2 using syndrome diagnostics',
    check: (ctx) => {
      // Syndrome 2 corresponds to error on qubit 2 (or index 1/2) and corrected
      const hasErrorOrSyndrome = ctx.qecSyndrome === 2 || ctx.qecErrorIndex === 2 || ctx.qecErrorIndex === 1;
      const isCorrected = ctx.qecCorrectedTriple ? ctx.qecCorrectedTriple[0] === ctx.qecCorrectedTriple[1] : true;
      return hasErrorOrSyndrome && isCorrected;
    },
  },
];

export function getObjectiveById(id: string): QuantumObjective | undefined {
  return OBJECTIVES.find((o) => o.id === id);
}

export function getObjectiveByTabIndex(tabIndex: number): QuantumObjective | undefined {
  return OBJECTIVES.find((o) => o.tabIndex === tabIndex);
}

export function evaluateObjective(
  objectiveOrId: string | QuantumObjective,
  context: QuantumObjectiveContext
): boolean {
  const objective = typeof objectiveOrId === 'string' ? getObjectiveById(objectiveOrId) : objectiveOrId;
  if (!objective) return false;
  return objective.check(context);
}
