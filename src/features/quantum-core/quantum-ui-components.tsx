'use client';

import * as THREE from 'three';
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
// --- Section: src/features/missions/components/KnowledgeCheck.tsx ---
export interface QuizOption {
  id: string;
  text: string;
  explanation?: string;
}

export interface QuizDefinition {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation?: string;
}

export interface KnowledgeCheckProps {
  quiz?: QuizDefinition;
  question?: string;
  options?: QuizOption[];
  correctOptionId?: string;
  selectedOptionId: string | null;
  onSelectOption: (id: string) => void;
  onPass: () => void;
  title?: string;
}

export const KnowledgeCheck: React.FC<KnowledgeCheckProps> = ({
  quiz,
  question: propQuestion,
  options: propOptions,
  correctOptionId: propCorrectOptionId,
  selectedOptionId,
  onSelectOption,
  onPass,
  title = 'Comprobación de Conocimiento',
}) => {
  const question = quiz?.question ?? propQuestion ?? '';
  const options: QuizOption[] = quiz?.options ?? propOptions ?? [];
  const correctOptionId = quiz?.correctOptionId ?? propCorrectOptionId ?? '';

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [passedCalled, setPassedCalled] = useState<boolean>(false);

  const isCorrect = selectedOptionId === correctOptionId;

  const handleSubmit = (_e: React.FormEvent) => {
    _e.preventDefault();
    if (!selectedOptionId) return;
    setSubmitted(true);

    if (selectedOptionId === correctOptionId) {
      if (!passedCalled) {
        setPassedCalled(true);
        onPass();
      }
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setPassedCalled(false);
  };

  return (
    <section
      aria-labelledby="quiz-heading"
      className="bg-background-90 border border-border rounded-xl p-6 shadow-xl flex flex-col gap-4 text-foreground"
    >
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="text-xl" aria-hidden="true">🧠</span>
        <h2 id="quiz-heading" className="text-lg font-bold text-accent">
          {title}
        </h2>
      </div>

      <p className="text-base font-medium text-foreground">{question}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
        <div role="radiogroup" aria-label={question} className="flex flex-col gap-2">
          {options.map((opt: QuizOption) => {
            const isSelected = selectedOptionId === opt.id;
            return (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-accent-border bg-accent-subtle ring-1 ring-ring'
                    : 'border-border bg-background-50 hover:border-border hover:bg-card-50'
                } ${submitted ? 'cursor-default' : ''}`}
              >
                <input
                  type="radio"
                  name="quiz-option"
                  value={opt.id}
                  checked={isSelected}
                  disabled={submitted}
                  onChange={() => !submitted && onSelectOption(opt.id)}
                  className="mt-1 text-accent focus:ring-ring focus:ring-offset-slate-900"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{opt.text}</span>
                  {submitted && isSelected && opt.explanation && (
                    <span className="text-xs text-muted-foreground mt-1 italic">{opt.explanation}</span>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        <div aria-live="polite" className="mt-2">
          {submitted && (
            <div
              className={`p-4 rounded-lg border text-sm flex flex-col gap-2 ${
                isCorrect
                  ? 'bg-success-subtle border-success-border text-success'
                  : 'bg-destructive-subtle border-destructive-border text-destructive'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                <span>{isCorrect ? '✅ ¡Correcto!' : '❌ Respuesta Incorrecta'}</span>
              </div>
              <p>
                {isCorrect
                  ? '¡Has demostrado comprender el concepto clave! Puedes continuar o revisar la misión.'
                  : 'Revisa las explicaciones de la misión y vuelve a intentarlo.'}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          {!submitted ? (
            <button
              type="submit"
              disabled={!selectedOptionId}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                !selectedOptionId
                  ? 'opacity-40 cursor-not-allowed bg-card text-muted-foreground border border-border'
                  : 'bg-accent hover:bg-accent text-accent-foreground cursor-pointer shadow-lg shadow-hud-glow'
              }`}
            >
              Validar Respuesta
            </button>
          ) : (
            !isCorrect && (
              <button
                type="button"
                onClick={handleRetry}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-card hover:bg-muted text-foreground border border-border cursor-pointer transition-all"
              >
                🔄 Reintentar
              </button>
            )
          )}
        </div>
      </form>
    </section>
  );
};

import { createScene } from '@/components/BlochCanvas';
import { Tooltip } from '@/components/MathHUD';
import { QuantumCircuit, QubitIndex, createEmptyCircuit, StateVectorHistory, evaluateFullCircuit, GateType, StateVector } from '@/lib/quantumCore';
// --- Section: src/features/missions/components/MissionRegistry.tsx ---
import { useQuantumStore } from '@/store/useQuantumStore';
import clsx from 'clsx';
import Link from 'next/link';
import {
  X as XIcon,
  Link as LinkIcon,
  Hash,
  Activity,
  type LucideIcon,
  Sparkles,
  Zap,
  Sigma,
  Triangle,
  Snowflake,
  RefreshCw,
  Atom,
  BarChart3,
  Circle,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  getMissionById,
  isMissionId,
  type MissionId,
  useGuidedMission,
  type MissionDefinition,
  type StepDefinition,
} from './quantum-missions-core';

const MissionLoader = () => (
  <div
    className="flex items-center justify-center p-12 text-muted-foreground"
    role="status"
    aria-live="polite"
  >
    <span className="animate-pulse">Loading quantum module...</span>
  </div>
);

const SuperpositionExperience = dynamic(
  () => import('@/features/quantum-core/mission-experiences').then((m) => m.SuperpositionExperience),
  { loading: () => <MissionLoader />, ssr: false }
);

const EntanglementExperience = dynamic(
  () => import('@/features/quantum-core/mission-experiences').then((m) => m.EntanglementExperience),
  { loading: () => <MissionLoader />, ssr: false }
);

const ErrorCorrectionExperience = dynamic(
  () => import('@/features/quantum-core/mission-experiences').then((m) => m.ErrorCorrectionExperience),
  { loading: () => <MissionLoader />, ssr: false }
);

const GatesExperience = dynamic(
  () => import('@/features/quantum-core/mission-experiences').then((m) => m.GatesExperience),
  { loading: () => <MissionLoader />, ssr: false }
);

const DecoherenceExperience = dynamic(
  () => import('@/features/quantum-core/mission-experiences').then((m) => m.DecoherenceExperience),
  { loading: () => <MissionLoader />, ssr: false }
);

const GroverExperience = dynamic(
  () => import('@/features/quantum-core/mission-experiences').then((m) => m.GroverExperience),
  { loading: () => <MissionLoader />, ssr: false }
);

const ApplicationsExperience = dynamic(
  () => import('@/features/quantum-core/mission-experiences').then((m) => m.ApplicationsExperience),
  { loading: () => <MissionLoader />, ssr: false }
);

const missionExperienceMap: Record<
  MissionId,
  React.ComponentType<Record<string, unknown>>
> = {
  superposition: SuperpositionExperience,
  entanglement: EntanglementExperience,
  "error-correction": ErrorCorrectionExperience,
  gates: GatesExperience,
  decoherence: DecoherenceExperience,
  grover: GroverExperience,
  applications: ApplicationsExperience,
};

export interface MissionRegistryProps {
  missionId?: string;
  [key: string]: unknown;
}

export function MissionRegistry({
  missionId = "superposition",
  ...props
}: MissionRegistryProps) {
  const canonicalId: MissionId = isMissionId(missionId) ? missionId : "superposition";
  const mission = getMissionById(canonicalId);
  const guided = useGuidedMission(canonicalId);

  const isQuizStep = guided.currentStep?.id === "knowledge-check";
  const isMissionUnlocked = mission?.unlocked ?? guided.isUnlocked;

  if (!isMissionUnlocked) {
    const prereqId = Array.isArray(mission?.prerequisites)
      ? mission.prerequisites[0]
      : (mission?.prerequisites as unknown as string);
    const prereqMission = prereqId && isMissionId(prereqId) ? getMissionById(prereqId) : null;

    return (
      <MissionShell
        mission={mission}
        currentStep={guided.currentStep}
        currentStepIndex={guided.currentStepIndex}
        totalSteps={guided.totalSteps}
        progress={guided.progress}
        isCompleted={guided.isCompleted}
        isContinueDisabled={true}
        onPrevious={guided.previousStep}
        onContinue={guided.nextStep}
        {...props}
      >
        <div
          className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-xl border border-border"
          role="region"
          aria-label="Mission Locked"
        >
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Mission Locked
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            You must complete the prerequisite mission{" "}
            <span className="font-medium text-accent">
              {prereqMission?.title || prereqId || "prior mission"}
            </span>{" "}
            before accessing this quantum module.
          </p>
          {prereqId && (
            <Link
              href={`/missions/${prereqId}`}
              className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Go to Prerequisite Mission
            </Link>
          )}
        </div>
      </MissionShell>
    );
  }

  const MissionComponent = missionExperienceMap[canonicalId] || SuperpositionExperience;

  return (
    <MissionShell
      mission={mission}
      currentStep={guided.currentStep}
      currentStepIndex={guided.currentStepIndex}
      totalSteps={guided.totalSteps}
      progress={guided.progress}
      isCompleted={guided.isCompleted}
      isContinueDisabled={!isMissionUnlocked || (isQuizStep && !guided.quizPassed)}
      onPrevious={guided.previousStep}
      onContinue={guided.nextStep}
      {...props}
    >
      {isQuizStep && mission?.quiz ? (
        <KnowledgeCheck
          quiz={mission.quiz}
          selectedOptionId={(guided.interactionState.selectedOptionId as string) || null}
          onSelectOption={(_id) => guided.updateInteraction({ selectedOptionId: _id })}
          onPass={guided.passQuiz}
        />
      ) : (
        <MissionComponent currentStep={guided.currentStep} guided={guided} />
      )}
    </MissionShell>
  );
}

// --- Section: src/features/missions/components/MissionShell.tsx ---
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
  const [isMounted] = useState(true);
  const data = mission || config;

  const currentStepIndex = rawStepIndex ?? 0;
  const isContinueDisabled = rawIsContinueDisabled ?? false;
  const stepNum = currentStepIndex + 1;

  const isPreviousDisabled = !isMounted || currentStepIndex <= 0;
  const isNextDisabled = !isMounted || Boolean(isContinueDisabled);

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground p-6 max-w-4xl mx-auto">
      <div className="mb-6 border-b border-border pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-accent-subtle text-accent border border-accent-border rounded-full">
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
          <div className="mt-3 p-3 bg-background-80 border border-border rounded-lg text-xs text-muted-foreground">
            <span className="font-semibold text-accent">Objetivo de aprendizaje:</span>{' '}
            {data.learningObjective}
          </div>
        )}
      </div>

      <div className="w-full bg-background h-1.5 rounded-full mb-6 overflow-hidden">
        <div
          className="bg-accent h-full transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>

      {currentStep && (
        <div className="mb-6 p-4 bg-background-60 border border-border-80 rounded-xl">
          <h2 className="text-sm font-semibold text-accent mb-1">
            {currentStep.title}
          </h2>
          <p className="text-sm text-foreground">{currentStep.description}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-4 mb-6">
        {children}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
        <button
          type="button"
          onClick={onPrevious}
          disabled={Boolean(isPreviousDisabled)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
            isPreviousDisabled
              ? 'opacity-40 cursor-not-allowed bg-background border-border text-muted-foreground'
              : 'bg-background hover:bg-card border-border text-foreground cursor-pointer'
          }`}
        >
          ← Anterior
        </button>

        {isCompleted && (
          <span className="text-xs font-semibold text-success bg-success-subtle border border-success-border px-3 py-1.5 rounded-lg">
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
              : 'bg-accent hover:bg-accent text-accent-foreground cursor-pointer shadow-lg shadow-hud-glow'
          }`}
        >
          {currentStepIndex >= totalSteps - 1 ? 'Finalizar Misión' : 'Continuar →'}
        </button>
      </div>
    </div>
  );
}

// --- Section: src/features/circuit/components/CircuitGrid.tsx ---
interface CircuitGridProps {
  circuit: QuantumCircuit;
  totalQubits?: number;
  depth?: number;
  playhead?: number;
  activeGate?: string | null;
  onSetPlayhead?: (step: number) => void;
  onPlaceGate: (step: number, qubit: number) => void;
  onRemoveGate?: (gateId: string) => void;
}

export function CircuitGrid({
  circuit,
  totalQubits,
  depth,
  playhead = 0,
  activeGate: _activeGate,
  onSetPlayhead,
  onPlaceGate,
  onRemoveGate,
}: CircuitGridProps) {
  const numQubits = totalQubits ?? circuit?.numQubits ?? (circuit as any)?.nQubits ?? 3;
  const gridDepth = depth ?? circuit?.maxDepth ?? 16;

  const qubits = Array.from({ length: Number(numQubits) }, (_, i) => i as QubitIndex);
  const steps = Array.from({ length: Number(gridDepth) }, (_, i) => i);

  const handleGridKeyDown = (e: React.KeyboardEvent, gateId?: string) => {
    if (e.key === 'Delete' && onRemoveGate && gateId) {
      onRemoveGate(gateId);
    }
  };

  return (
    <div data-testid="circuit-grid" className="flex flex-col bg-background p-4 rounded-lg overflow-x-auto" role="grid">
      <div className="flex space-x-2 mb-2">
        {steps.map((s) => {
          const isActive = playhead === s;
          return (
            <div
              key={String(s)}
              data-testid={`playhead-${s}`}
              {...(isActive ? { 'data-playhead': 'true' } : {})}
              onClick={() => onSetPlayhead && onSetPlayhead(Number(s))}
              className={`px-3 py-1 cursor-pointer rounded text-xs ${isActive ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
            >
              {String(s)}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col">
        {qubits.map((q) => (
          <div key={String(q)} role="row" className="flex items-center space-x-1 my-1">
            <div className="w-10 text-right pr-2 text-muted-foreground text-sm">q{String(q)}</div>
            {steps.map((s) => {
              const stepObj = circuit?.steps?.find((st) => st.step === s);
              const gate = stepObj?.gates?.find((g) => {
                const targets = g.targets || (g.targetQubit !== undefined ? [g.targetQubit] : []);
                return targets.includes(q);
              });

              return (
                <div
                  key={String(s)}
                  role="gridcell"
                  data-testid={`cell-${s}-${q}`}
                  tabIndex={0}
                  onKeyDown={(e) => handleGridKeyDown(e, gate?.id)}
                  onClick={() => {
                    if (gate && onRemoveGate && gate.id) {
                      onRemoveGate(gate.id);
                    } else {
                      onPlaceGate(Number(s), Number(q));
                    }
                  }}
                  className="w-10 h-10 bg-card border border-border rounded flex items-center justify-center cursor-pointer hover:bg-muted text-accent font-bold text-xs"
                >
                  {gate ? String(gate.type || '') : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Section: src/features/circuit/components/CircuitWorkbench.tsx ---
export function CircuitWorkbench() {
  const [circuit] = useState<QuantumCircuit>(() => createEmptyCircuit(3));
  const [evaluationResult] = useState<StateVectorHistory>(() => evaluateFullCircuit(circuit));
  const [viewMode] = useState<string>('bloch');

  const finalState = evaluationResult?.final || [{ re: 1, im: 0 }];

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground p-4">
      <div className="flex-1 flex items-center justify-center">
        {viewMode === 'phase-disk' && <PhaseDiskView evaluation={finalState} />}
        {viewMode === 'bloch' && <BlochPairView evaluation={finalState} />}
        {viewMode === 'histogram' && <HistogramView evaluation={finalState} />}
      </div>
    </div>
  );
}

// --- Section: src/features/circuit/components/GatePalette.tsx ---
const DEFAULT_GATES: readonly GateType[] = ['H', 'X', 'Y', 'Z', 'S', 'T', 'CNOT', 'CZ', 'SWAP'];

interface GatePaletteProps {
  gates?: readonly GateType[];
  selected: GateType | null;
  onSelect: (g: GateType) => void;
  disabled?: readonly GateType[];
}

const LABELS: Record<GateType, string> = {
  H: 'Hadamard', X: 'Pauli-X', Y: 'Pauli-Y', Z: 'Pauli-Z',
  S: 'Phase S', T: 'Phase T',
  CNOT: 'Controlled-NOT', CZ: 'Controlled-Z', SWAP: 'SWAP',
  CS: 'Controlled-S', CT: 'Controlled-T',
  I: '',
  CPHASE: '',
  CR: '',
  TOFFOLI: '',
  MEASURE: '',
  CUSTOM: ''
};

const ICONS: Record<GateType, LucideIcon> = {
  H: Hash,
  X: XIcon,
  Y: Sparkles,
  Z: Zap,
  S: Sigma,
  T: Triangle,
  CNOT: LinkIcon,
  CZ: Snowflake,
  SWAP: RefreshCw,
  CS: Activity,
  CT: Activity,
  I: Circle,
  CPHASE: Activity,
  CR: Activity,
  TOFFOLI: LinkIcon,
  MEASURE: BarChart3,
  CUSTOM: Atom,
};

export function GatePalette({ gates = DEFAULT_GATES, selected, onSelect, disabled = [] }: GatePaletteProps) {
  const disabledSet = useMemo(() => new Set(disabled), [disabled]);

  const handlePaletteKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const g = gates[index];
        if (!disabledSet.has(g)) onSelect(g);
      }
      const parent = e.currentTarget.parentElement;
      if (!parent) return;
      const children = Array.from(parent.children) as HTMLElement[];
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        children[(index + 1) % gates.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        children[(index - 1 + gates.length) % gates.length]?.focus();
      }
    },
    [gates, onSelect, disabledSet],
  );

  return (
    <div
      role="listbox"
      aria-label="Paleta de compuertas cuanticas"
      data-testid="gate-palette"
      className="flex flex-col gap-1.5 p-2 bg-surface-2 rounded-xl border border-edge w-24 shrink-0"
    >
      {gates.map((g, i) => {
        const isDisabled = disabledSet.has(g);
        const isSelected = selected === g;
        const Icon = ICONS[g];
        return (
          <Tooltip key={g} content={LABELS[g]}>
            <div
              role="option"
              aria-selected={isSelected}
              aria-disabled={isDisabled || undefined}
              aria-label={LABELS[g]}
              tabIndex={isSelected ? 0 : -1}
              data-testid={'gate-option-' + g}
              onClick={() => { if (!isDisabled) onSelect(g); }}
              onKeyDown={(e) => handlePaletteKeyDown(e, i)}
              className={clsx(
                'px-2 py-1.5 rounded-lg text-xs font-orbitron font-bold text-center',
                'cursor-pointer select-none border transition-all outline-none',
                'focus:ring-2 focus:ring-cyan/40 flex items-center justify-center gap-1.5',
                isSelected ? 'bg-cyan/20 border-cyan text-cyan'
                  : isDisabled ? 'bg-surface-3 border-edge text-muted-foreground opacity-50 cursor-not-allowed'
                  : 'bg-surface-3 border-edge text-muted-foreground hover:bg-muted',
              )}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-mono text-[10px]">{g}</span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
};

// --- Section: src/features/circuit/components/ViewModeSwitcher.tsx ---
export type ViewMode = 'bloch' | 'histogram' | 'phase-disk';

const VIEW_LABELS: Record<ViewMode, string> = {
  bloch: 'Esferas de Bloch',
  histogram: 'Histograma',
  'phase-disk': 'Discos de Fase',
};

const VIEW_ICONS: Record<ViewMode, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  bloch: Atom,
  histogram: BarChart3,
  'phase-disk': Circle,
};

interface ViewModeSwitcherProps {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  available?: readonly ViewMode[];
}

export function ViewModeSwitcher({ mode, onChange, available }: ViewModeSwitcherProps) {
  const modes: readonly ViewMode[] = available ?? ['bloch', 'histogram', 'phase-disk'];
  return (
    <div
      role="tablist"
      aria-label="Modo de visualizacion"
      data-testid="view-mode-switcher"
      className="flex gap-1.5 mb-3 flex-wrap"
    >
      {modes.map((m) => {
        const Icon = VIEW_ICONS[m];
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            aria-label={VIEW_LABELS[m]}
            data-testid={'view-mode-' + m}
            onClick={() => onChange(m)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-mono transition-colors',
              'inline-flex items-center gap-1.5',
              mode === m
                ? 'bg-cyan/20 text-cyan border border-cyan/60'
                : 'bg-surface-2 text-muted-foreground border border-edge hover:bg-surface-3',
            )}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden />
            <span>{VIEW_LABELS[m]}</span>
          </button>
        );
      })}
    </div>
  );
};

// --- Section: src/features/circuit/components/viewports/BlochPairView.tsx ---
export interface ViewportProps {
  evaluation?: StateVector;
  state?: StateVector;
  nQubits?: number;
}

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    if (uIntensity <= 0.0) return;

    float wave1 = sin(vUv.y * 25.0 - uTime * 8.0) * 0.5 + 0.5;
    float wave2 = cos(vUv.y * 40.0 + uTime * 12.0) * 0.5 + 0.5;
    float pulse = wave1 * 0.6 + wave2 * 0.4;

    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.5);

    float fade = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);

    float alpha = (pulse * 0.75 + fresnel * 0.6) * uIntensity * fade;
    vec3 finalColor = uColor * (1.3 + pulse * 0.7);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

function createQubitSphere(position: [number, number, number]): THREE.Group {
  const group = new THREE.Group();
  group.position.set(...position);

  const sphereGeo = new THREE.SphereGeometry(1, 32, 16);
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.2 });
  group.add(new THREE.Mesh(sphereGeo, sphereMat));

  const ringGeo = new THREE.RingGeometry(0.99, 1.01, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const markerGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const markerMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1 });
  group.add(new THREE.Mesh(markerGeo, markerMat));

  return group;
}

export function BlochPairView(_props: ViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handle = createScene(container);

    const qubit0Pos: [number, number, number] = [-1.8, 0, 0];
    const qubit1Pos: [number, number, number] = [1.8, 0, 0];

    handle.scene.add(createQubitSphere(qubit0Pos));
    handle.scene.add(createQubitSphere(qubit1Pos));

    const v0 = new THREE.Vector3(...qubit0Pos);
    const v1 = new THREE.Vector3(...qubit1Pos);
    const mid = new THREE.Vector3().addVectors(v0, v1).multiplyScalar(0.5);
    const dist = v0.distanceTo(v1);

    const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, dist, 32, 1, true);
    const beamMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#00f0ff') },
        uIntensity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.copy(mid);

    const dir = new THREE.Vector3().subVectors(v1, v0).normalize();
    const orientation = new THREE.Matrix4();
    if (Math.abs(dir.y) > 0.999) {
      orientation.lookAt(v0, v1, new THREE.Vector3(0, 0, 1));
    } else {
      orientation.lookAt(v0, v1, new THREE.Vector3(0, 1, 0));
    }
    const rot = new THREE.Euler().setFromRotationMatrix(orientation);
    beamMesh.rotation.set(rot.x + Math.PI / 2, rot.y, rot.z);

    handle.scene.add(beamMesh);

    const unregisterFrame = handle.onFrame((_time: number, delta: number) => {
      const state = useQuantumStore.getState();
      const entanglementDegree = state.entanglementDegree ?? (state.isEntangled ? 1.0 : 0.0);
      const isVisible = entanglementDegree > 0;

      beamMesh.visible = isVisible;
      if (isVisible) {
        beamMat.uniforms.uTime.value += delta;
        beamMat.uniforms.uIntensity.value = entanglementDegree;
      }
    });

    const resizeObserver = new ResizeObserver(() => handle.resize());
    resizeObserver.observe(container);

    return () => {
      unregisterFrame();
      resizeObserver.disconnect();
      handle.dispose();
    };
  }, []);

  return (
    <div className="flex items-center justify-center h-full w-full relative bg-background-90 rounded-xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

// --- Section: src/features/circuit/components/viewports/HistogramView.tsx ---
export function HistogramView(_props: ViewportProps) {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <canvas role="img" aria-label="Histogram View" className="w-full h-full" />
    </div>
  );
}

// --- Section: src/features/circuit/components/viewports/PhaseDiskView.tsx ---
export function PhaseDiskView(_props: ViewportProps) {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <canvas
        data-testid="phase-disk-view"
        role="img"
        aria-label="Fase y amplitud del estado cuántico"
        className="w-full h-full"
      />
    </div>
  );
}