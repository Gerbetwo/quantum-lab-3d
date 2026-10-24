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

import { MissionCanvasShell } from "./ui/MissionCanvasShell";
import { TargetGoalCard } from "./ui/TargetGoalCard";
import { SpatialTooltipOverlay } from "./ui/SpatialTooltipOverlay";
import { UnifiedBottomTelemetryPanel } from "./UnifiedBottomTelemetryPanel";
import { QuantumPipelineRibbon } from "./ui/QuantumPipelineRibbon";
import { GlassCard } from "./ui/GlassCard";

import { CoreBlochSphere } from "./3d/CoreBlochSphere";
import { EntanglementDualSphere } from "./3d/EntanglementDualSphere";
import { GroverBarChart3D } from "./3d/GroverBarChart3D";
import { QECArray3D } from "./3d/QECArray3D";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
  const tabKeys = [
    "superposition",
    "gates",
    "measurement",
    "entanglement",
    "decoherence",
    "grover",
    "qec",
  ] as const;
  const localizedTabs = tabKeys.map((key) => t(`tabs.${key}`));

  const {
    activeTab,
    state,
    lastOutcome,
    gateCount,
    gateHistory,
    entangledPair,
    twoQubitState,
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
  const [isMissionDropdownOpen, setIsMissionDropdownOpen] = useState<boolean>(false);
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
        return gateCount <= 2
          ? t('progress.gates_count', { count: gateCount })
          : t('progress.budget_exceeded');
      case 1:
        return `φ = ${(state.phi / Math.PI).toFixed(2)}π`;
      case 2:
        return `P(|0⟩): ${(metrics.prob0 * 100).toFixed(0)}%`;
      case 3:
        return entangledPair
          ? t('progress.observed', { state: entangledPair.state })
          : t('progress.unmeasured');
      case 4:
        return t('progress.purity_status', {
          temp: temperature,
          purity: (vectorPurity * 100).toFixed(0),
        });
      case 5:
        return t('progress.target_prob', {
          prob: (groverProbs[groverTarget] * 100).toFixed(0),
        });
      case 6:
        return syndromeInfo
          ? syndromeInfo.errorIndex === -1
            ? t('progress.clean')
            : t('progress.fixed_qubit', { idx: syndromeInfo.errorIndex })
          : t('progress.ready');
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
            state={state}
            interactive={true}
            onStateChange={setSingleQubitState}
            className="fixed inset-0 z-0 w-full h-full rounded-none border-0 bg-transparent"
          />
        );
      case 4:
        return (
          <CoreBlochSphere
            state={state}
            purity={vectorPurity}
            thermalCollapse={thermalCollapseFactor(temperature)}
            temperature={temperature}
            noiseIntensity={noiseIntensity}
            autoRotate={autoRotateCamera}
            animationSpeed={animationSpeed}
            isPlaying={isPlayingAnimation}
            interactive={true}
            onStateChange={setSingleQubitState}
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

  // Tier 1 Header HUD: Compact Mission Dropdown, Centered Target Card, Telemetry Inspector
  const renderTier1Header = (
    <div className="pointer-events-none w-full flex items-center justify-between gap-2 sm:gap-3">
      {/* Top-left: Mission Dropdown Menu attached to QuantumLab title */}
      <div className="relative inline-block text-left pointer-events-auto shrink-0">
        <button
          type="button"
          onClick={() => setIsMissionDropdownOpen((prev) => !prev)}
          data-testid="mission-dropdown-trigger"
          aria-expanded={isMissionDropdownOpen}
          aria-haspopup="true"
          className="flex items-center gap-2 p-1.5 rounded-xl border border-border bg-card/85 backdrop-blur-md shadow-md hover:bg-secondary cursor-pointer transition-colors active:scale-95"
        >
          <span className="font-mono text-xs font-bold tracking-widest text-primary uppercase bg-secondary px-2.5 py-1 rounded border border-border shrink-0">
            QuantumLab
          </span>
          <span className="text-xs font-mono text-foreground font-semibold pr-1 hidden sm:inline">
            {localizedTabs[activeTab]}
          </span>
          {isMissionDropdownOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          )}
        </button>

        {isMissionDropdownOpen && (
          <div
            data-testid="mission-dropdown-menu"
            className="absolute left-0 top-full mt-2 w-56 sm:w-64 z-40"
          >
            <GlassCard className="p-1.5 space-y-1 rounded-xl shadow-2xl border border-border bg-card/95 backdrop-blur-md">
              {localizedTabs.map((tab, idx) => (
                <button
                  key={tabKeys[idx]}
                  type="button"
                  data-testid={`mission-select-${idx}`}
                  onClick={() => {
                    setTab(idx);
                    setIsMissionDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === idx
                      ? "bg-secondary border border-primary text-primary shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent"
                  }`}
                >
                  <span className="truncate">{tab}</span>
                  {activeTab === idx && (
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-1.5" />
                  )}
                </button>
              ))}
            </GlassCard>
          </div>
        )}
      </div>

      {/* Top-center: Centered Mission Objective & Target Goal Card */}
      {activeObjective && (
        <div className="pointer-events-auto flex mx-auto flex-1 justify-center max-w-md">
          <TargetGoalCard
            objective={activeObjective}
            isCompleted={isObjectiveCompleted}
            progressText={getObjectiveProgress()}
          />
        </div>
      )}

      {/* Top-right: Integrated Telemetry Inspector */}
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
          gateHistory={gateHistory}
          activeGate={activeGate || (gateHistory.length > 0 ? gateHistory[gateHistory.length - 1] : "H")}
          twoQubitState={twoQubitState}
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
      </div>
    </div>
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
        <SpatialTooltipOverlay spatialId="state-vector" showCoordinates={true} />
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
