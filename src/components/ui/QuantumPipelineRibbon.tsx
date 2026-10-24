"use client";

import React from "react";
import type { QubitState } from "@/core/qubitMath";
import type { BitTriple } from "@/core/types";
import {
  playGateSweep,
  playCollapseDrop,
  playVectorSnap,
} from "@/lib/audio/soundEngine";
import {
  ChevronRight,
  RotateCcw,
  Zap,
  Play,
  Pause,
  Orbit,
  ShieldAlert,
} from "lucide-react";

export interface StatePreset {
  id: string;
  symbol: string;
  name: string;
  theta: number;
  phi: number;
}

export interface GateItem {
  id: "H" | "X" | "Y" | "Z" | "S" | "T";
  symbol: string;
  name: string;
}

export const STATE_PRESETS: StatePreset[] = [
  { id: "zero", symbol: "|0⟩", name: "Ground |0⟩", theta: 0, phi: 0 },
  { id: "one", symbol: "|1⟩", name: "Excited |1⟩", theta: Math.PI, phi: 0 },
  { id: "plus", symbol: "|+⟩", name: "Superposition |+⟩", theta: Math.PI / 2, phi: 0 },
  { id: "minus", symbol: "|-⟩", name: "Superposition |-⟩", theta: Math.PI / 2, phi: Math.PI },
];

export const PIPELINE_GATES: GateItem[] = [
  { id: "H", symbol: "H", name: "Hadamard" },
  { id: "X", symbol: "X", name: "Pauli-X" },
  { id: "Y", symbol: "Y", name: "Pauli-Y" },
  { id: "Z", symbol: "Z", name: "Pauli-Z" },
  { id: "S", symbol: "S", name: "Phase-S" },
  { id: "T", symbol: "T", name: "Phase-T" },
];

export interface QuantumPipelineRibbonProps {
  activeTab?: number;
  state?: QubitState;
  className?: string;
  disabled?: boolean;
  lastOutcome?: 0 | 1 | null;
  onPreparePreset?: (preset: StatePreset) => void;
  onTransformGate?: (gate: "H" | "X" | "Y" | "Z" | "S" | "T") => void;
  onMeasure?: () => void;
  onReset?: () => void;

  // Animation Controls
  isPlayingAnimation?: boolean;
  onTogglePlayPause?: () => void;
  animationSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  onReplayAnimation?: () => void;

  // Camera Orbit
  autoRotateCamera?: boolean;
  onToggleAutoRotateCamera?: () => void;

  // Entanglement (Tab 3)
  entangledPair?: { alice: 0 | 1; bob: 0 | 1; state: string } | null;
  onMeasureEntangled?: () => void;
  onResetEntangled?: () => void;

  // Decoherence (Tab 4)
  temperature?: number;
  onTemperatureChange?: (temp: number) => void;
  onResetTemperature?: () => void;

  // Grover (Tab 5)
  groverTarget?: number;
  onSelectGroverTarget?: (idx: number) => void;
  onRunGrover?: () => void;
  onResetGrover?: () => void;

  // QEC (Tab 6)
  qecTriple?: BitTriple;
  onInjectBitFlip?: (idx?: 0 | 1 | 2) => void;
  onRunSyndromeCorrection?: () => void;
  onResetQec?: (bit?: 0 | 1) => void;
}

export const QuantumPipelineRibbon: React.FC<QuantumPipelineRibbonProps> = ({
  activeTab = 0,
  className = "",
  disabled = false,
  lastOutcome = null,
  onPreparePreset,
  onTransformGate,
  onMeasure,
  onReset,
  isPlayingAnimation = true,
  onTogglePlayPause,
  animationSpeed = 1,
  onSpeedChange,
  onReplayAnimation,
  autoRotateCamera = false,
  onToggleAutoRotateCamera,
  entangledPair,
  onMeasureEntangled,
  onResetEntangled,
  temperature = 15,
  onTemperatureChange,
  onResetTemperature,
  groverTarget = 1,
  onSelectGroverTarget,
  onRunGrover,
  onResetGrover,
  qecTriple = [0, 0, 0],
  onInjectBitFlip,
  onRunSyndromeCorrection,
  onResetQec,
}) => {
  // Shared Animation Control Bar
  const renderAnimationControls = () => (
    <div className="flex items-center gap-1 pl-2 border-l border-border/60">
      {onTogglePlayPause && (
        <button
          type="button"
          onClick={onTogglePlayPause}
          disabled={disabled}
          aria-label={isPlayingAnimation ? "Pause Animation" : "Play Animation"}
          title={isPlayingAnimation ? "Pause Animation" : "Play Animation"}
          className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground transition-all cursor-pointer disabled:opacity-40"
        >
          {isPlayingAnimation ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
        </button>
      )}

      {onReplayAnimation && (
        <button
          type="button"
          onClick={onReplayAnimation}
          disabled={disabled}
          aria-label="Replay Animation"
          title="Replay Animation"
          className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground transition-all cursor-pointer disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}

      {onSpeedChange && (
        <div className="flex items-center gap-0.5">
          {[0.5, 1, 2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onSpeedChange(spd)}
              disabled={disabled}
              aria-label={`Animation Speed ${spd}x`}
              className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border cursor-pointer transition-all disabled:opacity-40 ${
                animationSpeed === spd
                  ? "bg-primary text-background border-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      )}

      {onToggleAutoRotateCamera && (
        <button
          type="button"
          onClick={onToggleAutoRotateCamera}
          disabled={disabled}
          aria-label="Toggle Camera Auto-Rotate"
          title={autoRotateCamera ? "Disable Auto-Orbit" : "Enable Auto-Orbit"}
          className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold rounded border cursor-pointer transition-all disabled:opacity-40 ${
            autoRotateCamera
              ? "bg-secondary border-primary text-primary"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Orbit className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Orbit</span>
        </button>
      )}
    </div>
  );

  // Mode 1: Single Qubit Workspaces (Tabs 0, 1, 2 or default)
  if (activeTab <= 2) {
    return (
      <nav
        data-testid="quantum-pipeline-ribbon"
        aria-label="Quantum Execution Pipeline"
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl max-w-[95vw] overflow-x-auto select-none ${className}`.trim()}
      >
        {/* PHASE 1: PREPARE */}
        <div data-testid="phase-prepare" className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              playVectorSnap();
              onReset?.();
            }}
            disabled={disabled}
            aria-label="Reset State"
            title="Reset State"
            className="p-1.5 rounded-lg border border-border hover:border-primary text-muted-foreground hover:text-foreground transition-all disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-warning" />
          </button>
          {STATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (disabled) return;
                playVectorSnap();
                onPreparePreset?.(p);
              }}
              disabled={disabled}
              aria-label={`Prepare ${p.name}`}
              className="px-2 py-1 text-xs font-mono font-semibold rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-all disabled:opacity-40 cursor-pointer"
            >
              {p.symbol}
            </button>
          ))}
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />

        {/* PHASE 2: TRANSFORM */}
        <div data-testid="phase-transform" className="flex items-center gap-1">
          {PIPELINE_GATES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                if (disabled) return;
                playGateSweep(g.id);
                onTransformGate?.(g.id);
              }}
              disabled={disabled}
              aria-label={`Apply ${g.name} Gate`}
              className="px-2 py-1 text-xs font-mono font-bold rounded-md border border-border bg-card text-foreground hover:border-quantum-purple hover:text-quantum-purple transition-all disabled:opacity-40 cursor-pointer"
            >
              {g.symbol}
            </button>
          ))}
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />

        {/* PHASE 3: MEASURE */}
        <div data-testid="phase-measure" className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              playCollapseDrop();
              onMeasure?.();
            }}
            disabled={disabled}
            aria-label="Collapse Wavefunction Measurement"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary bg-secondary hover:bg-card text-primary text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>COLLAPSE</span>
          </button>

          {lastOutcome !== null && (
            <span
              data-testid="pipeline-outcome-badge"
              className="px-2 py-1 rounded border border-success/40 bg-success/10 text-success font-mono text-xs font-bold animate-pulse"
            >
              |{lastOutcome}⟩
            </span>
          )}
        </div>

        {/* ANIMATION & CAMERA CONTROLS */}
        {renderAnimationControls()}
      </nav>
    );
  }

  // Mode 2: Entanglement (Tab 3)
  if (activeTab === 3) {
    return (
      <nav
        data-testid="quantum-pipeline-ribbon"
        aria-label="Entanglement Ribbon"
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl select-none ${className}`.trim()}
      >
        <span className="text-xs font-mono font-bold text-primary">
          EPR |Φ⁺⟩
        </span>
        <button
          type="button"
          onClick={onMeasureEntangled}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-background font-mono font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md disabled:opacity-40"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Measure Entangled Pair</span>
        </button>
        {entangledPair && (
          <span className="px-2 py-1 rounded bg-secondary border border-success text-success font-mono text-xs font-bold">
            Result: {entangledPair.state}
          </span>
        )}
        <button
          type="button"
          onClick={onResetEntangled}
          disabled={disabled}
          className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer disabled:opacity-40"
        >
          Reset Pair
        </button>
        {renderAnimationControls()}
      </nav>
    );
  }

  // Mode 3: Decoherence (Tab 4)
  if (activeTab === 4) {
    return (
      <nav
        data-testid="quantum-pipeline-ribbon"
        aria-label="Decoherence Ribbon"
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl select-none ${className}`.trim()}
      >
        <span className="text-xs font-mono font-bold text-primary">
          Cryostat: {temperature} mK
        </span>
        <div className="flex items-center gap-1.5">
          {[15, 150, 300].map((tVal) => (
            <button
              key={tVal}
              type="button"
              onClick={() => onTemperatureChange?.(tVal)}
              disabled={disabled}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border cursor-pointer disabled:opacity-40 ${
                temperature === tVal
                  ? "bg-secondary border-primary text-primary"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              {tVal} mK
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onResetTemperature}
          disabled={disabled}
          className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer disabled:opacity-40"
        >
          Reset Cryo (15 mK)
        </button>
        {renderAnimationControls()}
      </nav>
    );
  }

  // Mode 4: Grover Search (Tab 5)
  if (activeTab === 5) {
    return (
      <nav
        data-testid="quantum-pipeline-ribbon"
        aria-label="Grover Search Ribbon"
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl select-none ${className}`.trim()}
      >
        <span className="text-xs font-mono font-bold text-primary uppercase">
          Target State:
        </span>
        <div className="flex items-center gap-1">
          {["|00⟩", "|01⟩", "|10⟩", "|11⟩"].map((lbl, idx) => (
            <button
              key={lbl}
              type="button"
              onClick={() => onSelectGroverTarget?.(idx)}
              disabled={disabled}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md border cursor-pointer disabled:opacity-40 ${
                groverTarget === idx
                  ? "bg-secondary border-primary text-primary ring-1 ring-ring"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onRunGrover}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-background font-mono font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md disabled:opacity-40"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run Diffusion Step</span>
        </button>
        <button
          type="button"
          onClick={onResetGrover}
          disabled={disabled}
          className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer disabled:opacity-40"
        >
          Reset
        </button>
        {renderAnimationControls()}
      </nav>
    );
  }

  // Mode 5: Quantum Error Correction (Tab 6)
  if (activeTab === 6) {
    return (
      <nav
        data-testid="quantum-pipeline-ribbon"
        aria-label="QEC Ribbon"
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl select-none ${className}`.trim()}
      >
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono text-muted-foreground mr-1">
            Flip:
          </span>
          {qecTriple.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onInjectBitFlip?.(idx as 0 | 1 | 2)}
              disabled={disabled}
              className="px-2 py-1 text-xs font-mono font-bold rounded-md border border-destructive/40 bg-secondary text-destructive hover:bg-destructive/20 cursor-pointer disabled:opacity-40"
            >
              q{idx}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onRunSyndromeCorrection}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-background font-mono font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md disabled:opacity-40"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Run Syndrome Correction</span>
        </button>
        <button
          type="button"
          onClick={() => onResetQec?.(0)}
          disabled={disabled}
          className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer disabled:opacity-40"
        >
          Encode |000⟩
        </button>
        {renderAnimationControls()}
      </nav>
    );
  }

  return null;
};

export default QuantumPipelineRibbon;
