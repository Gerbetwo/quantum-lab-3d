'use client';

import React, { use, useState } from 'react';
import { notFound } from 'next/navigation';
import LeanLabLayout from '@/shared/layout/LeanLabLayout';
import { useGuidedMission } from '@/features/missions/hooks/useGuidedMission';
import { BlochSphereWorkspace } from '@/components/quantum/BlochSphereWorkspace';
import { MathDock } from '@/components/quantum/MathDock';
import GatePalette from '@/features/circuit/components/GatePalette';
import type { GateType } from '@/core/math/circuit';

interface MissionPageProps {
  params: Promise<{ id: string }>;
}

const PHASE_STEPS = ['BRIEFING', 'PREDICTION', 'MANIPULATION', 'MEASUREMENT', 'VERIFICATION', 'SUCCESS'] as const;

export default function MissionPage({ params }: MissionPageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  if (!id) {
    notFound();
  }

  const guidedMission = useGuidedMission(id);
  const {
    missionState,
    currentStepIndex,
    totalSteps,
    currentStepConfig,
    submitPrediction,
    triggerMeasurement,
    advanceToNextStep,
  } = guidedMission;

  const currentPhase = missionState.currentPhase;
  const [selectedGate, setSelectedGate] = useState<GateType | null>(null);
  const [predictionProb0, setPredictionProb0] = useState<number>(0.5);

  const prob0 = predictionProb0;
  const prob1 = Math.max(0, Math.min(1, 1 - prob0));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPredictionProb0(parseFloat(e.target.value));
  };

  const handlePredictionSubmit = () => {
    submitPrediction(prob0);
  };

  const handlePrimaryAction = () => {
    switch (currentPhase) {
      case 'PREDICTION':
        submitPrediction(prob0);
        break;
      case 'MANIPULATION':
        triggerMeasurement();
        break;
      case 'MEASUREMENT':
      case 'VERIFICATION':
      case 'BRIEFING':
      case 'SUCCESS':
      default:
        advanceToNextStep();
        break;
    }
  };

  const getPrimaryButtonText = () => {
    switch (currentPhase) {
      case 'BRIEFING':
        return 'Start Step';
      case 'PREDICTION':
        return 'Confirm Prediction';
      case 'MANIPULATION':
        return 'Prepare Measurement';
      case 'MEASUREMENT':
        return 'Measure Qubit Wavefunction';
      case 'VERIFICATION':
        return 'Verify & Complete Step';
      case 'SUCCESS':
        return 'Next Step';
      default:
        return 'Continue';
    }
  };

  return (
    <LeanLabLayout>
      <div className="flex flex-col h-full min-h-screen bg-background text-foreground p-4 gap-4 font-mono">
        {/* Dynamic Top Header with Theme Tokens */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border backdrop-blur-md shadow-lg">
          <div>
            <span className="text-xs font-bold text-accent uppercase tracking-widest">
              Guided Quantum Mission
            </span>
            <h1 className="text-xl font-extrabold text-foreground">
              {currentStepConfig?.title || `Mission ${id}`}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Progress</span>
              <span className="text-sm font-bold text-accent">
                Phase {currentStepIndex + 1} of {totalSteps}
              </span>
            </div>

            {/* Stepper Phase Indicators */}
            <div className="flex items-center gap-2 bg-muted p-2 rounded-lg border border-border">
              {PHASE_STEPS.map((stepPhase, idx) => {
                const isActive = currentPhase === stepPhase;
                const isPast = PHASE_STEPS.indexOf(currentPhase as (typeof PHASE_STEPS)[number]) > idx;

                return (
                  <div
                    key={stepPhase}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all ${
                      isActive
                        ? 'bg-primary/20 text-accent border border-accent shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : isPast
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-background text-muted-foreground border border-border'
                    }`}
                  >
                    {stepPhase}
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        {/* 3-Panel HUD Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          {/* Left Panel: Briefing & Prediction Input */}
          <aside className="lg:col-span-3 flex flex-col gap-4 p-4 rounded-xl bg-card border border-border backdrop-blur-sm">
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-bold text-accent uppercase tracking-wider border-b border-border pb-2">
                Mission Briefing
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentStepConfig?.description ||
                  'Analyze the initial quantum state vector, configure gate transformations, and predict wavefunction measurement probabilities.'}
              </p>
            </section>

            {/* Prediction Input Card */}
            <section className="mt-auto flex flex-col gap-3 p-3 rounded-lg bg-background border border-border">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-foreground">Prediction Model</span>
                <span className="text-accent font-mono">
                  P(|0⟩): {(prob0 * 100).toFixed(0)}%
                </span>
              </div>

              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={prob0}
                  onChange={handleSliderChange}
                  disabled={currentPhase !== 'PREDICTION'}
                  className="w-full accent-accent cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>P(|0⟩): {(prob0 * 100).toFixed(0)}%</span>
                  <span>P(|1⟩): {(prob1 * 100).toFixed(0)}%</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePredictionSubmit}
                disabled={currentPhase !== 'PREDICTION'}
                className="w-full py-2 rounded bg-primary text-primary-foreground hover:bg-accent font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed cursor-pointer"
              >
                Submit Prediction
              </button>
            </section>
          </aside>

          {/* Center Panel: 3D Bloch Sphere Canvas */}
          <main className="lg:col-span-6 flex flex-col rounded-xl bg-card border border-border overflow-hidden relative min-h-[400px]">
            <div className="absolute top-3 left-3 z-10 bg-background/80 backdrop-blur px-3 py-1 rounded border border-border text-[10px] text-accent tracking-wider font-bold">
              Bloch Sphere Visualization
            </div>
            <div className="flex-1 w-full h-full">
              <BlochSphereWorkspace />
            </div>
          </main>

          {/* Right Panel: Gate Palette & Control Center */}
          <aside className="lg:col-span-3 flex flex-col gap-4 p-4 rounded-xl bg-card border border-border backdrop-blur-sm justify-between">
            <div>
              <h2 className="text-sm font-bold text-accent uppercase tracking-wider border-b border-border pb-2 mb-3">
                Quantum Controls
              </h2>
              <div className="flex justify-center">
                <GatePalette
                  selected={selectedGate}
                  onSelect={(g) => setSelectedGate(g)}
                />
              </div>
            </div>

            {/* State Transition Button */}
            <div className="pt-4 border-t border-border">
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-accent text-primary-foreground font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 cursor-pointer"
              >
                {getPrimaryButtonText()}
              </button>
            </div>
          </aside>
        </div>

        {/* Bottom Panel: Math Dock */}
        <footer className="w-full">
          <MathDock />
        </footer>
      </div>
    </LeanLabLayout>
  );
}