'use client';

import { BlochSphereWorkspace } from '@/features/quantum-core/BlochViewport';
import { MathDock } from '@/features/quantum-core/MathDock';
import { useQuantumStore } from '@/store/useQuantumStore';
import {
  MISSIONS,
  getMissionById,
  type MissionDefinition,
  type StepDefinition,
} from '@/features/quantum-core/quantum-missions-core';

export default function Page() {
  const activeMissionId = useQuantumStore(
    (s) => s.currentMissionId ?? s.activeMissionId ?? 'superposition'
  );
  const currentMission: MissionDefinition =
    (activeMissionId ? getMissionById(activeMissionId) : undefined) ?? MISSIONS[0];

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden p-4 gap-4 bg-background">
        {/* Left/Center (60%): BlochSphereWorkspace mounted as a single persistent WebGL canvas across missions */}
        <div className="w-full lg:w-[60%] h-full flex flex-col min-h-0">
          <BlochSphereWorkspace />
        </div>

        {/* Right (40%): Active Mission control panel (top) + MathDock (bottom) */}
        <div className="w-full lg:w-[40%] h-full flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Active Mission control panel (top) */}
          <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <span className="text-xs font-mono font-semibold text-accent px-2.5 py-0.5 rounded bg-accent/10 border border-accent/30">
                Mission {activeMissionId}
              </span>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Control Panel
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                {currentMission?.title ?? `Mission ${activeMissionId}`}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {currentMission?.description ?? currentMission?.subtitle ?? 'Explore quantum phenomena.'}
              </p>
            </div>
            {currentMission?.learningObjective && (
              <div className="p-2.5 rounded-lg bg-background-80 border border-border text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-accent">Objective: </span>
                {currentMission.learningObjective}
              </div>
            )}
            {currentMission?.steps && currentMission.steps.length > 0 && (
              <div className="mt-1 flex flex-col gap-1.5">
                <span className="text-xs font-mono text-muted-foreground uppercase">Steps:</span>
                <div className="flex flex-col gap-1">
                  {currentMission.steps.map((step: StepDefinition, idx: number) => (
                    <div
                      key={step.id || idx}
                      className="text-xs px-2.5 py-1.5 rounded bg-background/50 border border-border/60 flex items-center justify-between"
                    >
                      <span className="font-medium text-foreground">{idx + 1}. {step.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{step.phase}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MathDock (bottom) */}
          <div className="flex-1">
            <MathDock />
          </div>
        </div>
      </div>
  );
}