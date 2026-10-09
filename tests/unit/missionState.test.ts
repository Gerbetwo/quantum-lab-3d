import { describe, test, expect, beforeEach } from 'vitest';
import Cookies from 'js-cookie';
import {
  COOKIE_MISSION_STATE,
  getMissionState,
  saveMissionState,
  getAllMissionStates,
  MAX_COOKIE_SIZE_BYTES,
} from '@/features/session/lib/cookies';

describe('Persistencia de estado por misión', () => {
  beforeEach(() => {
    Cookies.remove(COOKIE_MISSION_STATE);
  });

  test('obtiene null cuando no hay estado guardado para la misión', () => {
    expect(getMissionState(0)).toBeNull();
  });

  test('guarda y recupera el estado de una misión específica', () => {
    const stateM0 = { theta: 1.57, collapsed: 1 };
    saveMissionState(0, stateM0);

    expect(getMissionState(0)).toEqual(stateM0);
    expect(getMissionState(1)).toBeNull();
  });

  test('mantiene estados independientes para distintas misiones', () => {
    saveMissionState(0, { val: 'A' });
    saveMissionState(1, { val: 'B' });

    expect(getMissionState(0)).toEqual({ val: 'A' });
    expect(getMissionState(1)).toEqual({ val: 'B' });
  });

  test('maneja JSON corrupto en la cookie devolviendo objeto vacío / null', () => {
    Cookies.set(COOKIE_MISSION_STATE, '{invalid-json');
    expect(getAllMissionStates()).toEqual({});
    expect(getMissionState(0)).toBeNull();
  });

  test('respeta MAX_COOKIE_SIZE_BYTES no guardando si supera el límite', () => {
    const hugeData = { data: 'X'.repeat(MAX_COOKIE_SIZE_BYTES + 500) };
    saveMissionState(0, hugeData);

    expect(getMissionState(0)).toBeNull();
  });
});
