'use client';

import React from 'react';
import {
  type QubitState,
  computeStateMetrics,
  applyPhaseDecay,
  calculateT2CoherenceTime,
} from '@/core/qubitMath';
import { runShorDemo } from '@/core/algorithms';
import { useQuantumLabState } from '@/hooks/useQuantumLabState';
import { CoreBlochSphere } from './3d/CoreBlochSphere';
import { SingleQubitPanel } from './SingleQubitPanel';
import { EntanglementPanel, DecoherencePanel } from './EntanglementDecoherencePanels';
import { GroverPanel, QECPanel } from './AlgorithmWorkshopPanels';

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
  const {
    activeTab,
    state,
    lastOutcome,
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

  // Single-qubit metrics
  const metrics = computeStateMetrics(state);

  // Decoherence calculations
  const t2Time = calculateT2CoherenceTime(temperature);
  const phaseDecay = applyPhaseDecay(Math.PI / 2, 0, 0.15, t2Time);
  const vectorPurity = phaseDecay.purity;

  // Viewport state computation for current tab
  const getViewportState = (): { state: QubitState; purity: number } => {
    if (activeTab <= 2) return { state, purity: 1.0 };
    if (activeTab === 3) {
      if (!entangledPair) return { state: { theta: Math.PI / 2, phi: 0 }, purity: 1.0 };
      return {
        state: entangledPair.alice === 0 ? { theta: 0, phi: 0 } : { theta: Math.PI, phi: 0 },
        purity: 1.0,
      };
    }
    if (activeTab === 4) return { state: { theta: Math.PI / 2, phi: 0 }, purity: vectorPurity };
    if (activeTab === 5) {
      const angles = [
        { theta: 0, phi: 0 },
        { theta: Math.PI / 2, phi: 0 },
        { theta: Math.PI / 2, phi: Math.PI },
        { theta: Math.PI, phi: 0 },
      ];
      const isAmplified = groverProbs[groverTarget] > 0.8;
      return {
        state: isAmplified ? angles[groverTarget] : { theta: Math.PI / 2, phi: 0 },
        purity: 1.0,
      };
    }
    return {
      state: qecTriple[0] === 1 ? { theta: Math.PI, phi: 0 } : { theta: 0, phi: 0 },
      purity: 1.0,
    };
  };

  const { state: activeViewportState, purity: activePurity } = getViewportState();
  const shorPeriod = runShorDemo(7).period;

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-3 sm:p-5 lg:p-8">
      <div className="w-full max-w-6xl bg-card border border-border rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
        {/* Step Navigation Ribbon */}
        <div className="flex items-center overflow-x-auto border-b border-border bg-background p-2 sm:p-2.5 gap-1.5 scrollbar-thin">
          {WORKSHOP_TABS.map((tab, idx) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTab(idx)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === idx
                  ? 'bg-secondary border border-primary text-primary shadow-sm shadow-cyan-500/20'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Column: 3D Bloch Sphere Viewport */}
          <div className="relative min-h-90 sm:min-h-110 lg:min-h-140 bg-background border-b lg:border-b-0 lg:border-r border-border flex items-center justify-center p-4">
            <CoreBlochSphere
              state={activeViewportState}
              purity={activePurity}
              className="w-full h-full min-h-85"
              interactive={activeTab <= 2}
              onStateChange={activeTab <= 2 ? setSingleQubitState : undefined}
              targetZone={activeTab === 0 ? { theta: Math.PI, phi: 0 } : null}
            />
            <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-primary font-mono font-semibold bg-background px-2.5 py-1 rounded border border-primary">
                Bloch Sphere 3D
              </span>
              {activeTab === 4 && (
                <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                  Purity: {(activePurity * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Dynamic Control Dashboard */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            {activeTab <= 2 && (
              <SingleQubitPanel
                activeTab={activeTab}
                state={state}
                metrics={metrics}
                lastOutcome={lastOutcome}
                onGate={applySingleQubitGate}
                onMeasure={measureSingleQubit}
                onReset={resetSingleQubit}
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
            <div className="text-[11px] font-mono text-muted-foreground flex justify-between items-center border-t border-border/50 pt-2">
              <span>QuantumLab Workshop Suite</span>
              <span>Shor N=15 Reference (r={shorPeriod})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuantumLab;
