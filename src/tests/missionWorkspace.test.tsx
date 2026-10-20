import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MissionWorkspace } from '@/features/missions/MissionWorkspace';
import { MissionHeader } from '@/components/game/MissionHeader';
import { CampaignSelectOverlay } from '@/components/game/CampaignSelectOverlay';
import { useQuantumStore } from '@/store/useQuantumStore';

describe('Floating Gate Controls & Edge Navigation (HU-MVP-03, HU-MVP-12)', () => {
  beforeEach(() => {
    useQuantumStore.setState({
      currentMissionId: 'superposition',
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

    it('renders IN PROGRESS badge when mission is incomplete and COMPLETED when finished', () => {
      useQuantumStore.setState({ completedMissions: [] });
      const { unmount } = render(<MissionHeader missionId="superposition" />);
      expect(screen.getByTestId('mission-status-in-progress')).toBeDefined();
      expect(screen.getByTestId('mission-status-in-progress').textContent).toContain('IN PROGRESS');
      expect(screen.queryByTestId('mark-completed-button')).toBeNull();
      unmount();

      useQuantumStore.setState({ completedMissions: [0] });
      render(<MissionHeader missionId="superposition" />);
      expect(screen.getByTestId('mission-status-completed')).toBeDefined();
      expect(screen.getByTestId('mission-status-completed').textContent).toContain('COMPLETED');
      expect(screen.queryByTestId('mission-status-in-progress')).toBeNull();
    });
  });

  describe('Sequential Mission Progression (CampaignSelectOverlay)', () => {
    it('locks sequential nodes until prerequisites are completed while keeping sandbox unconstrained', () => {
      useQuantumStore.setState({
        appViewState: 'CAMPAIGN_SELECT',
        completedMissions: [],
        currentMissionId: 'superposition',
      });

      const { unmount } = render(<CampaignSelectOverlay forceVisible />);

      // Mission 0 is unlocked
      const card0 = screen.getByTestId('mission-card-superposition');
      expect(card0.className).not.toContain('cursor-not-allowed');
      const btn0 = screen.getByTestId('launch-mission-superposition');
      expect(btn0.hasAttribute('disabled')).toBe(false);

      // Mission 1 is locked because Mission 0 is not completed
      const card1 = screen.getByTestId('mission-card-entanglement');
      expect(card1.className).toContain('opacity-50');
      expect(card1.className).toContain('cursor-not-allowed');
      const btn1 = screen.getByTestId('launch-mission-entanglement');
      expect(btn1.hasAttribute('disabled')).toBe(true);
      expect(btn1.textContent).toContain('LOCKED');

      // Clicking locked button does not launch the mission
      fireEvent.click(btn1);
      expect(useQuantumStore.getState().currentMissionId).toBe('superposition');

      // Sandbox card is unconstrained
      const sandboxCard = screen.getByTestId('mission-card-sandbox');
      expect(sandboxCard.className).not.toContain('opacity-50');
      expect(sandboxCard.className).not.toContain('cursor-not-allowed');
      unmount();

      // Once Mission 0 is completed, Mission 1 becomes unlocked
      useQuantumStore.setState({ completedMissions: [0] });
      render(<CampaignSelectOverlay forceVisible />);
      const card1Unlocked = screen.getByTestId('mission-card-entanglement');
      expect(card1Unlocked.className).not.toContain('cursor-not-allowed');
      const btn1Unlocked = screen.getByTestId('launch-mission-entanglement');
      expect(btn1Unlocked.hasAttribute('disabled')).toBe(false);

      // Launching unlocked mission works
      fireEvent.click(btn1Unlocked);
      expect(useQuantumStore.getState().currentMissionId).toBe('entanglement');
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

    it('renders concise action pill anchored at bottom center with pointer-events-none', () => {
      render(<MissionWorkspace missionId="superposition" />);
      const ctaPill = screen.getByTestId('mission-cta-pill');
      expect(ctaPill).toBeDefined();
      expect(ctaPill.className).toContain('fixed');
      expect(ctaPill.className).toContain('bottom-4');
      expect(ctaPill.className).toContain('left-1/2');
      expect(ctaPill.className).toContain('-translate-x-1/2');
      expect(ctaPill.className).toContain('pointer-events-none');
      expect(ctaPill.textContent).toContain('[H] SPLIT → MEASURE');
    });

    it('collapses gate controls by default on smaller viewports and supports defaultCollapsed prop', () => {
      // Test defaultCollapsed prop
      const { unmount } = render(<MissionWorkspace missionId="superposition" defaultCollapsed={true} />);
      expect(screen.queryByTestId('gate-controls-content')).toBeNull();
      const toggle = screen.getByTestId('gate-controls-toggle');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      unmount();

      // Test small viewport auto-collapse (< 768px)
      const originalInnerWidth = window.innerWidth;
      try {
        window.innerWidth = 500;
        render(<MissionWorkspace missionId="superposition" />);
        expect(screen.queryByTestId('gate-controls-content')).toBeNull();
      } finally {
        window.innerWidth = originalInnerWidth;
      }
    });

    it('defaults MathDock to collapsed in active campaign missions', () => {
      useQuantumStore.setState({ appViewState: 'IN_MISSION' });
      render(<MissionWorkspace missionId="superposition" />);
      const mathDockToggle = screen.getByTestId('math-dock-toggle');
      expect(mathDockToggle.getAttribute('aria-expanded')).toBe('false');
      expect(screen.queryByTestId('math-dock-content')).toBeNull();
    });
  });
});
