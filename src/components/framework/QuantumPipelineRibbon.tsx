"use client";

import React, { useState } from "react";
import { useQuantumStore } from "@/store/useQuantumStore";
import { soundEngine } from "@/lib/soundEngine";
import { ChevronRight, RotateCcw, Zap } from "lucide-react";

export interface StatePreset {
  id: string;
  label: string;
  symbol: string;
  theta: number;
  phi: number;
  description: string;
}

export const STATE_PRESETS: StatePreset[] = [
  { id: "zero", label: "Ground |0⟩", symbol: "|0⟩", theta: 0, phi: 0, description: "North pole computational ground state" },
  { id: "one", label: "Excited |1⟩", symbol: "|1⟩", theta: Math.PI, phi: 0, description: "South pole computational excited state" },
  { id: "plus", label: "Superposition |+⟩", symbol: "|+⟩", theta: Math.PI / 2, phi: 0, description: "Equal superposition on +X axis" },
  { id: "minus", label: "Superposition |-⟩", symbol: "|-⟩", theta: Math.PI / 2, phi: Math.PI, description: "Equal superposition on -X axis" },
  { id: "plusi", label: "Phase |+i⟩", symbol: "|+i⟩", theta: Math.PI / 2, phi: Math.PI / 2, description: "Superposition on +Y axis" },
  { id: "minusi", label: "Phase |-i⟩", symbol: "|-i⟩", theta: Math.PI / 2, phi: (3 * Math.PI) / 2, description: "Superposition on -Y axis" },
];

export interface GateDefinition {
  id: string;
  label: string;
  symbol: string;
  description: string;
}

export const PIPELINE_GATES: GateDefinition[] = [
  { id: "H", label: "Hadamard", symbol: "H", description: "Creates equal superposition" },
  { id: "X", label: "Pauli-X", symbol: "X", description: "Bit flip (NOT gate)" },
  { id: "Y", label: "Pauli-Y", symbol: "Y", description: "Bit and phase flip" },
  { id: "Z", label: "Pauli-Z", symbol: "Z", description: "Phase flip" },
  { id: "S", label: "Phase (S)", symbol: "S", description: "π/2 phase rotation" },
  { id: "T", label: "π/8 (T)", symbol: "T", description: "π/4 phase rotation" },
];

export interface QuantumPipelineRibbonProps {
  className?: string;
  /** Active phase highlight */
  activePhase?: "prepare" | "transform" | "measure";
  /** Callback fired when a state preset is selected */
  onPreparePreset?: (preset: StatePreset) => void;
  /** Callback fired when a gate transform is triggered */
  onTransformGate?: (gate: string) => void;
  /** Callback fired when wavefunction collapse is triggered */
  onMeasure?: () => void;
  /** Callback fired to reset quantum state */
  onReset?: () => void;
  /** Last measurement outcome override */
  lastOutcome?: 0 | 1 | null;
  /** Whether the ribbon is disabled */
  disabled?: boolean;
}

/**
 * QuantumPipelineRibbon:
 * Sleek bottom-center control bar with 3 unified tactical phases:
 * [1. PREPARE] -> [2. TRANSFORM] -> [3. MEASURE].
 */
export const QuantumPipelineRibbon: React.FC<QuantumPipelineRibbonProps> = ({
  className = "",
  activePhase,
  onPreparePreset,
  onTransformGate,
  onMeasure,
  onReset,
  lastOutcome: propLastOutcome,
  disabled = false,
}) => {
  const storeLastOutcome = useQuantumStore((s) => s.lastOutcome);
  const storeSetAngles = useQuantumStore((s) => s.setAngles);
  const storeApplyGate = useQuantumStore((s) => s.applyGate);
  const storeMeasure = useQuantumStore((s) => s.measure);
  const storeResetState = useQuantumStore((s) => s.resetState);

  const [activePresetId, setActivePresetId] = useState<string | null>("zero");
  const lastOutcome = propLastOutcome !== undefined ? propLastOutcome : storeLastOutcome;

  const handleSelectPreset = (preset: StatePreset) => {
    if (disabled) return;
    setActivePresetId(preset.id);
    soundEngine.playVectorSnap();

    if (onPreparePreset) {
      onPreparePreset(preset);
    } else {
      storeSetAngles(preset.theta, preset.phi);
    }
  };

  const handleApplyGate = (gate: string) => {
    if (disabled) return;
    setActivePresetId(null);
    soundEngine.playGateSound(gate);

    if (onTransformGate) {
      onTransformGate(gate);
    } else {
      storeApplyGate(gate);
    }
  };

  const handleMeasure = () => {
    if (disabled) return;
    soundEngine.playStateCollapse();

    if (onMeasure) {
      onMeasure();
    } else {
      storeMeasure();
    }
  };

  const handleReset = () => {
    if (disabled) return;
    setActivePresetId("zero");
    soundEngine.playVectorSnap();

    if (onReset) {
      onReset();
    } else {
      storeResetState();
    }
  };

  return (
    <nav
      data-testid="quantum-pipeline-ribbon"
      aria-label={"Quantum Execution Pipeline"}
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 px-3 py-2 rounded-2xl border border-white/10 bg-surface-1/90 backdrop-blur-md shadow-2xl shadow-cyan-950/25 max-w-[95vw] overflow-x-auto select-none ${className}`.trim()}
    >
      {/* PHASE 1: PREPARE */}
      <div
        data-testid="phase-prepare"
        className={`flex items-center gap-1 transition-opacity ${
          activePhase && activePhase !== "prepare" ? "opacity-75" : "opacity-100"
        }`}
      >
        <span className="hidden sm:inline text-[9px] font-mono tracking-wider text-muted-foreground uppercase mr-1">
          1. PREPARE
        </span>
        <button
          type="button"
          onClick={handleReset}
          disabled={disabled}
          title={"Reset State to |0⟩"}
          aria-label={"Reset State"}
          className="p-1.5 rounded-lg border border-white/10 hover:border-quantum-cyan/50 text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-all disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {STATE_PRESETS.slice(0, 4).map((p) => {
            const isSelected = activePresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                disabled={disabled}
                title={`${p.label}: ${p.description}`}
                aria-label={`Prepare ${p.label}`}
                className={`px-2 py-1 text-xs font-mono font-semibold rounded-md border transition-all disabled:opacity-40 ${
                  isSelected
                    ? "bg-quantum-cyan/15 border-quantum-cyan text-quantum-cyan shadow-[0_0_8px_rgba(0,243,255,0.3)]"
                    : "bg-surface-2/60 border-white/5 text-muted-foreground hover:text-foreground hover:border-white/20"
                }`}
              >
                {p.symbol}
              </button>
            );
          })}
        </div>
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />

      {/* PHASE 2: TRANSFORM */}
      <div
        data-testid="phase-transform"
        className={`flex items-center gap-1 transition-opacity ${
          activePhase && activePhase !== "transform" ? "opacity-75" : "opacity-100"
        }`}
      >
        <span className="hidden sm:inline text-[9px] font-mono tracking-wider text-muted-foreground uppercase mr-1">
          2. TRANSFORM
        </span>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {PIPELINE_GATES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => handleApplyGate(g.id)}
              disabled={disabled}
              title={`${g.label} Gate: ${g.description}`}
              aria-label={`Apply ${g.label} Gate`}
              className="px-2 py-1 text-xs font-mono font-bold rounded-md border border-white/10 bg-surface-2/70 text-foreground hover:border-quantum-purple hover:text-quantum-purple hover:bg-surface-2 transition-all disabled:opacity-40 active:scale-95 shadow-sm"
            >
              {g.symbol}
            </button>
          ))}
        </div>
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />

      {/* PHASE 3: MEASURE */}
      <div
        data-testid="phase-measure"
        className={`flex items-center gap-1.5 transition-opacity ${
          activePhase && activePhase !== "measure" ? "opacity-75" : "opacity-100"
        }`}
      >
        <span className="hidden sm:inline text-[9px] font-mono tracking-wider text-muted-foreground uppercase mr-1">
          3. MEASURE
        </span>
        <button
          type="button"
          onClick={handleMeasure}
          disabled={disabled}
          title={"Collapse Wavefunction"}
          aria-label={"Collapse Wavefunction Measurement"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-quantum-cyan/60 bg-quantum-cyan/15 hover:bg-quantum-cyan/25 text-quantum-cyan text-xs font-mono font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(0,243,255,0.2)] active:scale-95 disabled:opacity-40"
        >
          <Zap className="w-3.5 h-3.5 text-quantum-cyan" />
          <span>{"COLLAPSE"}</span>
        </button>

        {lastOutcome !== null && (
          <span
            data-testid="pipeline-outcome-badge"
            className="px-2 py-1 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold animate-pulse"
          >
            |{lastOutcome}⟩
          </span>
        )}
      </div>
    </nav>
  );
};
