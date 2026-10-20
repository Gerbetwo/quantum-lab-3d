import { create } from "zustand";

/**
 * Standard spatial element IDs known to the 3D scene and HUD.
 */
export type KnownSpatialId =
  | "theta-arc"
  | "bloch-polar-arc"
  | "phase-disk"
  | "bloch-azimuthal-line"
  | "gate-axis-x"
  | "gate-axis-y"
  | "gate-axis-z"
  | "gate-axis-h"
  | "state-vector"
  | "bloch-vector-tip-handle"
  | "north-pole"
  | "south-pole"
  | "basis-zero"
  | "basis-one"
  | "probability-p0"
  | "probability-p1"
  | "equator-ring"
  | "decoherence-envelope"
  | "measurement-chamber"
  | "collapse-ray"
  | "histogram-3d";

/**
 * Metadata mapping a 3D spatial element ID to HUD telemetry symbols and descriptions.
 */
export interface TelemetrySymbolMapping {
  /** Unique element identifier */
  id: string;
  /** Primary mathematical symbol displayed in the HUD */
  symbol: string;
  /** LaTeX notation for formulas and KaTeX rendering */
  latex: string;
  /** Human-readable label for accessibility and tooltips */
  label: string;
  /** Pedagogical description of the physical entity */
  description: string;
  /** Associated HUD section */
  hudSection?: "state-vector" | "born-probabilities" | "angles" | "cryo" | "gates";
}

/**
 * Comprehensive mapping table from 3D scene IDs to mathematical symbols.
 */
export const SPATIAL_TELEMETRY_MAP: Record<string, TelemetrySymbolMapping> = {
  "theta-arc": {
    id: "theta-arc",
    symbol: "θ",
    latex: "\\theta",
    label: "Polar Angle (θ)",
    description: "Controls superposition amplitudes α = cos(θ/2) and β = sin(θ/2)",
    hudSection: "angles",
  },
  "bloch-polar-arc": {
    id: "bloch-polar-arc",
    symbol: "θ",
    latex: "\\theta",
    label: "Polar Arc (θ)",
    description: "Polar trajectory arc connecting |0⟩ to the current state vector",
    hudSection: "angles",
  },
  "phase-disk": {
    id: "phase-disk",
    symbol: "φ",
    latex: "\\phi",
    label: "Azimuthal Phase (φ)",
    description: "Relative phase angle between basis states in e^{iφ}",
    hudSection: "angles",
  },
  "bloch-azimuthal-line": {
    id: "bloch-azimuthal-line",
    symbol: "φ",
    latex: "\\phi",
    label: "Azimuthal Line (φ)",
    description: "Equatorial phase projection line",
    hudSection: "angles",
  },
  "gate-axis-x": {
    id: "gate-axis-x",
    symbol: "X",
    latex: "\\hat{\\sigma}_x",
    label: "Pauli-X Gate Axis",
    description: "Bit-flip rotation axis π around X (maps |0⟩ ↔ |1⟩)",
    hudSection: "gates",
  },
  "gate-axis-y": {
    id: "gate-axis-y",
    symbol: "Y",
    latex: "\\hat{\\sigma}_y",
    label: "Pauli-Y Gate Axis",
    description: "Bit-and-phase flip rotation axis π around Y (maps |0⟩ ↔ i|1⟩)",
    hudSection: "gates",
  },
  "gate-axis-z": {
    id: "gate-axis-z",
    symbol: "Z",
    latex: "\\hat{\\sigma}_z",
    label: "Pauli-Z Gate Axis",
    description: "Phase-flip rotation axis π around Z (maps |1⟩ ↔ -|1⟩)",
    hudSection: "gates",
  },
  "gate-axis-h": {
    id: "gate-axis-h",
    symbol: "H",
    latex: "\\hat{H} = \\frac{\\hat{\\sigma}_x + \\hat{\\sigma}_z}{\\sqrt{2}}",
    label: "Hadamard Gate Axis",
    description: "Diagonal superposition rotation axis π around (X+Z)/√2 (maps |0⟩ ↔ |+⟩)",
    hudSection: "gates",
  },
  "state-vector": {
    id: "state-vector",
    symbol: "|ψ⟩",
    latex: "|\\psi\\rangle",
    label: "Quantum State Vector",
    description: "|ψ⟩ = α|0⟩ + βe^{iφ}|1⟩ normalized in Hilbert space",
    hudSection: "state-vector",
  },
  "bloch-vector-tip-handle": {
    id: "bloch-vector-tip-handle",
    symbol: "|ψ⟩",
    latex: "|\\psi\\rangle",
    label: "State Vector Handle",
    description: "Interactive gizmo for manipulating Bloch sphere state",
    hudSection: "state-vector",
  },
  "north-pole": {
    id: "north-pole",
    symbol: "|0⟩",
    latex: "|0\\rangle",
    label: "Ground State |0⟩",
    description: "Computational basis state |0⟩ at θ = 0",
    hudSection: "born-probabilities",
  },
  "south-pole": {
    id: "south-pole",
    symbol: "|1⟩",
    latex: "|1\\rangle",
    label: "Excited State |1⟩",
    description: "Computational basis state |1⟩ at θ = π",
    hudSection: "born-probabilities",
  },
  "basis-zero": {
    id: "basis-zero",
    symbol: "|0⟩",
    latex: "|0\\rangle",
    label: "Ground State |0⟩",
    description: "Computational basis state |0⟩",
    hudSection: "born-probabilities",
  },
  "basis-one": {
    id: "basis-one",
    symbol: "|1⟩",
    latex: "|1\\rangle",
    label: "Excited State |1⟩",
    description: "Computational basis state |1⟩",
    hudSection: "born-probabilities",
  },
  "probability-p0": {
    id: "probability-p0",
    symbol: "P(|0⟩)",
    latex: "P(|0\\rangle) = |\\alpha|^2",
    label: "Born Probability P(|0⟩)",
    description: "Measurement outcome probability for collapsing to |0⟩",
    hudSection: "born-probabilities",
  },
  "probability-p1": {
    id: "probability-p1",
    symbol: "P(|1⟩)",
    latex: "P(|1\\rangle) = |\\beta|^2",
    label: "Born Probability P(|1⟩)",
    description: "Measurement outcome probability for collapsing to |1⟩",
    hudSection: "born-probabilities",
  },
  "equator-ring": {
    id: "equator-ring",
    symbol: "|+⟩ / |-⟩",
    latex: "\\frac{1}{\\sqrt{2}}(|0\\rangle + e^{i\\phi}|1\\rangle)",
    label: "Equatorial Superposition Ring",
    description: "Balanced superposition states where P(|0⟩) = P(|1⟩) = 0.5",
    hudSection: "state-vector",
  },
  "decoherence-envelope": {
    id: "decoherence-envelope",
    symbol: "T₂",
    latex: "T_2",
    label: "Transverse Coherence Time",
    description: "Phase damping timescale determined by cryostat temperature",
    hudSection: "cryo",
  },
  "measurement-chamber": {
    id: "measurement-chamber",
    symbol: "M̂",
    latex: "\\hat{M} = \\{|0\\rangle\\langle 0|, |1\\rangle\\langle 1|\\}",
    label: "Measurement Chamber",
    description: "Macroscopic measurement apparatus isolating the quantum state during projection",
    hudSection: "born-probabilities",
  },
  "collapse-ray": {
    id: "collapse-ray",
    symbol: "P_k",
    latex: "|\\psi\\rangle \\to |k\\rangle",
    label: "Wavefunction Collapse Ray",
    description: "Stochastic non-unitary projection of the state vector into an eigenstate",
    hudSection: "born-probabilities",
  },
  "histogram-3d": {
    id: "histogram-3d",
    symbol: "N_k / N",
    latex: "\\lim_{N \\to \\infty} \\frac{N_k}{N} = P_k",
    label: "3D Stochastic Sampling Histogram",
    description: "Empirical outcome distribution verifying the Born rule via repeated shots",
    hudSection: "born-probabilities",
  },
};

/**
 * Retrieve the mathematical symbol associated with a spatial ID.
 */
export function getTelemetrySymbol(id: string | null): string | null {
  if (!id) return null;
  return SPATIAL_TELEMETRY_MAP[id]?.symbol ?? null;
}

/**
 * Retrieve full telemetry metadata associated with a spatial ID.
 */
export function getTelemetryMapping(id: string | null): TelemetrySymbolMapping | null {
  if (!id) return null;
  return SPATIAL_TELEMETRY_MAP[id] ?? null;
}

export interface SpatialTelemetryBridgeState {
  /** Currently focused or hovered spatial element ID */
  activeFocusId: string | null;
  /** Set the active focused spatial element */
  setActiveFocusId: (id: string | null) => void;
  /** Clear active focus back to null */
  clearFocus: () => void;
  /** Get the active mathematical symbol for HUD telemetry */
  getActiveSymbol: () => string | null;
  /** Get the full telemetry metadata for the currently active focus */
  getActiveMapping: () => TelemetrySymbolMapping | null;
}

/**
 * Zustand hook for spatial-telemetry synchronization between the 3D canvas and HUD.
 */
export const useSpatialTelemetryBridge = create<SpatialTelemetryBridgeState>((set, get) => ({
  activeFocusId: null,
  setActiveFocusId: (id: string | null) => set({ activeFocusId: id }),
  clearFocus: () => set({ activeFocusId: null }),
  getActiveSymbol: () => getTelemetrySymbol(get().activeFocusId),
  getActiveMapping: () => getTelemetryMapping(get().activeFocusId),
}));
