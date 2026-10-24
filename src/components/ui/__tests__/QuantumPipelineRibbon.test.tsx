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

describe('QuantumPipelineRibbon Progressive Unlocking & Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('ql-lang');
  });

  describe('Progressive Ribbon Unlocking', () => {
    it('Mission 1 (activeTab=0): renders Phase 1 (PREPARE) only; TRANSFORM and MEASURE are absent', () => {
      const { container } = render(<QuantumPipelineRibbon activeTab={0} />);

      expect(screen.getByTestId('phase-prepare')).toBeInTheDocument();
      expect(screen.queryByTestId('phase-transform')).not.toBeInTheDocument();
      expect(screen.queryByTestId('phase-measure')).not.toBeInTheDocument();

      // No ChevronRight dividers rendered in single-phase prepare view
      expect(container.querySelectorAll('svg.lucide-chevron-right').length).toBe(0);
    });

    it('Mission 2 (activeTab=1): unlocks Phase 2 (TRANSFORM); MEASURE is hidden', () => {
      const { container } = render(<QuantumPipelineRibbon activeTab={1} />);

      expect(screen.getByTestId('phase-prepare')).toBeInTheDocument();
      expect(screen.getByTestId('phase-transform')).toBeInTheDocument();
      expect(screen.queryByTestId('phase-measure')).not.toBeInTheDocument();

      // Exactly 1 ChevronRight divider between PREPARE and TRANSFORM
      expect(container.querySelectorAll('svg.lucide-chevron-right').length).toBe(1);
    });

    it('Mission 3 (activeTab=2): unlocks Phase 3 (MEASURE); all 3 phases are rendered', () => {
      const { container } = render(<QuantumPipelineRibbon activeTab={2} />);

      expect(screen.getByTestId('phase-prepare')).toBeInTheDocument();
      expect(screen.getByTestId('phase-transform')).toBeInTheDocument();
      expect(screen.getByTestId('phase-measure')).toBeInTheDocument();

      // Exactly 2 ChevronRight dividers separating PREPARE -> TRANSFORM -> MEASURE
      expect(container.querySelectorAll('svg.lucide-chevron-right').length).toBe(2);
    });
  });

  describe('Pipeline Interactivity & Audio Cues', () => {
    it('handles preset selection in PREPARE and triggers playVectorSnap and callback', () => {
      const onPreparePreset = vi.fn();
      render(<QuantumPipelineRibbon activeTab={0} onPreparePreset={onPreparePreset} />);

      const plusButton = screen.getByRole('button', { name: /Prepare Superposition \|\+⟩/i });
      fireEvent.click(plusButton);

      expect(soundEngineModule.playVectorSnap).toHaveBeenCalledTimes(1);
      expect(onPreparePreset).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'plus',
          symbol: '|+⟩',
        })
      );
    });

    it('handles quantum gate transforms in TRANSFORM and triggers playGateSweep', () => {
      const onTransformGate = vi.fn();
      render(<QuantumPipelineRibbon activeTab={1} onTransformGate={onTransformGate} />);

      const hButton = screen.getByRole('button', { name: /Apply Hadamard Gate/i });
      fireEvent.click(hButton);

      expect(soundEngineModule.playGateSweep).toHaveBeenCalledWith('H');
      expect(onTransformGate).toHaveBeenCalledWith('H');

      const xButton = screen.getByRole('button', { name: /Apply Pauli-X Gate/i });
      fireEvent.click(xButton);

      expect(soundEngineModule.playGateSweep).toHaveBeenCalledWith('X');
      expect(onTransformGate).toHaveBeenCalledWith('X');
    });

    it('handles measurement collapse in MEASURE, triggers playCollapseDrop and displays outcome badge', () => {
      const onMeasure = vi.fn();
      const { rerender } = render(<QuantumPipelineRibbon activeTab={2} onMeasure={onMeasure} />);

      const collapseButton = screen.getByRole('button', { name: /Collapse Wavefunction Measurement/i });
      fireEvent.click(collapseButton);

      expect(soundEngineModule.playCollapseDrop).toHaveBeenCalledTimes(1);
      expect(onMeasure).toHaveBeenCalledTimes(1);

      rerender(<QuantumPipelineRibbon activeTab={2} lastOutcome={0} />);
      expect(screen.getByTestId('pipeline-outcome-badge')).toHaveTextContent('|0⟩');
    });

    it('handles state reset and triggers playVectorSnap', () => {
      const onReset = vi.fn();
      render(<QuantumPipelineRibbon activeTab={0} onReset={onReset} />);

      const resetButton = screen.getByRole('button', { name: /Reset State/i });
      fireEvent.click(resetButton);

      expect(soundEngineModule.playVectorSnap).toHaveBeenCalledTimes(1);
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('disables all interaction buttons across all phases when disabled prop is true', () => {
      render(<QuantumPipelineRibbon activeTab={2} disabled={true} />);

      const resetButton = screen.getByRole('button', { name: /Reset State/i });
      expect(resetButton).toBeDisabled();

      const hButton = screen.getByRole('button', { name: /Apply Hadamard Gate/i });
      expect(hButton).toBeDisabled();

      const collapseButton = screen.getByRole('button', { name: /Collapse Wavefunction Measurement/i });
      expect(collapseButton).toBeDisabled();
    });
  });

  describe('Localization', () => {
    it('renders localized labels and aria attributes in Spanish across active phases', () => {
      localStorage.setItem('ql-lang', 'es');

      const { rerender } = render(<QuantumPipelineRibbon activeTab={2} />);

      // Collapse button translated to Spanish
      expect(screen.getByText('COLAPSAR')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Medición con colapso de función de onda/i })
      ).toBeInTheDocument();

      // Tab 3: Entanglement result badge
      rerender(
        <QuantumPipelineRibbon
          activeTab={3}
          entangledPair={{ alice: 0, bob: 0, state: '|00⟩' }}
        />
      );
      expect(screen.getByText('Resultado: |00⟩')).toBeInTheDocument();

      // Tab 6: QEC flip label and ARIA attributes
      rerender(<QuantumPipelineRibbon activeTab={6} qecTriple={[0, 0, 0]} />);
      expect(screen.getByText('Invertir:')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Inyectar inversión de bit en cúbit 1' })
      ).toBeInTheDocument();
    });
  });
});
