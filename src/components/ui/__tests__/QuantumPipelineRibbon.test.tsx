import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { QuantumPipelineRibbon } from '../QuantumPipelineRibbon';
import * as soundEngineModule from '@/lib/audio/soundEngine';

vi.mock('@/lib/audio/soundEngine', () => ({
  playVectorSnap: vi.fn(),
  playGateSweep: vi.fn(),
  playCollapseDrop: vi.fn(),
  playCompletionTriad: vi.fn(),
}));

describe('QuantumPipelineRibbon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 3 unified phases: PREPARE, TRANSFORM, MEASURE', () => {
    render(<QuantumPipelineRibbon />);

    expect(screen.getByTestId('phase-prepare')).toBeInTheDocument();
    expect(screen.getByTestId('phase-transform')).toBeInTheDocument();
    expect(screen.getByTestId('phase-measure')).toBeInTheDocument();
  });

  it('handles preset selection and triggers playVectorSnap and callback', () => {
    const onPreparePreset = vi.fn();
    render(<QuantumPipelineRibbon onPreparePreset={onPreparePreset} />);

    const plusButton = screen.getByRole('button', { name: /Prepare Superposition \|\+⟩/i });
    fireEvent.click(plusButton);

    expect(soundEngineModule.playVectorSnap).toHaveBeenCalledTimes(1);
    expect(onPreparePreset).toHaveBeenCalledTimes(1);
    expect(onPreparePreset).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'plus',
        symbol: '|+⟩',
      })
    );
  });

  it('handles quantum gate transforms and triggers playGateSweep', () => {
    const onTransformGate = vi.fn();
    render(<QuantumPipelineRibbon onTransformGate={onTransformGate} />);

    const hButton = screen.getByRole('button', { name: /Apply Hadamard Gate/i });
    fireEvent.click(hButton);

    expect(soundEngineModule.playGateSweep).toHaveBeenCalledWith('H');
    expect(onTransformGate).toHaveBeenCalledWith('H');

    const xButton = screen.getByRole('button', { name: /Apply Pauli-X Gate/i });
    fireEvent.click(xButton);

    expect(soundEngineModule.playGateSweep).toHaveBeenCalledWith('X');
    expect(onTransformGate).toHaveBeenCalledWith('X');
  });

  it('handles measurement collapse, triggers playCollapseDrop and displays outcome badge', () => {
    const onMeasure = vi.fn();
    const { rerender } = render(<QuantumPipelineRibbon onMeasure={onMeasure} />);

    const collapseButton = screen.getByRole('button', { name: /Collapse Wavefunction Measurement/i });
    fireEvent.click(collapseButton);

    expect(soundEngineModule.playCollapseDrop).toHaveBeenCalledTimes(1);
    expect(onMeasure).toHaveBeenCalledTimes(1);

    rerender(<QuantumPipelineRibbon lastOutcome={0} />);
    expect(screen.getByTestId('pipeline-outcome-badge')).toHaveTextContent('|0⟩');
  });

  it('handles state reset and triggers playVectorSnap', () => {
    const onReset = vi.fn();
    render(<QuantumPipelineRibbon onReset={onReset} />);

    const resetButton = screen.getByRole('button', { name: /Reset State/i });
    fireEvent.click(resetButton);

    expect(soundEngineModule.playVectorSnap).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('disables all interaction buttons when disabled prop is true', () => {
    render(<QuantumPipelineRibbon disabled={true} />);

    const collapseButton = screen.getByRole('button', { name: /Collapse Wavefunction Measurement/i });
    expect(collapseButton).toBeDisabled();

    const hButton = screen.getByRole('button', { name: /Apply Hadamard Gate/i });
    expect(hButton).toBeDisabled();
  });
});
