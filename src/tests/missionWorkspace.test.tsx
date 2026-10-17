import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MissionWorkspace } from '@/features/missions/MissionWorkspace';
import { MissionHeader } from '@/components/game/MissionHeader';
import { useQuantumStore } from '@/store/useQuantumStore';

describe('Floating Gate Controls & Edge Navigation (HU-MVP-03, HU-MVP-12)', () => {
  beforeEach(() => {
    useQuantumStore.setState({
      currentMissionId: 'superposition',
      activeMissionId: 'superposition',
      theta: 0,
      phi: 0,
      temperatureK: 0.015,
      coherenceTimeUs: 245.4,
      lastOutcome: null,
      language: 'es',
      isPauseMenuOpen: false,
      completedMissions: [],
    });
  });

  describe('MissionHeader (src/components/game/MissionHeader.tsx)', () => {
    it('anchors at top edge (fixed top-0 left-0 right-0 z-20)', () => {
      render(<MissionHeader missionId="superposition" />);
      const header = screen.getByTestId('mission-header');
      expect(header.className).toContain('fixed');
      expect(header.className).toContain('top-0');
      expect(header.className).toContain('left-0');
      expect(header.className).toContain('right-0');
      expect(header.className).toContain('z-20');
    });

    it('displays current mission ID and title', () => {
      render(<MissionHeader missionId="superposition" />);
      expect(screen.getByText('[M.0]')).toBeDefined();
      expect(screen.getByTestId('mission-title').textContent).toContain('Superposición');
    });

    it('displays the step objective ticker', () => {
      render(<MissionHeader missionId="superposition" />);
      const ticker = screen.getByTestId('step-objective-ticker');
      expect(ticker).toBeDefined();
      expect(ticker.textContent).toContain('OBJECTIVE:');
      expect(ticker.textContent).toContain('Distinguir el bit clásico del qubit');
    });

    it('toggles language between ES and EN when switch is clicked', () => {
      render(<MissionHeader missionId="superposition" />);
      const langBtn = screen.getByTestId('language-switch');
      expect(useQuantumStore.getState().language).toBe('es');

      // Click to toggle to English
      fireEvent.click(langBtn);
      expect(useQuantumStore.getState().language).toBe('en');

      // Click to toggle back to Spanish
      fireEvent.click(langBtn);
      expect(useQuantumStore.getState().language).toBe('es');
    });

    it('toggles pause menu when ESC Pause button is clicked', () => {
      render(<MissionHeader missionId="superposition" />);
      const pauseBtn = screen.getByTestId('esc-pause-button');
      expect(useQuantumStore.getState().isPauseMenuOpen).toBe(false);

      fireEvent.click(pauseBtn);
      expect(useQuantumStore.getState().isPauseMenuOpen).toBe(true);
    });
  });

  describe('MissionWorkspace (src/features/missions/MissionWorkspace.tsx)', () => {
    it('anchors Qubit angle sliders and Gate action buttons in a floating bottom-left panel (fixed bottom-4 left-4 z-20)', () => {
      render(<MissionWorkspace missionId="superposition" />);
      const controls = screen.getByTestId('floating-gate-controls');
      expect(controls.className).toContain('fixed');
      expect(controls.className).toContain('bottom-4');
      expect(controls.className).toContain('left-4');
      expect(controls.className).toContain('z-20');
      expect(controls.className).toContain('w-80');
    });

    it('renders Qubit angle sliders (theta, phi) and responds to change events', () => {
      render(<MissionWorkspace missionId="superposition" />);
      const thetaSlider = screen.getByTestId('slider-theta');
      const phiSlider = screen.getByTestId('slider-phi');

      expect(thetaSlider).toBeDefined();
      expect(phiSlider).toBeDefined();

      fireEvent.change(thetaSlider, { target: { value: '1.57' } });
      expect(useQuantumStore.getState().theta).toBeCloseTo(1.57, 2);

      fireEvent.change(phiSlider, { target: { value: '3.14' } });
      expect(useQuantumStore.getState().phi).toBeCloseTo(3.14, 2);
    });

    it('renders Quantum Gate action buttons (X, Y, Z, H) and applies gates to quantum state', () => {
      render(<MissionWorkspace missionId="superposition" />);
      const btnX = screen.getByTestId('gate-button-X');
      const btnY = screen.getByTestId('gate-button-Y');
      const btnZ = screen.getByTestId('gate-button-Z');
      const btnH = screen.getByTestId('gate-button-H');

      expect(btnX).toBeDefined();
      expect(btnY).toBeDefined();
      expect(btnZ).toBeDefined();
      expect(btnH).toBeDefined();

      // State starts at |0⟩ (theta=0, phi=0). Applying H should transition theta to π/2
      fireEvent.click(btnH);
      expect(useQuantumStore.getState().theta).toBeCloseTo(Math.PI / 2, 2);

      // Applying X should flip
      fireEvent.click(btnX);
      expect(Number.isFinite(useQuantumStore.getState().theta)).toBe(true);
    });

    it('collapses and expands gate controls to free up viewport corner', () => {
      render(<MissionWorkspace missionId="superposition" />);
      const toggleBtn = screen.getByTestId('gate-controls-toggle');
      expect(screen.getByTestId('gate-controls-content')).toBeDefined();

      // Click to collapse
      fireEvent.click(toggleBtn);
      expect(screen.queryByTestId('gate-controls-content')).toBeNull();

      // Click to re-expand
      fireEvent.click(toggleBtn);
      expect(screen.getByTestId('gate-controls-content')).toBeDefined();
    });

    it('keeps center 90%+ clear by keeping root container pointer-events-none and floating widgets on perimeter', () => {
      render(<MissionWorkspace missionId="superposition" />);
      const root = screen.getByTestId('mission-workspace');
      expect(root.className).toContain('pointer-events-none');

      // Top edge header
      const header = screen.getByTestId('mission-header');
      expect(header.className).toContain('fixed');
      expect(header.className).toContain('top-0');

      // Bottom-left controls
      const leftControls = screen.getByTestId('floating-gate-controls');
      expect(leftControls.className).toContain('fixed');
      expect(leftControls.className).toContain('bottom-4');
      expect(leftControls.className).toContain('left-4');

      // Bottom-right math dock
      const mathDock = screen.getByTestId('math-dock');
      expect(mathDock.className).toContain('fixed');
      expect(mathDock.className).toContain('bottom-4');
      expect(mathDock.className).toContain('right-4');
    });
  });
});
