'use client';

import React from 'react';
import { MissionState } from '@/features/missions/domain/missionMachine';
import { MissionDefinition } from '@/features/missions/config/missions';

export interface MissionShellProps {
  mission?: MissionDefinition | Record<string, unknown>;
  title?: React.ReactNode;
  description?: React.ReactNode;
  currentStep?: number;
  totalSteps?: number;
  maxUnlockedStep?: number;
  state?: MissionState | string;
  onStepChange?: (step: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
  onBack?: () => void;
  onComplete?: () => void;
  isNextDisabled?: boolean;
  errorMessage?: string | null;
  helpMessage?: string | null;
  children?: React.ReactNode;
  assessmentNode?: React.ReactNode;
}

export const MissionShell: React.FC<MissionShellProps> = ({
  mission,
  title: titleProp,
  description: descriptionProp,
  currentStep = 0,
  totalSteps: totalStepsProp,
  maxUnlockedStep = 0,
  state = 'not_started',
  onStepChange = () => {},
  onNext,
  onPrev,
  onBack,
  isNextDisabled = false,
  errorMessage,
  helpMessage,
  children,
  assessmentNode,
}) => {
  const missionObj = mission as Record<string, unknown> | undefined;
  
  const title: React.ReactNode = titleProp ?? (missionObj?.title as React.ReactNode) ?? '';
  const description: React.ReactNode = descriptionProp ?? (missionObj?.description as React.ReactNode) ?? '';
  const totalSteps: number = 
    totalStepsProp ?? 
    (Array.isArray(missionObj?.steps) ? missionObj.steps.length : undefined) ?? 
    (Array.isArray(missionObj?.tasks) ? missionObj.tasks.length : undefined) ?? 
    1;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isCompleted = state === 'completed';

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full p-4 text-slate-100">
      <header className="flex flex-col gap-2 border-b border-slate-700 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-cyan-400 tracking-wide">{title}</h1>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-cyan-500/30 text-cyan-300 font-mono">
            {isCompleted ? 'Misión Completada' : `Paso ${currentStep + 1} de ${totalSteps}`}
          </span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
      </header>

      <nav aria-label="Progreso de la misión" className="flex items-center gap-2 py-2 overflow-x-auto">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const isCurrent = idx === currentStep;
          const isUnlocked = idx <= maxUnlockedStep || isCompleted;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => isUnlocked && onStepChange(idx)}
              disabled={!isUnlocked}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Ir al paso ${idx + 1}`}
              className={`flex-1 min-w-[40px] h-2.5 rounded-full transition-all duration-200 ${
                isCurrent
                  ? 'bg-cyan-400 ring-2 ring-cyan-300/50 scale-105'
                  : isUnlocked
                  ? 'bg-cyan-800 hover:bg-cyan-600 cursor-pointer'
                  : 'bg-slate-800 opacity-40 cursor-not-allowed'
              }`}
            />
          );
        })}
      </nav>

      {errorMessage && (
        <div role="alert" className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-lg text-rose-200 text-sm flex items-center gap-2">
          <span className="font-semibold">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {helpMessage && (
        <div className="p-3 bg-cyan-950/50 border border-cyan-500/30 rounded-lg text-cyan-200 text-sm flex items-center gap-2">
          <span className="font-semibold">💡 Tip:</span>
          <span>{helpMessage}</span>
        </div>
      )}

      <main className="min-h-[350px] bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm">
        {children}
      </main>

      {assessmentNode && (state === 'assessment' || isCompleted || isLastStep) && (
        <section aria-label="Evaluación de conocimientos" className="mt-4">
          {assessmentNode}
        </section>
      )}

      <footer className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirstStep && !onBack}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isFirstStep && !onBack
              ? 'opacity-30 cursor-not-allowed bg-slate-800 text-slate-400'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer border border-slate-700'
          }`}
        >
          ← Anterior
        </button>

        {!isLastStep && onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isNextDisabled
                ? 'opacity-40 cursor-not-allowed bg-cyan-950 text-cyan-500 border border-cyan-900'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 cursor-pointer'
            }`}
          >
            Siguiente →
          </button>
        )}
      </footer>
    </div>
  );
};
