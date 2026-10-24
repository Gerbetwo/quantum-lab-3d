import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MissionSubpanel } from '../MissionSubpanel';

describe('MissionSubpanel - Dynamic Mission-Aware Observable Paneling', () => {
  it('Mission 1 (Superposition): renders Bloch coordinates (θ, φ) and superposition amplitudes (α, β)', () => {
    const onReset = vi.fn();
    render(
      <MissionSubpanel
        activeTab={0}
        state={{ theta: Math.PI / 2, phi: 0 }}
        onReset={onReset}
      />
    );

    // Verify Mission 1 container
    expect(screen.getByTestId('mission-1-superposition')).toBeInTheDocument();
    expect(screen.getByTestId('bloch-coordinates')).toBeInTheDocument();
    expect(screen.getByTestId('superposition-amplitudes')).toBeInTheDocument();

    // Verify coordinates values
    expect(screen.getByText('90°')).toBeInTheDocument();
    expect(screen.getByText('0°')).toBeInTheDocument();

    // Verify other mission components are absent
    expect(screen.queryByTestId('unitary-matrix-metrics')).not.toBeInTheDocument();
    expect(screen.queryByTestId('collapse-probabilities')).not.toBeInTheDocument();
    expect(screen.queryByTestId('multi-qubit-tensor-state')).not.toBeInTheDocument();

    // Verify minimal essential action button: Reset
    const resetBtn = screen.getByTestId('subpanel-reset-button');
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);

    // Verify manual directional arrow buttons are REMOVED from the subpanel
    expect(screen.queryByRole('button', { name: /ArrowUp|ArrowDown|ArrowLeft|ArrowRight|North|South|Rotate Up|Rotate Down/i })).not.toBeInTheDocument();
  });

  it('Mission 2 (Gates): displays unitary matrix transformation metrics and gate sequence execution history', () => {
    render(
      <MissionSubpanel
        activeTab={1}
        activeGate="H"
        gateHistory={['H', 'X', 'Z']}
      />
    );

    expect(screen.getByTestId('mission-2-gates')).toBeInTheDocument();
    expect(screen.getByTestId('unitary-matrix-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('gate-execution-history')).toBeInTheDocument();

    // Verify matrix content and gate sequence badges
    expect(screen.getAllByText('1/√2').length).toBeGreaterThan(0);
    expect(screen.getByText('1. H')).toBeInTheDocument();
    expect(screen.getByText('2. X')).toBeInTheDocument();
    expect(screen.getByText('3. Z')).toBeInTheDocument();
  });

  it('Mission 3 (Measurement): displays collapse probabilities (|α|², |β|²) and ensemble frequency statistics', () => {
    const onMeasure = vi.fn();
    render(
      <MissionSubpanel
        activeTab={2}
        state={{ theta: Math.PI / 3, phi: 0 }}
        lastOutcome={0}
        measurementStats={{
          totalShots: 100,
          count0: 75,
          count1: 25,
          frequency0: 0.75,
          frequency1: 0.25,
        }}
        onMeasure={onMeasure}
      />
    );

    expect(screen.getByTestId('mission-3-measurement')).toBeInTheDocument();
    expect(screen.getByTestId('collapse-probabilities')).toBeInTheDocument();
    expect(screen.getByTestId('ensemble-frequency-stats')).toBeInTheDocument();
    expect(screen.getByTestId('subpanel-outcome-badge')).toHaveTextContent('|0⟩');
    expect(screen.getByText('100')).toBeInTheDocument();

    // Measure action button is present and triggers callback
    const measureBtn = screen.getByTestId('subpanel-measure-button');
    expect(measureBtn).toBeInTheDocument();
    fireEvent.click(measureBtn);
    expect(onMeasure).toHaveBeenCalledTimes(1);
  });

  it('Mission 4 (Entanglement & Thermal): displays multi-qubit tensor state (|00⟩, |01⟩, |10⟩, |11⟩), entropy and fidelity', () => {
    render(
      <MissionSubpanel
        missionId="entanglement"
        state={{ theta: Math.PI / 2, phi: 0 }}
        temperature={150}
        t2Time={200}
        vectorPurity={0.82}
        entangledPair={{ alice: 0, bob: 0, state: '|00⟩' }}
      />
    );

    expect(screen.getByTestId('mission-4-multi-qubit')).toBeInTheDocument();
    expect(screen.getByTestId('multi-qubit-tensor-state')).toBeInTheDocument();
    expect(screen.getByTestId('thermal-entropy-metric')).toBeInTheDocument();
    expect(screen.getByTestId('fidelity-metric')).toBeInTheDocument();

    // Verify all 4 basis states are displayed
    expect(screen.getAllByText('|00⟩').length).toBeGreaterThan(0);
    expect(screen.getAllByText('|01⟩').length).toBeGreaterThan(0);
    expect(screen.getAllByText('|10⟩').length).toBeGreaterThan(0);
    expect(screen.getAllByText('|11⟩').length).toBeGreaterThan(0);

    // Verify thermal metrics
    expect(screen.getByTestId('thermal-entropy-metric')).toHaveTextContent(/Thermal Entropy/i);
    expect(screen.getByTestId('fidelity-metric')).toHaveTextContent(/State Fidelity/i);
    expect(screen.getByText(/T = 150 mK/i)).toBeInTheDocument();
  });

  it('shifts dynamically between missions when activeTab or missionId prop changes', () => {
    const { rerender } = render(<MissionSubpanel activeTab={0} />);
    expect(screen.getByTestId('mission-1-superposition')).toBeInTheDocument();

    rerender(<MissionSubpanel activeTab={1} />);
    expect(screen.getByTestId('mission-2-gates')).toBeInTheDocument();

    rerender(<MissionSubpanel activeTab={2} />);
    expect(screen.getByTestId('mission-3-measurement')).toBeInTheDocument();

    rerender(<MissionSubpanel activeTab={3} />);
    expect(screen.getByTestId('mission-4-multi-qubit')).toBeInTheDocument();
  });
});
