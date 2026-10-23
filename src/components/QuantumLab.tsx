'use client';

import React from 'react';
import {
  computeStateMetrics,
  applyPhaseDecay,
  calculateT2CoherenceTime,
} from '@/core/qubitMath';
import { runShorDemo } from '@/core/algorithms';
import { useQuantumLabState } from '@/hooks/useQuantumLabState';
import {
  getObjectiveByTabIndex,
  evaluateObjective,
} from '@/lib/quantum/objectivesConfig';
import {
  playGateSweep,
  playCollapseDrop,
  playVectorSnap,
} from '@/lib/audio/soundEngine';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

import { MissionCanvasShell } from './ui/MissionCanvasShell';
import { TargetGoalCard } from './ui/TargetGoalCard';
import { SpatialTooltipOverlay } from './ui/SpatialTooltipOverlay';
import { QuantumPipelineRibbon } from './ui/QuantumPipelineRibbon';

import { CoreBlochSphere } from './3d/CoreBlochSphere';
import { EntanglementDualSphere } from './3d/EntanglementDualSphere';
import { GroverBarChart3D } from './3d/GroverBarChart3D';
import { QECArray3D } from './3d/QECArray3D';

import { SingleQubitPanel } from './SingleQubitPanel';
import { EntanglementPanel, DecoherencePanel } from './EntanglementDecoherencePanels';
import { GroverPanel, QECPanel } from './AlgorithmWorkshopPanels';
import { Sun, Moon, Globe } from 'lucide-react';

export const WORKSHOP_TABS = [
  '1. Superposition',
  '2. Gates',
  '3. Measurement',
  '4. Entanglement',
  '5. Decoherence',
  '6. Grover Search',
  '7. Error Correction',
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
  } = useQuantumLabState();

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
        entangledPair: entangledPair ? { alice: entangledPair.alice, bob: entangledPair.bob } : null,
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
        return gateCount <= 2 ? `${gateCount}/2 gates` : 'Budget exceeded';
      case 1:
        return `P(|0⟩): ${(metrics.prob0 * 100).toFixed(0)}%`;
      case 2:
        return `φ = ${(state.phi / Math.PI).toFixed(2)}π`;
      case 3:
        return entangledPair ? `Observed: ${entangledPair.state}` : 'Unmeasured';
      case 4:
        return `T = ${temperature} mK, ${(vectorPurity * 100).toFixed(0)}% purity`;
      case 5:
        return `P(target) = ${(groverProbs[groverTarget] * 100).toFixed(0)}%`;
      case 6:
        return syndromeInfo
          ? syndromeInfo.errorIndex === -1
            ? 'Clean'
            : `Fixed q${syndromeInfo.errorIndex}`
          : 'Ready';
      default:
        return '';
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
            targetZone={activeTab === 0 ? { theta: Math.PI, phi: 0 } : null}
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
            className="fixed inset-0 z-0 w-full h-full rounded-none border-0 bg-transparent"
          />
        );
      default:
        return null;
    }
  };

  // Tier 1 Header HUD
  const renderTier1Header = (
    <header
      data-testid="tier-1-header"
      className="relative z-10 w-full pointer-events-auto p-2.5 sm:p-3 flex items-center justify-between gap-3 border-b border-border bg-card/85 backdrop-blur-md"
    >
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin py-0.5">
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
                  ? 'bg-secondary border border-primary text-primary shadow-sm shadow-cyan-500/20'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Target Goal Card */}
      {activeObjective && (
        <div className="hidden md:flex flex-1 justify-center max-w-sm mx-2">
          <TargetGoalCard
            objective={activeObjective}
            isCompleted={isObjectiveCompleted}
            progressText={getObjectiveProgress()}
          />
        </div>
      )}

      {/* Language & Theme Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={toggleLanguage}
          data-testid="language-toggle-button"
          aria-label={t('header.toggle_language')}
          className="px-2 py-1 rounded-lg text-xs font-mono font-bold border border-border bg-card hover:bg-secondary text-foreground transition-colors flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
        >
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span>{locale === 'en' ? 'EN' : 'ES'}</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          data-testid="theme-toggle-button"
          aria-label={t('header.toggle_theme')}
          className="p-1.5 rounded-lg text-xs font-mono border border-border bg-card hover:bg-secondary text-foreground transition-colors flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-warning" />
          ) : (
            <Moon className="w-4 h-4 text-primary" />
          )}
        </button>
      </div>
    </header>
  );

  return (
    <MissionCanvasShell
      missionId={activeObjective?.id ?? 'superposition'}
      activeObjective={activeObjective}
      isObjectiveCompleted={isObjectiveCompleted}
      objectiveProgress={getObjectiveProgress()}
      tier1Header={renderTier1Header}
      tier2Canvas={renderTier2Canvas()}
      tier2Overlays={
        <>
          {/* Top-Left Viewport Mode Badge */}
          <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2 z-10">
            <span className="text-xs uppercase tracking-widest text-primary font-mono font-semibold bg-background/90 backdrop-blur-md px-2.5 py-1 rounded border border-primary">
              {WORKSHOP_TABS[activeTab]} 3D
            </span>
            {activeTab === 4 && (
              <span className="text-xs font-mono text-muted-foreground bg-background/90 backdrop-blur-md px-2 py-0.5 rounded border border-border">
                Purity: {(vectorPurity * 100).toFixed(0)}%
              </span>
            )}
          </div>

          <SpatialTooltipOverlay spatialId="state-vector" />

          {/* Right Column: Floating Tactical Control Dashboard */}
          <div className="absolute top-4 right-4 bottom-24 w-full max-w-md pointer-events-auto overflow-y-auto rounded-2xl border border-border bg-card/90 backdrop-blur-md p-5 sm:p-6 shadow-2xl flex flex-col justify-between scrollbar-thin z-10">
            {activeTab <= 2 && (
              <SingleQubitPanel
                activeTab={activeTab}
                state={state}
                metrics={metrics}
                lastOutcome={lastOutcome}
                onGate={(g) => {
                  applySingleQubitGate(g);
                  playGateSweep(g);
                }}
                onMeasure={() => {
                  measureSingleQubit();
                  playCollapseDrop();
                }}
                onReset={() => {
                  resetSingleQubit();
                  playVectorSnap();
                }}
              />
            )}

            {activeTab === 3 && (
              <EntanglementPanel
                entangledPair={entangledPair}
                onMeasure={measureEntangled}
                onReset={resetEntangled}
              />
            )}

            {activeTab === 4 && (
              <DecoherencePanel
                temperature={temperature}
                t2Time={t2Time}
                vectorPurity={vectorPurity}
                onTemperatureChange={setTemperature}
                onReset={() => setTemperature(15)}
              />
            )}

            {activeTab === 5 && (
              <GroverPanel
                groverTarget={groverTarget}
                groverProbs={groverProbs}
                onSelectTarget={setGroverTarget}
                onRunGrover={runGroverStep}
                onReset={resetGrover}
              />
            )}

            {activeTab === 6 && (
              <QECPanel
                qecTriple={qecTriple}
                syndromeInfo={syndromeInfo}
                onInjectBitFlip={injectQecBitFlip}
                onRunSyndromeCorrection={runQecCorrection}
                onReset={resetQec}
              />
            )}

            {/* Shor Didactic Telemetry Footer */}
            <div className="text-[11px] font-mono text-muted-foreground flex justify-between items-center border-t border-border/50 pt-2.5 mt-4">
              <span>QuantumLab Workshop Suite</span>
              <span>Shor N=15 Reference (r={shorPeriod})</span>
            </div>
          </div>
        </>
      }
      tier3Ribbon={
        activeTab <= 2 ? (
          <QuantumPipelineRibbon
            onPreparePreset={(preset) => {
              setSingleQubitState({ theta: preset.theta, phi: preset.phi });
              playVectorSnap();
            }}
            onTransformGate={(gate) => {
              applySingleQubitGate(gate as any);
              playGateSweep(gate);
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
          />
        ) : (
          <div className="hidden" />
        )
      }
    />
  );
}

export default QuantumLab;
