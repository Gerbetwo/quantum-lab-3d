"use client";

import { useCallback, useMemo } from "react";
import { useSession } from "@/features/session/components/SessionProvider";
import {
  getMissionById,
  MissionId,
  isMissionId,
} from "@/features/missions/config/missions";
import { useQuantumStore } from "@/store/useQuantumStore";
import { MissionStep } from "@/features/missions/types/mission";

export interface MissionInternalState {
  currentStepIndex: number;
  completedSteps: string[];
  quizPassed: boolean;
  interaction: Record<string, unknown>;
  [key: string]: unknown;
}

export function useGuidedMission(missionId: MissionId | string = 'superposition') {
  const { session, updateMissionState, completeMission } = useSession();

  const missionState = useQuantumStore((state) => state.missionState);
  const transitionMissionPhase = useQuantumStore(
    (state) => state.transitionMissionPhase
  );
  const setPrediction = useQuantumStore((state) => state.setPrediction);
  const applyGateToMission = useQuantumStore(
    (state) => state.applyGateToMission
  );
  const evaluateMissionStep = useQuantumStore(
    (state) => state.evaluateMissionStep
  );

  const mission = useMemo(() => getMissionById(missionId), [missionId]);

  const rawMissionState = useMemo(
    () =>
      ((isMissionId(missionId)
        ? session.missionState[missionId]
        : (session.missionState as Record<string, unknown>)[
            missionId
          ]) as MissionInternalState) || {},
    [session.missionState, missionId]
  );

  const rawIndex = rawMissionState?.currentStepIndex;
  const currentStepIndex =
    typeof rawIndex === "number" && Number.isFinite(rawIndex)
      ? Math.max(0, Math.min(rawIndex, (mission?.steps.length ?? 1) - 1))
      : 0;

  const completedSteps = useMemo(
    () =>
      Array.isArray(rawMissionState.completedSteps)
        ? rawMissionState.completedSteps.filter(
            (s): s is string => typeof s === "string"
          )
        : [],
    [rawMissionState.completedSteps]
  );

  const quizPassed =
    typeof rawMissionState.quizPassed === "boolean"
      ? rawMissionState.quizPassed
      : false;

  const interaction = useMemo(
    () =>
      rawMissionState.interaction &&
      typeof rawMissionState.interaction === "object" &&
      !Array.isArray(rawMissionState.interaction)
        ? (rawMissionState.interaction as Record<string, unknown>)
        : {},
    [rawMissionState.interaction]
  );

  const steps = useMemo(() => mission?.steps || [], [mission?.steps]);
  const currentStep = steps[currentStepIndex];

  const currentStepConfig = useMemo((): MissionStep => {
    if (currentStep) {
      return currentStep;
    }
    return {
      id: "default-step",
phase: missionState.currentPhase as any,
      title: mission?.title || "Mission Step",
      description: mission?.description || "",
      targetTheta: 0,
      targetPhi: 0,
      allowedGates: ["X", "Y", "Z", "H", "S", "T"],
      expectedProbability0: 1,
    };
  }, [currentStep, missionState.currentPhase, mission]);

  const isPredictionAllowed = useMemo(
    () => missionState.currentPhase === "PREDICTION",
    [missionState.currentPhase]
  );

  const isManipulationAllowed = useMemo(
    () => missionState.currentPhase === "MANIPULATION",
    [missionState.currentPhase]
  );

  const isMeasurementAllowed = useMemo(
    () => missionState.currentPhase === "MEASUREMENT",
    [missionState.currentPhase]
  );

  const isUnlocked = useMemo(() => {
    if (!mission) return false;
    if (!mission.prerequisites || mission.prerequisites.length === 0)
      return true;
    return mission.prerequisites.every((reqId) =>
      session.completed.includes(reqId)
    );
  }, [mission, session.completed]);

  const isCompleted = useMemo(() => {
    return (
      session.completed.includes(missionId as MissionId) ||
      (steps.length > 0 && completedSteps.length >= steps.length)
    );
  }, [session.completed, missionId, steps.length, completedSteps.length]);

  const progress = useMemo(() => {
    if (steps.length === 0) return 0;
    const uniqueCompleted = new Set(completedSteps).size;
    return Math.min(100, Math.round((uniqueCompleted / steps.length) * 100));
  }, [steps.length, completedSteps]);

  const submitPrediction = useCallback(
    (prob: number) => {
      setPrediction(prob);
      transitionMissionPhase("MANIPULATION");
    },
    [setPrediction, transitionMissionPhase]
  );

  const executeGate = useCallback(
    (gate: string) => {
      if (missionState.currentPhase === "MANIPULATION") {
        applyGateToMission(gate);
      }
    },
    [missionState.currentPhase, applyGateToMission]
  );

  const triggerMeasurement = useCallback(() => {
    if (missionState.currentPhase === "MANIPULATION") {
      transitionMissionPhase("MEASUREMENT");
    }
  }, [missionState.currentPhase, transitionMissionPhase]);

  const advanceToNextStep = useCallback(() => {
    if (missionState.currentPhase === "MEASUREMENT") {
      transitionMissionPhase("VERIFICATION");
      const passed = evaluateMissionStep(
        currentStepConfig.targetTheta,
        currentStepConfig.targetPhi
      );

      if (passed) {
        transitionMissionPhase("SUCCESS");
      } else {
        transitionMissionPhase("MANIPULATION");
      }
    } else if (missionState.currentPhase === "SUCCESS") {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        updateMissionState(missionId, {
          ...rawMissionState,
          currentStepIndex: nextIndex,
        });
        transitionMissionPhase("BRIEFING");
      } else {
        completeMission(missionId as MissionId);
      }
    }
  }, [
    missionState.currentPhase,
    transitionMissionPhase,
    evaluateMissionStep,
    currentStepConfig,
    currentStepIndex,
    steps.length,
    updateMissionState,
    missionId,
    rawMissionState,
    completeMission,
  ]);

  const updateInteraction = useCallback(
    (partialState: Record<string, unknown>) => {
      const updatedInteraction = {
        ...interaction,
        ...partialState,
      };
      updateMissionState(missionId, {
        ...rawMissionState,
        interaction: updatedInteraction,
      });
    },
    [missionId, interaction, rawMissionState, updateMissionState]
  );

  const markCurrentStepComplete = useCallback(() => {
    if (!currentStep) return;
    const stepId = currentStep.id;
    const newCompleted = completedSteps.includes(stepId)
      ? completedSteps
      : [...completedSteps, stepId];

    const isLastStep = currentStepIndex >= steps.length - 1;

    updateMissionState(missionId, {
      ...rawMissionState,
      completedSteps: newCompleted,
    });

    if (isLastStep && (!mission?.requiresQuiz || quizPassed)) {
      completeMission(missionId as MissionId);
    }
  }, [
    currentStep,
    currentStepIndex,
    completedSteps,
    steps.length,
    mission,
    quizPassed,
    missionId,
    rawMissionState,
    updateMissionState,
    completeMission,
  ]);

  const passQuiz = useCallback(() => {
    const stepId = currentStep?.id;
    const newCompleted =
      stepId && !completedSteps.includes(stepId)
        ? [...completedSteps, stepId]
        : completedSteps;

    updateMissionState(missionId, {
      ...rawMissionState,
      quizPassed: true,
      completedSteps: newCompleted,
    });
    completeMission(missionId as MissionId);
  }, [
    missionId,
    rawMissionState,
    currentStep,
    completedSteps,
    updateMissionState,
    completeMission,
  ]);

  const handleContinue = useCallback(() => {
    if (!mission) return;
    const isLastStep = currentStepIndex >= steps.length - 1;

    if (isLastStep) {
      if (!mission.requiresQuiz || quizPassed) {
        completeMission(missionId as MissionId);
      }
      return;
    }

    const nextIndex = currentStepIndex + 1;
    updateMissionState(missionId, {
      ...rawMissionState,
      currentStepIndex: nextIndex,
    });
  }, [
    mission,
    currentStepIndex,
    steps.length,
    missionId,
    quizPassed,
    rawMissionState,
    updateMissionState,
    completeMission,
  ]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex <= 0) return;
    const prevIndex = currentStepIndex - 1;
    updateMissionState(missionId, {
      ...rawMissionState,
      currentStepIndex: prevIndex,
    });
  }, [currentStepIndex, missionId, rawMissionState, updateMissionState]);

  const goToStep = useCallback(
    (indexOrId: number | string) => {
      let targetIndex = -1;
      if (typeof indexOrId === "number") {
        targetIndex = indexOrId;
      } else {
        targetIndex = steps.findIndex((s) => s.id === indexOrId);
      }

      if (targetIndex >= 0 && targetIndex < steps.length) {
        updateMissionState(missionId, {
          ...rawMissionState,
          currentStepIndex: targetIndex,
        });
      }
    },
    [steps, missionId, rawMissionState, updateMissionState]
  );

  return {
    mission,
    steps,
    currentStep,
    currentStepConfig,
    currentStepIndex,
    totalSteps: steps.length,
    progress,
    interactionState: interaction,
    missionState,
    isPredictionAllowed,
    isManipulationAllowed,
    isMeasurementAllowed,
    submitPrediction,
    executeGate,
    triggerMeasurement,
    advanceToNextStep,
    updateInteraction,
    markCurrentStepComplete,
    nextStep: handleContinue,
    continueMission: handleContinue,
    previousStep: handlePrevious,
    goToStep,
    isUnlocked,
    isCompleted,
    quizPassed,
    passQuiz,
  };
}
