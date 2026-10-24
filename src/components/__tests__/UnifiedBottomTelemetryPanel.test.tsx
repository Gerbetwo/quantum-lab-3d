import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedBottomTelemetryPanel } from '../UnifiedBottomTelemetryPanel';
import { computeStateMetrics } from '@/core/qubitMath';

describe('UnifiedBottomTelemetryPanel', () => {
  const defaultState = { theta: Math.PI / 2, phi: 0 };
  const defaultMetrics = computeStateMetrics(defaultState);

  const defaultProps = {
    activeTab: 0,
    state: defaultState,
    metrics: defaultMetrics,
    lastOutcome: null as 0 | 1 | null,
    onGate: vi.fn(),
    onMeasure: vi.fn(),
    onReset: vi.fn(),
    onPreparePreset: vi.fn(),
    entangledPair: null,
    onMeasureEntangled: vi.fn(),
    onResetEntangled: vi.fn(),
    temperature: 15,
    t2Time: 245.4,
    vectorPurity: 1.0,
    onTemperatureChange: vi.fn(),
    onResetTemperature: vi.fn(),
    groverTarget: 1,
    groverProbs: [0.25, 0.25, 0.25, 0.25],
    onSelectGroverTarget: vi.fn(),
    onRunGrover: vi.fn(),
    onResetGrover: vi.fn(),
    qecTriple: [0, 0, 0] as [0 | 1, 0 | 1, 0 | 1],
    syndromeInfo: null,
    onInjectBitFlip: vi.fn(),
    onRunSyndromeCorrection: vi.fn(),
    onResetQec: vi.fn(),
    activeObjective: null,
    isObjectiveCompleted: false,
    objectiveProgress: '0/2 gates',
    defaultExpanded: true,
  };

  it('renders top handle with collapsed summary and toggles expand/collapse', () => {
    render(<UnifiedBottomTelemetryPanel {...defaultProps} defaultExpanded={false} />);

    expect(screen.getByTestId('unified-bottom-telemetry-panel')).toBeInTheDocument();
    expect(screen.getByTestId('telemetry-panel-handle')).toBeInTheDocument();

    // Drawer should initially be collapsed
    expect(screen.queryByTestId('telemetry-expanded-drawer')).not.toBeInTheDocument();

    // Click handle to expand
    fireEvent.click(screen.getByTestId('telemetry-panel-handle'));
    expect(screen.getByTestId('telemetry-expanded-drawer')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(screen.getByTestId('telemetry-panel-handle'));
    expect(screen.queryByTestId('telemetry-expanded-drawer')).not.toBeInTheDocument();
  });

  it('renders single qubit telemetry readouts and precision kinematic sliders in expanded view', () => {
    const onStateChange = vi.fn();
    render(
      <UnifiedBottomTelemetryPanel
        {...defaultProps}
        activeTab={1}
        onStateChange={onStateChange}
        defaultExpanded={true}
      />
    );

    expect(screen.getByText(/State Vector Readout/i)).toBeInTheDocument();
    expect(screen.getByText(/Born Probabilities/i)).toBeInTheDocument();
    expect(screen.getByText(/Precision Kinematic Sliders/i)).toBeInTheDocument();

    // Adjust polar angle theta slider
    const thetaSlider = screen.getByLabelText(/Polar angle theta/i);
    expect(thetaSlider).toBeInTheDocument();
    fireEvent.change(thetaSlider, { target: { value: '1.25' } });
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ theta: 1.25 })
    );
  });

  it('renders cryogenic temperature controls and coherence metrics on Tab 4 (Decoherence)', () => {
    const onTempChange = vi.fn();
    render(
      <UnifiedBottomTelemetryPanel
        {...defaultProps}
        activeTab={4}
        temperature={150}
        t2Time={200}
        vectorPurity={0.8}
        onTemperatureChange={onTempChange}
        defaultExpanded={true}
      />
    );

    const tempSlider = screen.getAllByRole('slider')[0];
    expect(tempSlider).toBeInTheDocument();
    fireEvent.change(tempSlider, { target: { value: '250' } });
    expect(onTempChange).toHaveBeenCalledWith(250);

    expect(screen.getAllByText(/200\.0\s*μs/)[0]).toBeInTheDocument();
    expect(screen.getByText(/80\.0%/)).toBeInTheDocument();
  });

  it('renders 2 parity check nodes (S1 and S2) on Tab 6 (QEC)', () => {
    render(
      <UnifiedBottomTelemetryPanel
        {...defaultProps}
        activeTab={6}
        qecTriple={[0, 1, 0]}
        defaultExpanded={true}
      />
    );

    // Parity nodes
    expect(screen.getByText(/S₁ = q₀ ⊕ q₁/)).toBeInTheDocument();
    expect(screen.getByText(/S₂ = q₁ ⊕ q₂/)).toBeInTheDocument();
    expect(screen.getByText(/3-Qubit State Display/i)).toBeInTheDocument();
  });
});
