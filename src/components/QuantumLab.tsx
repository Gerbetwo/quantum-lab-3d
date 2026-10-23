'use client';

import React, { useState } from 'react';
import {
  type QubitState,
  computeStateMetrics,
  applyGate,
  measureState,
} from '@/lib/quantumCore';
import {
  simulateGroverStep,
  runShorDemo,
  detectBitFlipSyndrome,
  injectBitFlip,
  bitFlipEncode,
  type BitTriple,
  type GroverStepState,
} from '@/core/algorithms';
import {
  measureEntangledQubit,
  applyPhaseDecay,
  calculateT2CoherenceTime,
} from '@/core/qubitMath';
import { BlochSphereViewport } from './BlochSphereViewport';
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
  const [activeTab, setActiveTab] = useState<number>(0);

  // Tabs 1-3 State (Single Qubit Kinematics)
  const [state, setState] = useState<QubitState>({
    theta: Math.PI / 2,
    phi: 0,
  });
  const [lastOutcome, setLastOutcome] = useState<0 | 1 | null>(null);

  // Tab 4 State (Entanglement)
  const [entangledPair, setEntangledPair] = useState<{
    alice: 0 | 1;
    bob: 0 | 1;
    state: string;
  } | null>(null);

  // Tab 5 State (Decoherence)
  const [temperature, setTemperature] = useState<number>(15);

  // Tab 6 State (Grover Search)
  const [groverTarget, setGroverTarget] = useState<number>(1);
  const [groverState, setGroverState] = useState<GroverStepState | null>(null);

  // Tab 7 State (QEC)
  const [qecTriple, setQecTriple] = useState<BitTriple>(bitFlipEncode(0));
  const [syndromeInfo, setSyndromeInfo] = useState<{
    syndrome: number;
    errorIndex: number;
    corrected: BitTriple;
  } | null>(null);

  // Single-qubit metrics
  const metrics = computeStateMetrics(state);

  // Decoherence calculations
  const t2Time = calculateT2CoherenceTime(temperature);
  const phaseDecay = applyPhaseDecay(Math.PI / 2, 0, 0.15, t2Time);
  const vectorPurity = phaseDecay.purity;

  // Single qubit handlers
  const handleGate = (gate: 'H' | 'X' | 'Z') => {
    setState((prev) => applyGate(prev, gate));
    setLastOutcome(null);
  };

  const handleMeasure = () => {
    const res = measureState(state);
    setState(res.newState);
    setLastOutcome(res.outcome);
  };

  const handleReset = () => {
    setState({ theta: 0, phi: 0 });
    setLastOutcome(null);
  };

  // Entanglement handlers
  const handleMeasureEntangled = () => {
    const res = measureEntangledQubit();
    setEntangledPair({
      alice: res.aliceOutcome,
      bob: res.bobOutcome,
      state: res.state,
    });
  };

  // Grover handlers
  const handleRunGrover = () => {
    setGroverState(simulateGroverStep(2, groverTarget, 1));
  };

  // QEC handlers
  const handleInjectBitFlip = (idx: 0 | 1 | 2 = 1) => {
    setQecTriple((prev) => injectBitFlip(prev, idx));
    setSyndromeInfo(null);
  };

  const handleRunSyndromeCorrection = () => {
    const res = detectBitFlipSyndrome(qecTriple);
    setSyndromeInfo(res);
    setQecTriple(res.corrected);
  };

  const handleResetQEC = (bit: 0 | 1 = 0) => {
    setQecTriple(bitFlipEncode(bit));
    setSyndromeInfo(null);
  };

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
      return {
        state: groverState ? angles[groverTarget] : { theta: Math.PI / 2, phi: 0 },
        purity: 1.0,
      };
    }
    return {
      state: qecTriple[0] === 1 ? { theta: Math.PI, phi: 0 } : { theta: 0, phi: 0 },
      purity: 1.0,
    };
  };

  const { state: activeViewportState, purity: activePurity } = getViewportState();
  const groverProbs = groverState ? groverState.probabilities : [0.25, 0.25, 0.25, 0.25];
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
              onClick={() => setActiveTab(idx)}
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
            <BlochSphereViewport
              state={activeViewportState}
              purity={activePurity}
              className="w-full h-full min-h-85"
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
                onGate={handleGate}
                onMeasure={handleMeasure}
                onReset={handleReset}
              />
            )}

            {activeTab === 3 && (
              <EntanglementPanel
                entangledPair={entangledPair}
                onMeasure={handleMeasureEntangled}
                onReset={() => setEntangledPair(null)}
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
                onSelectTarget={(idx) => {
                  setGroverTarget(idx);
                  setGroverState(null);
                }}
                onRunGrover={handleRunGrover}
                onReset={() => setGroverState(null)}
              />
            )}

            {activeTab === 6 && (
              <QECPanel
                qecTriple={qecTriple}
                syndromeInfo={syndromeInfo}
                onInjectBitFlip={handleInjectBitFlip}
                onRunSyndromeCorrection={handleRunSyndromeCorrection}
                onReset={handleResetQEC}
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
