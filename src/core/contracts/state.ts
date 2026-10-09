/**
 * Fase 4 - Internal API contracts.
 *
 * This module freezes the interface surface between the lab state, the
 * pure quantum engine, and the audio-visual engine, decoupling them for
 * the aggressive refactor planned for Fase 5.
 *
 * Nothing here contains runtime implementation. Only types and JSDoc.
 *
 * Consumers to migrate (Fase 5):
 *   - src/app/lab/page.tsx        -> LabState + QuantumEngineContract
 *   - src/hooks/useMeasurementBurst.ts -> AudioVisualEngineContract
 *   - src/lib/sound.ts            -> AudioVisualEngineContract
 *   - src/core/quantum/*        -> QuantumEngineContract (adapter only)
 */

import type {
  GateType,
  QubitIndex,
  QuantumCircuit,
  StateVectorHistory,
} from '@/core/quantum/circuit';
import type { StateVector } from '@/core/quantum/statevector';
import type { QubitMeasurementResult } from '@/core/quantum/measurement';

// ---------------------------------------------------------------------------
// Shared enums / literals
// ---------------------------------------------------------------------------

export type ViewMode = 'bloch' | 'histogram' | 'phase-disk';
export type PresetName = 'ghz6' | 'teleportation3' | 'qft3';

// ---------------------------------------------------------------------------
// Lab events (discriminated union)
// ---------------------------------------------------------------------------

export type LabEvent =
  | { readonly type: 'GATE_PLACED';       readonly step: number;   readonly qubit: QubitIndex; readonly gate: GateType }
  | { readonly type: 'GATE_REMOVED';      readonly gateId: string }
  | { readonly type: 'PLAYHEAD_SET';      readonly step: number }
  | { readonly type: 'VIEW_CHANGED';      readonly mode: ViewMode }
  | { readonly type: 'PRESET_LOADED';     readonly name: PresetName }
  | { readonly type: 'CIRCUIT_RUN' }
  | { readonly type: 'CIRCUIT_RESET' }
  | { readonly type: 'COLLAPSE_TRIGGERED'; readonly qubit: QubitIndex; readonly outcome: 0 | 1 };

// ---------------------------------------------------------------------------
// Lab state snapshot (immutable)
// ---------------------------------------------------------------------------

export interface LabSnapshot {
  readonly circuit: QuantumCircuit;
  readonly playhead: number;
  readonly viewMode: ViewMode;
  readonly activeGate: GateType | null;
  readonly commandPaletteOpen: boolean;
  readonly isDirty: boolean;
  readonly lastRunAt: number | null;
}

/**
 * The lab state machine.
 *
 * Contract:
 *   - `snapshot` is a frozen view of the current lab state.
 *   - `dispatch` accepts a `LabEvent` and returns nothing (side-effect).
 *   - `reset` returns the state to an empty 6-qubit, 16-step circuit.
 *
 * @future In Fase 5 this will be implemented by a reducer hook
 *         (`useLabReducer`) that wraps the pure quantum engine.
 */
export interface LabState {
  readonly snapshot: Readonly<LabSnapshot>;
  dispatch(event: LabEvent): void;
  reset(): void;
}

// ---------------------------------------------------------------------------
// Quantum engine contract
// ---------------------------------------------------------------------------

/**
 * Pure math API. Every method must be:
 *   - Referentially transparent: same input -> same output.
 *   - Non-mutating: input state vectors are never modified in place.
 *   - Free of Math.random / Date.now / window / document.
 *
 * Randomness is injected explicitly through the optional `rng` parameter.
 */
export interface QuantumEngineContract {
  evaluate(circuit: QuantumCircuit): StateVectorHistory;
  evaluateUpTo(circuit: QuantumCircuit, n: number): StateVector;
  measure(
    state: StateVector,
    target: number,
    nQubits: number,
    rng?: () => number,
  ): QubitMeasurementResult;
  norm(state: StateVector): number;
  probabilities(state: StateVector): number[];
}

// ---------------------------------------------------------------------------
// Audio-visual engine contract
// ---------------------------------------------------------------------------

/**
 * Audio + GPU particle API.
 *
 * Contract:
 *   - Every playback method is a safe no-op if audio is gated off or if
 *     the user has not interacted with the page yet.
 *   - `dispose()` must release: AudioContext (via close), WebGL contexts,
 *     InstancedMesh geometries and materials, and any registered listeners.
 *   - No method may be called before a user gesture (pointerdown / keydown).
 */
export interface AudioVisualEngineContract {
  playGatePlaced(): void;
  playMeasurementCollapse(qubit: number): void;
  playStepAdvance(): void;
  triggerParticleBurst(origin: [number, number, number], color: number, count: number): void;
  dispose(): void;
}
