"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  computeStateMetrics,
  applyPhaseDecay,
  calculateT2CoherenceTime,
  thermalCollapseFactor,
} from "@/core/qubitMath";
import { runShorDemo } from "@/core/algorithms";
import { useQuantumLabState } from "@/hooks/useQuantumLabState";
import {
  getObjectiveByTabIndex,
  evaluateObjective,
} from "@/lib/quantum/objectivesConfig";
import {
  playGateSweep,
  playCollapseDrop,
  playVectorSnap,
} from "@/lib/audio/soundEngine";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

import { MissionCanvasShell } from "./ui/MissionCanvasShell";
import { TargetGoalCard } from "./ui/TargetGoalCard";
import { SpatialTooltipOverlay } from "./ui/SpatialTooltipOverlay";
import { UnifiedBottomTelemetryPanel } from "./UnifiedBottomTelemetryPanel";
import { QuantumPipelineRibbon } from "./ui/QuantumPipelineRibbon";

import { CoreBlochSphere } from "./3d/CoreBlochSphere";
import { EntanglementDualSphere } from "./3d/EntanglementDualSphere";
import { GroverBarChart3D } from "./3d/GroverBarChart3D";
import { QECArray3D } from "./3d/QECArray3D";
import { Sun, Moon, Globe } from "lucide-react";

export const WORKSHOP_TABS = [
  "1. Superposition",
  "2. Gates",
  "3. Measurement",
  "4. Entanglement",
  "5. Decoherence",
  "6. Grover Search",
  "7. Error Correction",
] as const;

export function QuantumLab() {
  const { theme, toggleTheme } = useTheme();
  const { locale, toggleLanguage, t } = useTranslation();

  const {
    activeTab,
    state,
    lastOutcome,
    gateCount,
    entangledPair,
    temperature,
    groverTarget,
    groverProbs,
    qecTriple,
    syndromeInfo,
    isPlayingAnimation,
    animationSpeed,
    replayTrigger,
    autoRotateCamera,
    noiseIntensity,
    setTab,
    setSingleQubitState,
    applySingleQubitGate,
    measureSingleQubit,
    resetSingleQubit,
    measureEntangled,
    resetEntangled,
    setTemperature,
    setGroverTarget,
    runGroverStep,
    resetGrover,
    injectQecBitFlip,
    runQecCorrection,
    resetQec,
    togglePlayPause,
    setAnimationSpeed,
    replayAnimation,
    toggleAutoRotateCamera,
    setNoiseIntensity,
  } = useQuantumLabState();

  const [activeGate, setActiveGate] = useState<string | null>(null);
  const [correctionTrigger, setCorrectionTrigger] = useState<number>(0);
  const lastGateRef = useRef<string>("H");
  const gateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerGateAnimation = useCallback((gate: string) => {
    lastGateRef.current = gate;
    setActiveGate(gate);
    if (gateTimeoutRef.current) clearTimeout(gateTimeoutRef.current);
    gateTimeoutRef.current = setTimeout(() => {
      setActiveGate(null);
    }, 750);
  }, []);

  useEffect(() => {
    if (replayTrigger > 0) {
      triggerGateAnimation(lastGateRef.current);
    }
  }, [replayTrigger, triggerGateAnimation]);

  // Metrics & calculations
  const metrics = computeStateMetrics(state);
  const t2Time = calculateT2CoherenceTime(temperature);
  const phaseDecay = applyPhaseDecay(Math.PI / 2, 0, 0.15, t2Time);
  const vectorPurity = phaseDecay.purity;
  const shorPeriod = runShorDemo(7).period;

  // Real-time Objective Evaluation
  const activeObjective = getObjectiveByTabIndex(activeTab);
  const isObjectiveCompleted = activeObjective
    ? evaluateObjective(activeObjective, {
        state,
        gateCount,
        observedP0: metrics.prob0,
        expectedP0: metrics.prob0,
        phasePhi: state.phi,
        entangledPair: entangledPair
          ? { alice: entangledPair.alice, bob: entangledPair.bob }
          : null,
        temperature,
        purity: vectorPurity,
        groverTargetProb: groverProbs[groverTarget],
        qecSyndrome: syndromeInfo?.syndrome,
        qecErrorIndex: syndromeInfo?.errorIndex,
        qecCorrectedTriple: qecTriple,
      })
    : false;

  const getObjectiveProgress = (): string => {
    switch (activeTab) {
      case 0:
        return gateCount <= 2 ? `${gateCount}/2 gates` : "Budget exceeded";
      case 1:
        return `P(|0⟩): ${(metrics.prob0 * 100).toFixed(0)}%`;
      case 2:
        return `φ = ${(state.phi / Math.PI).toFixed(2)}π`;
      case 3:
        return entangledPair
          ? `Observed: ${entangledPair.state}`
          : "Unmeasured";
      case 4:
        return `T = ${temperature} mK, ${(vectorPurity * 100).toFixed(0)}% purity`;
      case 5:
        return `P(target) = ${(groverProbs[groverTarget] * 100).toFixed(0)}%`;
      case 6:
        return syndromeInfo
          ? syndromeInfo.errorIndex === -1
            ? "Clean"
            : `Fixed q${syndromeInfo.errorIndex}`
          : "Ready";
      default:
        return "";
    }
  };

  // Dynamic Tier 2 Canvas Viewport switching
  const renderTier2Canvas = () => {
    switch (activeTab) {
      case 0:
      case 1:
      case 2:
        return (
          <CoreBlochSphere
            state={state}
            purity={1.0}
            interactive={true}
            onStateChange={setSingleQubitState}
            targetZone={activeTab === 0 ? { theta: Math.PI / 2, phi: 0 } : null}
            showGateRings={activeTab === 1}
            showMeasurementPlane={activeTab === 2}
            activeGate={activeGate}
            lastOutcome={lastOutcome}
            autoRotate={autoRotateCamera}
            animationSpeed={animationSpeed}
            isPlaying={isPlayingAnimation}
            className="fixed inset-0 z-0 w-full h-full rounded-none border-0 bg-transparent"
          />
        );
      case 3:
        return (
          <EntanglementDualSphere
            entangledPair={entangledPair}
            className="fixed inset-0 z-0 w-full h-full rounded-none border-0 bg-transparent"
          />
        );
      case 4:
        return (
          <CoreBlochSphere
            state={{ theta: Math.PI / 2, phi: 0 }}
            purity={vectorPurity}
            thermalCollapse={thermalCollapseFactor(temperature)}
            temperature={temperature}
            noiseIntensity={noiseIntensity}
            autoRotate={autoRotateCamera}
            animationSpeed={animationSpeed}
            isPlaying={isPlayingAnimation}
            interactive={false}
            className="fixed inset-0 z-0 w-full h-full rounded-none border-0 bg-transparent"
          />
        );
      case 5:
        return (
          <GroverBarChart3D
            groverProbs={groverProbs}
            targetIndex={groverTarget}
            className="fixed inset-0 z-0 w-full h-full rounded-none border-0 bg-transparent"
          />
        );
      case 6:
        return (
          <QECArray3D
            qecTriple={qecTriple}
            syndromeInfo={syndromeInfo}
            correctionTrigger={correctionTrigger}
            className="fixed inset-0 z-0 w-full h-full rounded-none border-0 bg-transparent"
          />
        );
      default:
        return null;
    }
  };

  // Tier 1 Header HUD: Top Bar with tabs, target card, inspector and system toggles
  const renderTier1Header = (
    <header
      data-testid="tier-1-header"
      className="pointer-events-none w-full flex items-center justify-between gap-2 sm:gap-3"
    >
      {/* Top-left: Workshop Navigation Tabs */}
      <div className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-xl border border-border bg-card/85 backdrop-blur-md shadow-md overflow-x-auto scrollbar-thin max-w-[50vw] lg:max-w-none">
        <span className="font-mono text-xs font-bold tracking-widest text-primary uppercase bg-secondary px-2.5 py-1 rounded border border-border shrink-0">
          QuantumLab
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {WORKSHOP_TABS.map((tab, idx) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTab(idx)}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === idx
                  ? "bg-secondary border border-primary text-primary shadow-sm shadow-primary/20"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Top-center: Real-time Target Goal Card (desktop) */}
      {activeObjective && (
        <div className="pointer-events-auto hidden lg:flex flex-1 justify-center max-w-sm lg:max-w-md mx-2">
          <TargetGoalCard
            objective={activeObjective}
            isCompleted={isObjectiveCompleted}
            progressText={getObjectiveProgress()}
          />
        </div>
      )}

      {/* Top-right: Integrated Telemetry Inspector + Language & Theme Controls */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
        <UnifiedBottomTelemetryPanel
          activeTab={activeTab}
          state={state}
          metrics={metrics}
          lastOutcome={lastOutcome}
          entangledPair={entangledPair}
          temperature={temperature}
          t2Time={t2Time}
          vectorPurity={vectorPurity}
          groverTarget={groverTarget}
          groverProbs={groverProbs}
          qecTriple={qecTriple}
          syndromeInfo={syndromeInfo}
          isObjectiveCompleted={isObjectiveCompleted}
          shorPeriod={shorPeriod}
          onGate={(gate) => {
            applySingleQubitGate(gate);
            playGateSweep(gate);
            triggerGateAnimation(gate);
          }}
          onMeasure={() => {
            measureSingleQubit();
            playCollapseDrop();
          }}
          onReset={() => {
            resetSingleQubit();
            playVectorSnap();
          }}
          onStateChange={setSingleQubitState}
          onMeasureEntangled={measureEntangled}
          onResetEntangled={resetEntangled}
          onTemperatureChange={setTemperature}
          onResetTemperature={() => setTemperature(15)}
          onSelectGroverTarget={setGroverTarget}
          onRunGrover={runGroverStep}
          onResetGrover={resetGrover}
          onInjectBitFlip={injectQecBitFlip}
          onRunSyndromeCorrection={() => {
            runQecCorrection();
            setCorrectionTrigger((prev) => prev + 1);
          }}
          onResetQec={resetQec}
          noiseIntensity={noiseIntensity}
          onNoiseIntensityChange={setNoiseIntensity}
          autoRotateCamera={autoRotateCamera}
          onToggleAutoRotateCamera={toggleAutoRotateCamera}
        />

        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border bg-card/85 backdrop-blur-md shadow-md shrink-0">
          <button
            type="button"
            onClick={toggleLanguage}
            data-testid="language-toggle-button"
            aria-label={t("header.toggle_language")}
            className="px-2 py-1 rounded-lg text-xs font-mono font-bold border border-border bg-card hover:bg-secondary text-foreground transition-colors flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>{locale === "en" ? "EN" : "ES"}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            data-testid="theme-toggle-button"
            aria-label={t("header.toggle_theme")}
            className="p-1.5 rounded-lg text-xs font-mono border border-border bg-card hover:bg-secondary text-foreground transition-colors flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-warning" />
            ) : (
              <Moon className="w-4 h-4 text-primary" />
            )}
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <MissionCanvasShell
      missionId={activeObjective?.id ?? "superposition"}
      activeObjective={activeObjective}
      isObjectiveCompleted={isObjectiveCompleted}
      objectiveProgress={getObjectiveProgress()}
      tier1Header={renderTier1Header}
      tier2Canvas={renderTier2Canvas()}
      tier2Overlays={
        <SpatialTooltipOverlay spatialId="state-vector" />
      }
      tier3Ribbon={
        <QuantumPipelineRibbon
          activeTab={activeTab}
          state={state}
          onPreparePreset={(preset) => {
            setSingleQubitState({ theta: preset.theta, phi: preset.phi });
            playVectorSnap();
          }}
          onTransformGate={(gate) => {
            applySingleQubitGate(gate);
            playGateSweep(gate);
            triggerGateAnimation(gate);
          }}
          onMeasure={() => {
            measureSingleQubit();
            playCollapseDrop();
          }}
          onReset={() => {
            resetSingleQubit();
            playVectorSnap();
          }}
          lastOutcome={lastOutcome}
          isPlayingAnimation={isPlayingAnimation}
          onTogglePlayPause={togglePlayPause}
          animationSpeed={animationSpeed}
          onSpeedChange={setAnimationSpeed}
          onReplayAnimation={replayAnimation}
          autoRotateCamera={autoRotateCamera}
          onToggleAutoRotateCamera={toggleAutoRotateCamera}
          entangledPair={entangledPair}
          onMeasureEntangled={measureEntangled}
          onResetEntangled={resetEntangled}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          onResetTemperature={() => setTemperature(15)}
          groverTarget={groverTarget}
          onSelectGroverTarget={setGroverTarget}
          onRunGrover={runGroverStep}
          onResetGrover={resetGrover}
          qecTriple={qecTriple}
          onInjectBitFlip={injectQecBitFlip}
          onRunSyndromeCorrection={() => {
            runQecCorrection();
            setCorrectionTrigger((prev) => prev + 1);
          }}
          onResetQec={resetQec}
        />
      }
    />
  );
}

export default QuantumLab;
