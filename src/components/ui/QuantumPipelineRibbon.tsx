"use client";

import React from "react";
import type { QubitState } from "@/core/qubitMath";
import type { BitTriple } from "@/core/types";
import {
  playGateSweep,
  playCollapseDrop,
  playVectorSnap,
} from "@/lib/audio/soundEngine";
import { useTranslation } from "@/hooks/useTranslation";
import {
  ChevronRight,
  RotateCcw,
  Zap,
  Play,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export interface QuantumPipelineRibbonProps {
  activeTab: number;
  state: QubitState;
  onPreparePreset?: (preset: { theta: number; phi: number }) => void;
  onTransformGate?: (gate: "H" | "X" | "Y" | "Z" | "S" | "T") => void;
  onMeasure?: () => void;
  onReset?: () => void;
  lastOutcome?: 0 | 1 | null;

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

export const STATE_PRESETS = [
  { id: "zero", symbol: "|0⟩", theta: 0, phi: 0 },
  { id: "one", symbol: "|1⟩", theta: Math.PI, phi: 0 },
  { id: "plus", symbol: "|+⟩", theta: Math.PI / 2, phi: 0 },
  { id: "minus", symbol: "|-⟩", theta: Math.PI / 2, phi: Math.PI },
];

export const PIPELINE_GATES: Array<{
  id: "H" | "X" | "Y" | "Z" | "S" | "T";
  symbol: string;
}> = [
  { id: "H", symbol: "H" },
  { id: "X", symbol: "X" },
  { id: "Y", symbol: "Y" },
  { id: "Z", symbol: "Z" },
  { id: "S", symbol: "S" },
  { id: "T", symbol: "T" },
];

export const QuantumPipelineRibbon: React.FC<QuantumPipelineRibbonProps> = ({
  activeTab,
  onPreparePreset,
  onTransformGate,
  onMeasure,
  onReset,
  lastOutcome,
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
  const { t } = useTranslation();

  // Mode 1: Single Qubit Workspaces (Tabs 0, 1, 2)
  if (activeTab <= 2) {
    return (
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl max-w-[95vw] overflow-x-auto select-none">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              playVectorSnap();
              onReset?.();
            }}
            title="Reset State"
            className="p-1.5 rounded-lg border border-border hover:border-primary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-warning" />
          </button>
          {STATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                playVectorSnap();
                onPreparePreset?.(p);
              }}
              className="px-2 py-1 text-xs font-mono font-semibold rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              {p.symbol}
            </button>
          ))}
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />

        <div className="flex items-center gap-1">
          {PIPELINE_GATES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                playGateSweep(g.id);
                onTransformGate?.(g.id);
              }}
              className="px-2 py-1 text-xs font-mono font-bold rounded-md border border-border bg-card text-foreground hover:border-quantum-purple hover:text-quantum-purple transition-all cursor-pointer"
            >
              {g.symbol}
            </button>
          ))}
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              playCollapseDrop();
              onMeasure?.();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary bg-secondary hover:bg-card text-primary text-xs font-mono font-bold transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>COLLAPSE</span>
          </button>

          {lastOutcome !== null && (
            <span className="px-2 py-1 rounded border border-success/40 bg-success/10 text-success font-mono text-xs font-bold animate-pulse">
              |{lastOutcome}⟩
            </span>
          )}
        </div>
      </nav>
    );
  }

  // Mode 2: Entanglement (Tab 3)
  if (activeTab === 3) {
    return (
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl select-none">
        <span className="text-xs font-mono font-bold text-primary">
          EPR |Φ⁺⟩
        </span>
        <button
          type="button"
          onClick={onMeasureEntangled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-background font-mono font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md"
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
          className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer"
        >
          Reset Pair
        </button>
      </nav>
    );
  }

  // Mode 3: Decoherence (Tab 4)
  if (activeTab === 4) {
    return (
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl select-none">
        <span className="text-xs font-mono font-bold text-primary">
          Cryostat: {temperature} mK
        </span>
        <div className="flex items-center gap-1.5">
          {[15, 150, 300].map((tVal) => (
            <button
              key={tVal}
              type="button"
              onClick={() => onTemperatureChange?.(tVal)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border cursor-pointer ${
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
          className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer"
        >
          Reset Cryo (15 mK)
        </button>
      </nav>
    );
  }

  // Mode 4: Grover Search (Tab 5)
  if (activeTab === 5) {
    return (
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl select-none">
        <span className="text-xs font-mono font-bold text-primary uppercase">
          Target State:
        </span>
        <div className="flex items-center gap-1">
          {["|00⟩", "|01⟩", "|10⟩", "|11⟩"].map((lbl, idx) => (
            <button
              key={lbl}
              type="button"
              onClick={() => onSelectGroverTarget?.(idx)}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md border cursor-pointer ${
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-background font-mono font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run Diffusion Step</span>
        </button>
        <button
          type="button"
          onClick={onResetGrover}
          className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer"
        >
          Reset
        </button>
      </nav>
    );
  }

  // Mode 5: Quantum Error Correction (Tab 6)
  if (activeTab === 6) {
    return (
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl select-none">
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono text-muted-foreground mr-1">
            Flip:
          </span>
          {qecTriple.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onInjectBitFlip?.(idx as 0 | 1 | 2)}
              className="px-2 py-1 text-xs font-mono font-bold rounded-md border border-destructive/40 bg-secondary text-destructive hover:bg-destructive/20 cursor-pointer"
            >
              q{idx}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onRunSyndromeCorrection}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-background font-mono font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Run Syndrome Correction</span>
        </button>
        <button
          type="button"
          onClick={() => onResetQec?.(0)}
          className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer"
        >
          Encode |000⟩
        </button>
      </nav>
    );
  }

  return null;
};

export default QuantumPipelineRibbon;
