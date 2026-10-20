import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { isAudioEnabled } from '@/lib/soundEngine';
import { AlgorithmControls } from '@/features/missions/AlgorithmControls';
import { AlgorithmVisualizer3D } from '@/features/missions/AlgorithmVisualizer3D';
import { CelebrationModal } from '@/components/ui/CelebrationModal';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('Algorithm Store State & Deduplication (Phase 2)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useQuantumStore.getState().resetState();
    useQuantumStore.setState({ language: 'en' });
  });

  describe('useQuantumStore Algorithm State & Reset', () => {
    it('initializes with default algorithm parameters', () => {
      const state = useQuantumStore.getState();
      expect(state.groverStep).toBe(0);
      expect(state.groverTargetIndex).toBe(2);
      expect(state.shorBase).toBe(7);
      expect(state.qecInjectedError).toBeNull();
    });

    it('updates grover step and target index via store actions', () => {
      useQuantumStore.getState().setGroverTargetIndex(3);
      expect(useQuantumStore.getState().groverTargetIndex).toBe(3);

      useQuantumStore.getState().setGroverStep(1);
      expect(useQuantumStore.getState().groverStep).toBe(1);

      useQuantumStore.getState().setGroverStep((prev) => Math.min(2, prev + 1));
      expect(useQuantumStore.getState().groverStep).toBe(2);
    });

    it('updates shor base and qec injected error via store actions', () => {
      useQuantumStore.getState().setShorBase(11);
      expect(useQuantumStore.getState().shorBase).toBe(11);

      useQuantumStore.getState().setQecInjectedError(1);
      expect(useQuantumStore.getState().qecInjectedError).toBe(1);

      useQuantumStore.getState().setQecInjectedError(null);
      expect(useQuantumStore.getState().qecInjectedError).toBeNull();
    });

    it('resets all algorithm parameters on resetState', () => {
      useQuantumStore.setState({
        groverStep: 2,
        groverTargetIndex: 0,
        shorBase: 13,
        qecInjectedError: 2,
      });

      useQuantumStore.getState().resetState();
      const state = useQuantumStore.getState();
      expect(state.groverStep).toBe(0);
      expect(state.groverTargetIndex).toBe(2);
      expect(state.shorBase).toBe(7);
      expect(state.qecInjectedError).toBeNull();
    });
  });

  describe('Audio Sync with soundEngine', () => {
    it('synchronizes toggleSound with soundEngine audio state', () => {
      useQuantumStore.getState().setSoundEnabled(true);
      expect(useQuantumStore.getState().isSoundEnabled).toBe(true);
      expect(isAudioEnabled()).toBe(true);

      useQuantumStore.getState().toggleSound();
      expect(useQuantumStore.getState().isSoundEnabled).toBe(false);
      expect(isAudioEnabled()).toBe(false);

      useQuantumStore.getState().toggleSound();
      expect(useQuantumStore.getState().isSoundEnabled).toBe(true);
      expect(isAudioEnabled()).toBe(true);
    });
  });

  describe('Split-Brain State Synchronization between Controls & Visualizer', () => {
    it('syncs Grover target selection from AlgorithmControls to AlgorithmVisualizer3D', () => {
      const { unmount } = render(
        <div>
          <AlgorithmControls missionId="grover" />
          <AlgorithmVisualizer3D missionId="grover" />
        </div>
      );

      // Click target |1⟩ in AlgorithmControls
      const targetButtons = screen.getAllByRole('button', { name: /\|1⟩/i });
      fireEvent.click(targetButtons[0]);

      // Both store and visualizer should now target index 1
      expect(useQuantumStore.getState().groverTargetIndex).toBe(1);
      expect(screen.getAllByText(/P\(\|1⟩\):/i)).toHaveLength(2);

      unmount();
    });

    it('syncs Shor base selection between visualizer and controls', () => {
      const { unmount } = render(
        <div>
          <AlgorithmControls missionId="applications" />
          <AlgorithmVisualizer3D missionId="applications" />
        </div>
      );

      // Select base 13
      const base13Buttons = screen.getAllByRole('button', { name: '13' });
      fireEvent.click(base13Buttons[0]);

      expect(useQuantumStore.getState().shorBase).toBe(13);
      expect(screen.getByText(/N=15, a=13/i)).toBeDefined();

      unmount();
    });

    it('syncs QEC injected error between visualizer and controls', () => {
      const { unmount } = render(
        <div>
          <AlgorithmControls missionId="error-correction" />
          <AlgorithmVisualizer3D missionId="error-correction" />
        </div>
      );

      const flipQ2Buttons = screen.getAllByRole('button', { name: 'Flip q2' });
      fireEvent.click(flipQ2Buttons[0]);

      expect(useQuantumStore.getState().qecInjectedError).toBe(2);
      expect(screen.getAllByText(/Syndrome: \[0, 1\]/i).length).toBeGreaterThanOrEqual(1);

      unmount();
    });
  });

  describe('CelebrationModal Single-Canvas Navigation', () => {
    it('transitions appViewState to SANDBOX and closes modal when Enter Sandbox Lab is clicked', () => {
      useQuantumStore.setState({ isSandboxUnlocked: true, appViewState: 'IN_MISSION' });

      render(<CelebrationModal />);
      const sandboxButton = screen.getByRole('button', { name: /Enter Sandbox Lab/i });
      expect(sandboxButton).toBeDefined();

      fireEvent.click(sandboxButton);

      expect(useQuantumStore.getState().appViewState).toBe('SANDBOX');
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
