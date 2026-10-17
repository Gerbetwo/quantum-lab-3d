import { describe, it, expect, beforeEach } from 'vitest';
import { useQuantumStore } from '../useQuantumStore';
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
      useQuantumStore.getState().markMissionCompleted('entanglement');
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
      useQuantumStore.getState().launchMission(4);
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
});

