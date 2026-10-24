"use client";

import React, { useState } from "react";
import type { QubitState } from "@/core/qubitMath";
import type { BitTriple } from "@/core/types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  RotateCcw,
  Zap,
  Play,
  Pause,
  Orbit,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
} from "lucide-react";
import {
  playVectorSnap,
  playGateSweep,
  playCollapseDrop,
} from "@/lib/audio/soundEngine";

export interface PipelinePreset {
  id: string;
  name: string;
  symbol: string;
  theta: number;
  phi: number;
}

export interface PipelineGate {
  id: "H" | "X" | "Y" | "Z" | "S" | "T";
  name: string;
  symbol: string;
  axis: "X" | "Y" | "Z" | "DIAG";
  translationKey: string;
}

const STATE_PRESETS: PipelinePreset[] = [
  { id: "zero", name: "Ground |0⟩", symbol: "|0⟩", theta: 0, phi: 0 },
  { id: "one", name: "Excited |1⟩", symbol: "|1⟩", theta: Math.PI, phi: 0 },
  { id: "plus", name: "Superposition |+⟩", symbol: "|+⟩", theta: Math.PI / 2, phi: 0 },
  { id: "minus", name: "Superposition |-⟩", symbol: "|-⟩", theta: Math.PI / 2, phi: Math.PI },
];

const PIPELINE_GATES: PipelineGate[] = [
  { id: "H", name: "Hadamard", symbol: "H", axis: "DIAG", translationKey: "hadamard" },
  { id: "X", name: "Pauli-X", symbol: "X", axis: "X", translationKey: "pauliX" },
  { id: "Y", name: "Pauli-Y", symbol: "Y", axis: "Y", translationKey: "pauliY" },
  { id: "Z", name: "Pauli-Z", symbol: "Z", axis: "Z", translationKey: "pauliZ" },
  { id: "S", name: "Phase (S)", symbol: "S", axis: "Z", translationKey: "phaseS" },
  { id: "T", name: "π/8 (T)", symbol: "T", axis: "Z", translationKey: "phaseT" },
];

export interface QuantumPipelineRibbonProps {
  activeTab?: number;
  state?: QubitState;
  lastOutcome?: 0 | 1 | null;
  disabled?: boolean;
  className?: string;
  onPreparePreset?: (preset: PipelinePreset) => void;
  onReset?: () => void;
  onTransformGate?: (gate: "H" | "X" | "Y" | "Z" | "S" | "T") => void;
  onMeasure?: () => void;
  isPlayingAnimation?: boolean;
  animationSpeed?: number;
  onTogglePlayPause?: () => void;
  onSpeedChange?: (speed: number) => void;
  onReplayAnimation?: () => void;
  autoRotateCamera?: boolean;
  onToggleAutoRotateCamera?: () => void;
  entangledPair?: { alice: 0 | 1; bob: 0 | 1; state: string } | null;
  onMeasureEntangled?: () => void;
  onResetEntangled?: () => void;
  temperature?: number;
  onTemperatureChange?: (temp: number) => void;
  onResetTemperature?: () => void;
  groverTarget?: number;
  onSelectGroverTarget?: (idx: number) => void;
  onRunGrover?: () => void;
  onResetGrover?: () => void;
  qecTriple?: BitTriple;
  onInjectBitFlip?: (idx: 0 | 1 | 2) => void;
  onRunSyndromeCorrection?: () => void;
  onResetQec?: (bit?: 0 | 1) => void;
}

export const QuantumPipelineRibbon: React.FC<QuantumPipelineRibbonProps> = ({
  activeTab = 0, lastOutcome = null, disabled = false, className = "",
  onPreparePreset, onReset, onTransformGate, onMeasure,
  isPlayingAnimation = false, animationSpeed = 1, onTogglePlayPause, onSpeedChange, onReplayAnimation,
  autoRotateCamera = false, onToggleAutoRotateCamera,
  entangledPair, onMeasureEntangled, onResetEntangled,
  temperature = 15, onTemperatureChange, onResetTemperature,
  groverTarget = 1, onSelectGroverTarget, onRunGrover, onResetGrover,
  qecTriple = [0, 0, 0], onInjectBitFlip, onRunSyndromeCorrection, onResetQec,
}) => {
  const { t } = useTranslation();
  const [isOrbitDrawerOpen, setIsOrbitDrawerOpen] = useState<boolean>(false);

  const renderAnimationControls = () => (
    <div className="relative flex items-center gap-1 pl-2 border-l border-border/60">
      {onTogglePlayPause && (
        <button
          type="button"
          onClick={onTogglePlayPause}
          disabled={disabled}
          aria-label={isPlayingAnimation ? t("ribbon.controls.pause_animation") : t("ribbon.controls.play_animation")}
          title={isPlayingAnimation ? t("ribbon.controls.pause_animation") : t("ribbon.controls.play_animation")}
          className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground transition-all cursor-pointer disabled:opacity-40"
        >
          {isPlayingAnimation ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>
      )}

      {onReplayAnimation && (
        <button
          type="button"
          onClick={onReplayAnimation}
          disabled={disabled}
          aria-label={t("ribbon.replay")}
          title={t("ribbon.replay")}
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

      {/* Compact Orbit Controls Toggle */}
      <button
        type="button"
        onClick={() => setIsOrbitDrawerOpen((prev) => !prev)}
        disabled={disabled}
        data-testid="orbit-drawer-toggle"
        aria-expanded={isOrbitDrawerOpen}
        aria-label={t("ribbon.toggle_orbit_drawer")}
        title={t("ribbon.toggle_orbit_drawer")}
        className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-40 ${
          isOrbitDrawerOpen || autoRotateCamera
            ? "border-primary bg-secondary text-primary"
            : "border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        <Orbit className="w-3.5 h-3.5" />
        {isOrbitDrawerOpen ? (
          <ChevronDown className="w-3 h-3 text-primary" />
        ) : (
          <ChevronUp className="w-3 h-3 text-muted-foreground" />
        )}
      </button>

      {/* Collapsible Orbit Controls HUD Drawer */}
      {isOrbitDrawerOpen && (
        <div
          data-testid="orbit-controls-drawer"
          className="absolute bottom-full mb-2 right-0 p-2 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl flex items-center gap-2 pointer-events-auto z-40 animate-in fade-in zoom-in-95 duration-150"
        >
          <span className="text-[10px] font-mono uppercase font-semibold text-muted-foreground whitespace-nowrap pl-1">
            {t("ribbon.orbit_controls")}
          </span>

          {onToggleAutoRotateCamera && (
            <button
              type="button"
              data-testid="orbit-auto-rotate-toggle"
              onClick={onToggleAutoRotateCamera}
              disabled={disabled}
              aria-label={t("ribbon.toggle_orbit")}
              title={autoRotateCamera ? t("ribbon.controls.disable_orbit") : t("ribbon.controls.enable_orbit")}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold rounded border cursor-pointer transition-all disabled:opacity-40 whitespace-nowrap ${
                autoRotateCamera
                  ? "bg-secondary border-primary text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Orbit className="w-3 h-3" />
              <span>{t("ribbon.orbit")}</span>
            </button>
          )}

          {/* Gate Rotation Ring Presets */}
          <div className="flex items-center gap-1 pl-1 border-l border-border/60">
            {(["X", "Y", "Z", "H"] as const).map((gateRing) => (
              <button
                key={gateRing}
                type="button"
                data-testid={`ring-button-${gateRing.toLowerCase()}`}
                onClick={() => onTransformGate?.(gateRing)}
                disabled={disabled}
                title={`Ring Axis ${gateRing}`}
                className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border border-border bg-card hover:bg-secondary text-foreground cursor-pointer disabled:opacity-40"
              >
                {gateRing}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Mode 1: Single Qubit Workspaces (Tabs 0, 1, 2 or default)
  if (activeTab <= 2) {
    return (
      <nav
        data-testid="quantum-pipeline-ribbon"
        aria-label={t("ribbon.aria_label")}
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl max-w-[95vw] overflow-x-auto select-none ${className}`.trim()}
      >
        {/* PHASE 1: PREPARE (Mission 1+) */}
        <div data-testid="phase-prepare" className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { if (!disabled) { playVectorSnap(); onReset?.(); } }}
            disabled={disabled}
            aria-label={t("ribbon.reset_aria")}
            title={t("ribbon.reset_aria")}
            className="p-1.5 rounded-lg border border-border hover:border-primary text-muted-foreground hover:text-foreground transition-all disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-warning" />
          </button>
          {STATE_PRESETS.map((p) => {
            const pLabel = t(`ribbon.presets.${p.id}.label`) || p.name;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { if (!disabled) { playVectorSnap(); onPreparePreset?.(p); } }}
                disabled={disabled}
                aria-label={`Prepare ${pLabel}`}
                className="px-2 py-1 text-xs font-mono font-semibold rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-all disabled:opacity-40 cursor-pointer"
              >
                {p.symbol}
              </button>
            );
          })}
        </div>

        {/* PHASE 2: TRANSFORM / GATES (Mission 2+) */}
        {activeTab >= 1 && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
            <div data-testid="phase-transform" className="flex items-center gap-1">
              {PIPELINE_GATES.map((g) => {
                const gName = t(`gates.${g.translationKey}.name`) || g.name;
                return (
                  <button
                    key={g.id}
                    type="button"
                    data-testid={`gate-button-${g.id}`}
                    onClick={() => { if (!disabled) { playGateSweep(g.id); onTransformGate?.(g.id); } }}
                    disabled={disabled}
                    aria-label={`Apply ${gName} Gate`}
                    className="px-2 py-1 text-xs font-mono font-bold rounded-md border border-border bg-card text-foreground hover:border-quantum-purple hover:text-quantum-purple transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {g.symbol}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* PHASE 3: MEASURE (Mission 3+) */}
        {activeTab >= 2 && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
            <div data-testid="phase-measure" className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="measure-collapse-button"
                onClick={() => { if (!disabled) { playCollapseDrop(); onMeasure?.(); } }}
                disabled={disabled}
                aria-label={t("ribbon.collapse_aria")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary bg-secondary hover:bg-card text-primary text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{t("ribbon.collapse")}</span>
              </button>
              {lastOutcome !== null && (
                <span
                  data-testid="pipeline-outcome-badge"
                  className="px-2 py-1 rounded bg-success/20 border border-success text-success font-mono text-xs font-bold shadow-sm"
                >
                  |{lastOutcome}⟩
                </span>
              )}
            </div>
          </>
        )}

        {renderAnimationControls()}
      </nav>
    );
  }

  // Mode 2: Entanglement (Tab 3)
  if (activeTab === 3) {
    return (
      <nav
        data-testid="quantum-pipeline-ribbon"
        aria-label={t("ribbon.entanglement_aria")}
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl select-none ${className}`.trim()}
      >
        <span className="text-xs font-mono font-bold text-primary">{t("ribbon.epr_pair")}</span>
        <button
          type="button"
          data-testid="measure-entangled-button"
          onClick={onMeasureEntangled}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-background font-mono font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md disabled:opacity-40"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{t("panels.entanglement.measure")}</span>
        </button>
        {entangledPair && (
          <span className="px-2 py-1 rounded bg-secondary border border-success text-success font-mono text-xs font-bold">
            {t("ribbon.controls.result_label", { state: entangledPair.state })}
          </span>
        )}
        <button
          type="button"
          onClick={onResetEntangled}
          disabled={disabled}
          className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer disabled:opacity-40"
        >
          {t("panels.entanglement.reset")}
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
        aria-label={t("ribbon.decoherence_aria")}
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl select-none ${className}`.trim()}
      >
        <span className="text-xs font-mono font-bold text-primary">Cryostat: {temperature} mK</span>
        <div className="flex items-center gap-1.5">
          {[15, 150, 300].map((tVal) => (
            <button
              key={tVal}
              type="button"
              onClick={() => onTemperatureChange?.(tVal)}
              disabled={disabled}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border cursor-pointer disabled:opacity-40 ${
                temperature === tVal ? "bg-secondary border-primary text-primary" : "bg-card border-border text-muted-foreground"
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
          {t("panels.decoherence.reset")}
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
        aria-label={t("ribbon.grover_aria")}
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl select-none ${className}`.trim()}
      >
        <span className="text-xs font-mono font-bold text-primary uppercase">{t("ribbon.target_state")}</span>
        <div className="flex items-center gap-1">
          {["|00⟩", "|01⟩", "|10⟩", "|11⟩"].map((lbl, idx) => (
            <button
              key={lbl}
              type="button"
              onClick={() => onSelectGroverTarget?.(idx)}
              disabled={disabled}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md border cursor-pointer disabled:opacity-40 ${
                groverTarget === idx ? "bg-secondary border-primary text-primary ring-1 ring-ring" : "bg-card border-border text-muted-foreground"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
        <button
          type="button"
          data-testid="grover-run-button"
          onClick={onRunGrover}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-background font-mono font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md disabled:opacity-40"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{t("panels.grover.run_diffusion")}</span>
        </button>
        <button
          type="button"
          onClick={onResetGrover}
          disabled={disabled}
          className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer disabled:opacity-40"
        >
          {t("panels.grover.reset")}
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
        aria-label={t("ribbon.qec_aria")}
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl select-none ${className}`.trim()}
      >
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono text-muted-foreground mr-1">{t("ribbon.controls.flip_label")}</span>
          {qecTriple.map((_, idx) => (
            <button
              key={idx}
              type="button"
              data-testid={`qec-flip-q${idx}`}
              aria-label={t("ribbon.controls.inject_flip_aria", { idx })}
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
          data-testid="qec-correct-button"
          onClick={onRunSyndromeCorrection}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-background font-mono font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md disabled:opacity-40"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{t("panels.qec.run_syndrome_correction")}</span>
        </button>
        <button
          type="button"
          onClick={() => onResetQec?.(0)}
          disabled={disabled}
          className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer disabled:opacity-40"
        >
          {t("panels.qec.encode_zero")}
        </button>
        {renderAnimationControls()}
      </nav>
    );
  }

  return null;
};

export default QuantumPipelineRibbon;
