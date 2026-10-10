'use client';

import React from 'react';
import type { MissionDefinition, StepDefinition } from '@/features/missions/config/missions';

export interface MissionShellProps {
  mission?: MissionDefinition;
  config?: MissionDefinition;
  currentStep?: StepDefinition;
  currentStepIndex?: number;
  totalSteps?: number;
  progress?: number;
  isCompleted?: boolean;
  isContinueDisabled?: boolean;
  onPrevious?: () => void;
  onContinue?: () => void;
  children?: React.ReactNode;
}

export function MissionShell({
  mission,
  config,
  currentStep,
  currentStepIndex = 0,
  totalSteps = 1,
  progress = 0,
  isCompleted = false,
  isContinueDisabled = false,
  onPrevious,
  onContinue,
  children,
}: MissionShellProps) {
  const data = mission || config;
  const stepNum = currentStepIndex + 1;

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 p-6 max-w-4xl mx-auto">
      {/* Mission Header */}
      <div className="mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full">
            Misión {data?.order ?? ''}
          </span>
          <span className="text-xs font-medium text-slate-400">
            Paso {stepNum} de {totalSteps} ({progress}%)
          </span>
        </div>
        <h1 className="text-2xl font-bold text-cyan-400 tracking-tight">
          {data?.title ?? 'Misión Cuántica'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {data?.description ?? data?.subtitle ?? ''}
        </p>
        {data?.learningObjective && (
          <div className="mt-3 p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-300">
            <span className="font-semibold text-cyan-300">Objetivo de aprendizaje:</span>{' '}
            {data.learningObjective}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 h-1.5 rounded-full mb-6 overflow-hidden">
        <div
          className="bg-cyan-500 h-full transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>

      {/* Current Step Instruction Area */}
      {currentStep && (
        <div className="mb-6 p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <h2 className="text-sm font-semibold text-cyan-300 mb-1">
            {currentStep.title}
          </h2>
          <p className="text-sm text-slate-200">{currentStep.instruction}</p>
        </div>
      )}

      {/* Main Content / Result Area */}
      <div className="flex-1 flex flex-col gap-4 mb-6">
        {children}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-auto">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentStepIndex <= 0}
          className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
            currentStepIndex <= 0
              ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-600'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer'
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
          disabled={isContinueDisabled}
          className={`px-6 py-2 rounded-lg text-xs font-semibold transition-all ${
            isContinueDisabled
              ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700'
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