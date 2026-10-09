import { describe, test, expect } from 'vitest';
import {
  createInitialMissionState,
  advanceStep,
  canNavigateToStep,
  previousStep,
  completeQuiz,
} from '../../src/features/missions/domain/missionMachine';

describe('Mission State Machine', () => {
  test('Inicia en not_started y paso 0', () => {
    const state = createInitialMissionState();
    expect(state.state).toBe('not_started');
    expect(state.currentStep).toBe(0);
  });

  test('Impide avanzar si el paso requiere acción no completada', () => {
    const state = createInitialMissionState();
    const canNav = canNavigateToStep(1, 4, state, { 0: false });
    expect(canNav).toBe(false);
  });

  test('Avanza de paso cuando los requisitos se cumplen', () => {
    const state = createInitialMissionState();
    const next = advanceStep(0, 4, state, { 0: true });
    expect(next.currentStep).toBe(1);
    expect(next.maxUnlockedStep).toBe(1);
  });

  test('Permite revisión sin borrar estado completado', () => {
    let state = createInitialMissionState();
    state = completeQuiz(state);
    expect(state.state).toBe('completed');

    const prev = previousStep(2, state);
    expect(prev.currentStep).toBe(1);
    expect(prev.state).toBe('completed');
  });
});
