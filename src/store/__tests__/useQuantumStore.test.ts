import { describe, it, expect, beforeEach } from 'vitest';
import { useQuantumStore, checkMissionObjectiveCompletion } from '../useQuantumStore';
import { TOTAL_MISSIONS, CORE_MISSION_IDS } from '@/features/missions/missionRegistry';

describe('useQuantumStore - Phase 2 Store Tracking & Progression', () => {
  beforeEach(() => {
    useQuantumStore.getState().resetProgress();
    useQuantumStore.getState().resetState();
    useQuantumStore.getState().returnToTitle();
  });

  describe('Mission Tracking & Progression', () => {
    it('initializes with empty completedMissions and locked sandbox', () => {
      const state = useQuantumStore.getState();
      expect(state.completedMissions).toEqual([]);
      expect(state.isSandboxUnlocked).toBe(false);
    });

    it('marks a mission completed by numeric index', () => {
      useQuantumStore.getState().markMissionCompleted(0);
      const state = useQuantumStore.getState();
      expect(state.completedMissions).toContain(0);
      expect(state.completedMissions).toHaveLength(1);
    });

    it('marks a mission completed by string mission id', () => {
      useQuantumStore.getState().markMissionCompleted('gates');
      const state = useQuantumStore.getState();
      expect(state.completedMissions).toContain(1);
    });

    it('is idempotent and prevents duplicate completions', () => {
      useQuantumStore.getState().markMissionCompleted(2);
      useQuantumStore.getState().markMissionCompleted(2);
      useQuantumStore.getState().markMissionCompleted(2);
      const state = useQuantumStore.getState();
      expect(state.completedMissions).toEqual([2]);
    });

    it('maintains ordered completed mission indices', () => {
      useQuantumStore.getState().markMissionCompleted(3);
      useQuantumStore.getState().markMissionCompleted(0);
      useQuantumStore.getState().markMissionCompleted(2);
      const state = useQuantumStore.getState();
      expect(state.completedMissions).toEqual([0, 2, 3]);
    });
  });

  describe('Sandbox Lab Unlock State', () => {
    it('remains locked until all 7 core missions are completed', () => {
      for (let i = 0; i < TOTAL_MISSIONS - 1; i++) {
        useQuantumStore.getState().markMissionCompleted(i);
        expect(useQuantumStore.getState().isSandboxUnlocked).toBe(false);
      }
    });

    it('automatically unlocks sandbox when all core missions are completed', () => {
      for (let i = 0; i < TOTAL_MISSIONS; i++) {
        useQuantumStore.getState().markMissionCompleted(i);
      }
      const state = useQuantumStore.getState();
      expect(state.completedMissions).toHaveLength(TOTAL_MISSIONS);
      expect(state.isSandboxUnlocked).toBe(true);
    });

    it('supports explicit sandbox unlock and lock actions', () => {
      expect(useQuantumStore.getState().isSandboxUnlocked).toBe(false);
      useQuantumStore.getState().unlockSandbox();
      expect(useQuantumStore.getState().isSandboxUnlocked).toBe(true);
      useQuantumStore.getState().setSandboxUnlocked(false);
      expect(useQuantumStore.getState().isSandboxUnlocked).toBe(false);
    });
  });

  describe('State Reset vs Progress Reset', () => {
    it('resetState resets physical angles to |0⟩ without wiping mission progress', () => {
      useQuantumStore.getState().markMissionCompleted(0);
      useQuantumStore.getState().markMissionCompleted(1);

      // Dirty physical state
      useQuantumStore.setState({
        theta: Math.PI,
        phi: 1.5,
        lastOutcome: 1,
        isEntangled: true,
      });

      useQuantumStore.getState().resetState();
      const state = useQuantumStore.getState();

      expect(state.theta).toBe(0);
      expect(state.phi).toBe(0);
      expect(state.lastOutcome).toBeNull();
      expect(state.isEntangled).toBe(false);
      // Progress preserved
      expect(state.completedMissions).toEqual([0, 1]);
    });

    it('resetProgress resets completed missions and locks sandbox', () => {
      for (let i = 0; i < TOTAL_MISSIONS; i++) {
        useQuantumStore.getState().markMissionCompleted(i);
      }
      expect(useQuantumStore.getState().isSandboxUnlocked).toBe(true);

      useQuantumStore.getState().resetProgress();
      const state = useQuantumStore.getState();
      expect(state.completedMissions).toEqual([]);
      expect(state.isSandboxUnlocked).toBe(false);
    });
  });

  describe('Instructor Free-Jump Navigation (HU-MVP-09)', () => {
    it('allows jumping directly to any mission without prerequisite gating', () => {
      CORE_MISSION_IDS.forEach((id, index) => {
        useQuantumStore.getState().jumpToMission(id);
        const state = useQuantumStore.getState();
        expect(state.currentMissionId).toBe(id);

        useQuantumStore.getState().jumpToMission(index);
        const stateNumeric = useQuantumStore.getState();
        expect(stateNumeric.currentMissionId).toBe(id);
      });
    });

    it('aliases startMission and selectMission to jumpToMission', () => {
      useQuantumStore.getState().startMission('entanglement');
      expect(useQuantumStore.getState().currentMissionId).toBe('entanglement');

      useQuantumStore.getState().selectMission('grover');
      expect(useQuantumStore.getState().currentMissionId).toBe('grover');
    });

    it('aliases completeMission to markMissionCompleted and provides recordMissionTime', () => {
      useQuantumStore.getState().completeMission('grover');
      expect(useQuantumStore.getState().completedMissions).toContain(6);

      // recordMissionTime does not throw
      expect(() => useQuantumStore.getState().recordMissionTime('grover', 42)).not.toThrow();
    });
  });

  describe('Game Flow & Modal Controls', () => {
    it('initializes with default state: appViewState TITLE and isPauseMenuOpen false', () => {
      const state = useQuantumStore.getState();
      expect(state.appViewState).toBe('TITLE');
      expect(state.isPauseMenuOpen).toBe(false);
    });

    it('transitions appViewState correctly via setAppViewState', () => {
      const { setAppViewState } = useQuantumStore.getState();

      setAppViewState('CAMPAIGN_SELECT');
      expect(useQuantumStore.getState().appViewState).toBe('CAMPAIGN_SELECT');

      setAppViewState('SANDBOX');
      expect(useQuantumStore.getState().appViewState).toBe('SANDBOX');

      setAppViewState('IN_MISSION');
      expect(useQuantumStore.getState().appViewState).toBe('IN_MISSION');

      setAppViewState('TITLE');
      expect(useQuantumStore.getState().appViewState).toBe('TITLE');
    });

    it('toggles pause menu modal state with togglePauseMenu', () => {
      const { togglePauseMenu } = useQuantumStore.getState();
      expect(useQuantumStore.getState().isPauseMenuOpen).toBe(false);

      togglePauseMenu();
      expect(useQuantumStore.getState().isPauseMenuOpen).toBe(true);

      togglePauseMenu();
      expect(useQuantumStore.getState().isPauseMenuOpen).toBe(false);
    });

    it('returns to TITLE view and closes pause menu via returnToTitle', () => {
      useQuantumStore.setState({
        appViewState: 'IN_MISSION',
        isPauseMenuOpen: true,
      });

      useQuantumStore.getState().returnToTitle();
      const state = useQuantumStore.getState();
      expect(state.appViewState).toBe('TITLE');
      expect(state.isPauseMenuOpen).toBe(false);
    });

    it('launches mission by string id, sets currentMissionId and transitions to IN_MISSION', () => {
      useQuantumStore.getState().launchMission('entanglement');
      const state = useQuantumStore.getState();
      expect(state.currentMissionId).toBe('entanglement');
      expect(state.appViewState).toBe('IN_MISSION');
      expect(state.isEntangled).toBe(true);
    });

    it('launches mission by numeric index, sets currentMissionId and transitions to IN_MISSION', () => {
      useQuantumStore.getState().launchMission(6);
      const state = useQuantumStore.getState();
      expect(state.currentMissionId).toBe('grover');
      expect(state.appViewState).toBe('IN_MISSION');
    });

    it('closes pause menu if open when launching a mission', () => {
      useQuantumStore.setState({ isPauseMenuOpen: true });
      useQuantumStore.getState().launchMission('superposition');
      const state = useQuantumStore.getState();
      expect(state.isPauseMenuOpen).toBe(false);
      expect(state.appViewState).toBe('IN_MISSION');
      expect(state.currentMissionId).toBe('superposition');
    });
  });

  describe('Language Switches & Localization Persistence', () => {
    it('switches between en and es seamlessly', () => {
      useQuantumStore.getState().setLanguage('en');
      expect(useQuantumStore.getState().language).toBe('en');

      useQuantumStore.getState().setLanguage('es');
      expect(useQuantumStore.getState().language).toBe('es');
    });
  });

  describe('Quantum Gates & Physical State Transitions', () => {
    it('sets polar (theta) and azimuthal (phi) angles', () => {
      useQuantumStore.getState().setAngles(Math.PI / 3, Math.PI / 4);
      const s1 = useQuantumStore.getState();
      expect(s1.theta).toBeCloseTo(Math.PI / 3);
      expect(s1.phi).toBeCloseTo(Math.PI / 4);

      useQuantumStore.getState().setTheta(Math.PI / 2);
      expect(useQuantumStore.getState().theta).toBeCloseTo(Math.PI / 2);

      useQuantumStore.getState().setPhi(Math.PI);
      expect(useQuantumStore.getState().phi).toBeCloseTo(Math.PI);
    });

    it('applies Pauli-X gate (bit flip) to theta', () => {
      useQuantumStore.getState().setAngles(0, 0);
      useQuantumStore.getState().applyGate('X');
      expect(useQuantumStore.getState().theta).toBeCloseTo(Math.PI);

      useQuantumStore.getState().applyGate('X');
      expect(useQuantumStore.getState().theta).toBeCloseTo(0);
    });

    it('applies Pauli-Z gate (phase flip) to phi', () => {
      useQuantumStore.getState().setAngles(Math.PI / 2, 0);
      useQuantumStore.getState().applyGate('Z');
      expect(useQuantumStore.getState().phi).toBeCloseTo(Math.PI);

      useQuantumStore.getState().applyGate('Z');
      expect(useQuantumStore.getState().phi).toBeCloseTo(0);
    });

    it('applies Hadamard (H) gate between pole and equator', () => {
      // From |0⟩ (theta = 0) to equator (theta = π/2)
      useQuantumStore.getState().setAngles(0, 0);
      useQuantumStore.getState().applyGate('H');
      expect(useQuantumStore.getState().theta).toBeCloseTo(Math.PI / 2);

      // From equator (theta = π/2) back to pole (theta = 0)
      useQuantumStore.getState().applyGate('H');
      expect(useQuantumStore.getState().theta).toBeCloseTo(0);
    });


    it('performs state collapse and registers last outcome on measurement', () => {
      // State |0⟩ -> outcome must be 0
      useQuantumStore.getState().setAngles(0, 0);
      const outcome0 = useQuantumStore.getState().measure();
      expect(outcome0).toBe(0);
      expect(useQuantumStore.getState().lastOutcome).toBe(0);
      expect(useQuantumStore.getState().theta).toBe(0);

      // State |1⟩ -> outcome must be 1
      useQuantumStore.getState().setAngles(Math.PI, 0);
      const outcome1 = useQuantumStore.getState().measure();
      expect(outcome1).toBe(1);
      expect(useQuantumStore.getState().lastOutcome).toBe(1);
      expect(useQuantumStore.getState().theta).toBeCloseTo(Math.PI);
    });
  });

  describe('Cryogenic Environment & Thermal Invariants', () => {
    it('updates temperature and recalculates T2 coherence time', () => {
      // 15 mK (0.015 K) baseline
      useQuantumStore.getState().setTemperature(0.015);
      const s1 = useQuantumStore.getState();
      expect(s1.temperatureK).toBe(0.015);
      expect(s1.coherenceTimeUs).toBeCloseTo(245.356, 2);

      // 0.8 K (800 mK) -> 250 * e^(-1) ≈ 91.970 μs
      useQuantumStore.getState().setTemperatureK(0.8);
      const s2 = useQuantumStore.getState();
      expect(s2.temperatureK).toBe(0.8);
      expect(s2.coherenceTimeUs).toBeCloseTo(91.970, 2);
    });
  });

  describe('Entanglement State Transitions', () => {
    it('sets entanglement status', () => {
      useQuantumStore.getState().setEntangled(true);
      expect(useQuantumStore.getState().isEntangled).toBe(true);

      useQuantumStore.getState().setEntangled(false);
      expect(useQuantumStore.getState().isEntangled).toBe(false);
    });
  });

  describe('Zero-Spoiler Prediction Management (HU-MVP-03)', () => {
    it('manages zero-spoiler user predictions', () => {
      useQuantumStore.getState().setPrediction(0.75);
      expect(useQuantumStore.getState().userPredictionProb0).toBe(0.75);

      useQuantumStore.getState().setUserPrediction(0.5);
      expect(useQuantumStore.getState().userPredictionProb0).toBe(0.5);
    });
  });

  describe('Automated Objective Verification (checkMissionObjectiveCompletion)', () => {
    it('evaluates superposition objective when theta is near pi/2 or collapsed', () => {
      const state = useQuantumStore.getState();
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'superposition', theta: 0, lastOutcome: null })).toBe(false);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'superposition', theta: Math.PI / 2, lastOutcome: null })).toBe(true);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'superposition', theta: 0, lastOutcome: 0 })).toBe(true);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'superposition', theta: Math.PI, lastOutcome: 1 })).toBe(true);
    });

    it('evaluates entanglement objective when entangled and measured', () => {
      const state = useQuantumStore.getState();
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'entanglement', isEntangled: false, lastOutcome: null })).toBe(false);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'entanglement', isEntangled: true, lastOutcome: null })).toBe(false);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'entanglement', isEntangled: false, lastOutcome: 0 })).toBe(false);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'entanglement', isEntangled: true, lastOutcome: 0 })).toBe(true);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'entanglement', isEntangled: true, lastOutcome: 1 })).toBe(true);
    });

    it('evaluates decoherence objective when temperatureK >= 100 K', () => {
      const state = useQuantumStore.getState();
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'decoherence', temperatureK: 0.015 })).toBe(false);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'decoherence', temperatureK: 77 })).toBe(false);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'decoherence', temperatureK: 100 })).toBe(true);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'decoherence', temperatureK: 300 })).toBe(true);
    });

    it('evaluates gates objective when theta is near pi/2 or pi', () => {
      const state = useQuantumStore.getState();
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'gates', theta: 0 })).toBe(false);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'gates', theta: Math.PI / 2 })).toBe(true);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'gates', theta: Math.PI })).toBe(true);
    });

    it('evaluates grover objective when groverStep >= 2', () => {
      const state = useQuantumStore.getState();
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'grover', groverStep: 0 })).toBe(false);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'grover', groverStep: 1 })).toBe(false);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'grover', groverStep: 2 })).toBe(true);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'grover', groverStep: 3 })).toBe(true);
    });

    it('evaluates measurement objective when lastOutcome is not null', () => {
      const state = useQuantumStore.getState();
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'measurement', lastOutcome: null })).toBe(false);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'measurement', lastOutcome: 0 })).toBe(true);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'measurement', lastOutcome: 1 })).toBe(true);
    });

    it('evaluates interference objective when phi is shifted to pi or pi/2', () => {
      const state = useQuantumStore.getState();
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'interference', phi: 0 })).toBe(false);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'interference', phi: Math.PI })).toBe(true);
      expect(checkMissionObjectiveCompletion({ ...state, currentMissionId: 'interference', phi: Math.PI / 2 })).toBe(true);
    });

    it('auto-completes missions via actions across the store', () => {
      // Mission 0: Superposition via applyGate H
      useQuantumStore.getState().selectMission('superposition');
      expect(useQuantumStore.getState().completedMissions).not.toContain(0);
      useQuantumStore.getState().applyGate('H');
      expect(useQuantumStore.getState().completedMissions).toContain(0);

      // Mission 1: Gates via applyGate X
      useQuantumStore.getState().selectMission('gates');
      expect(useQuantumStore.getState().completedMissions).not.toContain(1);
      useQuantumStore.getState().applyGate('X');
      expect(useQuantumStore.getState().completedMissions).toContain(1);

      // Mission 2: Measurement via measure
      useQuantumStore.getState().selectMission('measurement');
      expect(useQuantumStore.getState().completedMissions).not.toContain(2);
      useQuantumStore.getState().measure();
      expect(useQuantumStore.getState().completedMissions).toContain(2);

      // Mission 3: Interference via setAngles
      useQuantumStore.getState().selectMission('interference');
      expect(useQuantumStore.getState().completedMissions).not.toContain(3);
      useQuantumStore.getState().setAngles(Math.PI / 2, Math.PI);
      expect(useQuantumStore.getState().completedMissions).toContain(3);

      // Mission 4: Entanglement via measure
      useQuantumStore.getState().selectMission('entanglement');
      expect(useQuantumStore.getState().completedMissions).not.toContain(4);
      useQuantumStore.getState().measure();
      expect(useQuantumStore.getState().completedMissions).toContain(4);

      // Mission 5: Decoherence via setTemperature >= 100
      useQuantumStore.getState().selectMission('decoherence');
      expect(useQuantumStore.getState().completedMissions).not.toContain(5);
      useQuantumStore.getState().setTemperature(100);
      expect(useQuantumStore.getState().completedMissions).toContain(5);

      // Mission 6: Grover via setGroverStep
      useQuantumStore.getState().selectMission('grover');
      expect(useQuantumStore.getState().completedMissions).not.toContain(6);
      useQuantumStore.getState().setGroverStep(2);
      expect(useQuantumStore.getState().completedMissions).toContain(6);

      // Idempotency check: Repeated actions do not duplicate completion entries
      useQuantumStore.getState().setGroverStep(3);
      const mission6Count = useQuantumStore.getState().completedMissions.filter((m) => m === 6).length;
      expect(mission6Count).toBe(1);
    });
  });
});


