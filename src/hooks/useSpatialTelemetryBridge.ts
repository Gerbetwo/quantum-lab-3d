import { create } from 'zustand';
import type { Camera, Vector3 } from 'three';

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
  hudSection?: 'state-vector' | 'born-probabilities' | 'angles' | 'cryo' | 'gates';
}

/**
 * Comprehensive mapping table from 3D scene IDs to mathematical symbols.
 */
export const SPATIAL_TELEMETRY_MAP: Record<string, TelemetrySymbolMapping> = {
  'theta-arc': {
    id: 'theta-arc',
    symbol: 'θ',
    latex: '\\theta',
    label: 'Polar Angle (θ)',
    description: 'Controls superposition amplitudes α = cos(θ/2) and β = sin(θ/2)',
    hudSection: 'angles',
  },
  'phase-disk': {
    id: 'phase-disk',
    symbol: 'φ',
    latex: '\\phi',
    label: 'Azimuthal Phase (φ)',
    description: 'Relative phase angle between basis states in e^{iφ}',
    hudSection: 'angles',
  },
  'state-vector': {
    id: 'state-vector',
    symbol: '|ψ⟩',
    latex: '|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle',
    label: 'Quantum State Vector',
    description: 'Pure state unit vector pointing on the surface of the Bloch sphere',
    hudSection: 'state-vector',
  },
  'north-pole': {
    id: 'north-pole',
    symbol: '|0⟩',
    latex: '|0\\rangle = \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}',
    label: 'Computational Ground State',
    description: 'North pole eigenstate with P(|0⟩) = 1.0',
    hudSection: 'state-vector',
  },
  'south-pole': {
    id: 'south-pole',
    symbol: '|1⟩',
    latex: '|1\\rangle = \\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix}',
    label: 'Computational Excited State',
    description: 'South pole eigenstate with P(|1⟩) = 1.0',
    hudSection: 'state-vector',
  },
  'gate-axis-x': {
    id: 'gate-axis-x',
    symbol: 'X',
    latex: '\\hat{\\sigma}_x = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}',
    label: 'Pauli-X Gate Axis',
    description: 'Bit-flip rotation axis π around X (maps |0⟩ ↔ |1⟩)',
    hudSection: 'gates',
  },
  'gate-axis-y': {
    id: 'gate-axis-y',
    symbol: 'Y',
    latex: '\\hat{\\sigma}_y = \\begin{pmatrix} 0 & -i \\\\ i & 0 \\end{pmatrix}',
    label: 'Pauli-Y Gate Axis',
    description: 'Bit and phase flip rotation axis π around Y',
    hudSection: 'gates',
  },
  'gate-axis-z': {
    id: 'gate-axis-z',
    symbol: 'Z',
    latex: '\\hat{\\sigma}_z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}',
    label: 'Pauli-Z Gate Axis',
    description: 'Phase-flip rotation axis π around Z (maps |+⟩ ↔ |-⟩)',
    hudSection: 'gates',
  },
  'gate-axis-h': {
    id: 'gate-axis-h',
    symbol: 'H',
    latex: 'H = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}',
    label: 'Hadamard Gate Axis',
    description: 'Superposition axis rotation π around (X+Z)/√2',
    hudSection: 'gates',
  },
  'beam-splitter': {
    id: 'beam-splitter',
    symbol: 'BS',
    latex: '\\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}',
    label: '50:50 Beam Splitter',
    description: 'Unitary transformation creating spatial mode superposition',
    hudSection: 'gates',
  },
  'amplitude-bar': {
    id: 'amplitude-bar',
    symbol: 'P_i',
    latex: 'P_i = |a_i|^2',
    label: 'Basis Probability Amplitude',
    description: 'Born probability amplitude for the corresponding basis state',
    hudSection: 'born-probabilities',
  },
};

export interface SpatialTelemetryState {
  activeFocusId: string | null;
  hoveredElement: TelemetrySymbolMapping | null;
  camera: Camera | null;
  vectorTip: Vector3 | null;
  vectorAngles: { theta: number; phi: number } | null;
  setCamera: (camera: Camera | null) => void;
  setVectorTip: (tip: Vector3 | null, angles?: { theta: number; phi: number } | null) => void;
  setActiveFocusId: (id: string | null) => void;
  onPointerOver: (id: string) => void;
  onPointerOut: (id: string) => void;
  clearFocus: () => void;
}

export const useSpatialTelemetryBridge = create<SpatialTelemetryState>((set) => ({
  activeFocusId: null,
  hoveredElement: null,
  camera: null,
  vectorTip: null,
  vectorAngles: null,

  setCamera: (camera: Camera | null) => set({ camera }),

  setVectorTip: (tip: Vector3 | null, angles?: { theta: number; phi: number } | null) =>
    set({ vectorTip: tip, vectorAngles: angles ?? null }),

  setActiveFocusId: (id: string | null) =>
    set({
      activeFocusId: id,
      hoveredElement: id && SPATIAL_TELEMETRY_MAP[id] ? SPATIAL_TELEMETRY_MAP[id] : null,
    }),

  onPointerOver: (id: string) =>
    set({
      activeFocusId: id,
      hoveredElement: SPATIAL_TELEMETRY_MAP[id] ?? null,
    }),

  onPointerOut: (id: string) =>
    set((state) => {
      if (state.activeFocusId === id) {
        return { activeFocusId: null, hoveredElement: null };
      }
      return state;
    }),

  clearFocus: () => set({ activeFocusId: null, hoveredElement: null }),
}));

export default useSpatialTelemetryBridge;
