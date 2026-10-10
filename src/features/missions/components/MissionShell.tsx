'use client';

import React, { useState, useEffect } from 'react';
import type { MissionDefinition, StepDefinition } from '@/features/missions/config/missions';

export interface MissionShellProps {
  mission?: MissionDefinition;
  config?: MissionDefinition;
  currentStep?: StepDefinition;
  currentStepIndex?: number | null;
  totalSteps?: number;
  progress?: number;
  isCompleted?: boolean;
  isContinueDisabled?: boolean | null;
  onPrevious?: () => void;
  onContinue?: () => void;
  children?: React.ReactNode;
}

export function MissionShell({
  mission,
  config,
  currentStep,
  currentStepIndex: rawStepIndex,
  totalSteps = 1,
  progress = 0,
  isCompleted = false,
  isContinueDisabled: rawIsContinueDisabled,
  onPrevious,
  onContinue,
  children,
}: MissionShellProps) {
  // Guard against SSR/Client state rehydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = mission || config;

  // Handle nullish prop values explicitly
  const currentStepIndex = rawStepIndex ?? 0;
  const isContinueDisabled = rawIsContinueDisabled ?? false;
  const stepNum = currentStepIndex + 1;

  // Ensure strict boolean evaluation for disabled attributes
  const isPreviousDisabled = !isMounted || currentStepIndex <= 0;
  const isNextDisabled = !isMounted || Boolean(isContinueDisabled);

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground p-6 max-w-4xl mx-auto">
      {/* Mission Header */}
      <div className="mb-6 border-b border-border pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-950 text-accent border border-cyan-800 rounded-full">
            Misión {data?.order ?? ''}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Paso {stepNum} de {totalSteps} ({progress}%)
          </span>
        </div>
        <h1 className="text-2xl font-bold text-accent tracking-tight">
          {data?.title ?? 'Misión Cuántica'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data?.description ?? data?.subtitle ?? ''}
        </p>
        {data?.learningObjective && (
          <div className="mt-3 p-3 bg-background/80 border border-border rounded-lg text-xs text-muted-foreground">
            <span className="font-semibold text-accent">Objetivo de aprendizaje:</span>{' '}
            {data.learningObjective}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-background h-1.5 rounded-full mb-6 overflow-hidden">
        <div
          className="bg-cyan-500 h-full transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>

      {/* Current Step Instruction Area */}
      {currentStep && (
        <div className="mb-6 p-4 bg-background/60 border border-border/80 rounded-xl">
          <h2 className="text-sm font-semibold text-accent mb-1">
            {currentStep.title}
          </h2>
          <p className="text-sm text-foreground">{currentStep.instruction}</p>
        </div>
      )}

      {/* Main Content / Result Area */}
      <div className="flex-1 flex flex-col gap-4 mb-6">
        {children}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
        <button
          type="button"
          onClick={onPrevious}
          disabled={Boolean(isPreviousDisabled)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
            isPreviousDisabled
              ? 'opacity-40 cursor-not-allowed bg-background border-border text-slate-600'
              : 'bg-background hover:bg-card border-border text-foreground cursor-pointer'
          }`}
        >
          ← Anterior
        </button>

        {isCompleted && (
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg">
            ✨ Misión Completada
          </span>
        )}

        <button
          type="button"
          onClick={onContinue}
          disabled={Boolean(isNextDisabled)}
          className={`px-6 py-2 rounded-lg text-xs font-semibold transition-all ${
            isNextDisabled
              ? 'opacity-40 cursor-not-allowed bg-card text-muted-foreground border border-border'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-lg shadow-cyan-500/20'
          }`}
        >
          {currentStepIndex >= totalSteps - 1 ? 'Finalizar Misión' : 'Continuar →'}
        </button>
      </div>
    </div>
  );
}

export default MissionShell;