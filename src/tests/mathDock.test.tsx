import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MathDock } from '@/features/quantum-core/MathDock';
import { useQuantumStore } from '@/store/useQuantumStore';

describe('MathDock Floating Widget (HU-MVP-02, HU-MVP-05)', () => {
  beforeEach(() => {
    // Reset state to ground state |0⟩
    useQuantumStore.setState({
      language: 'en',
      theta: 0,
      phi: 0,
      temperatureK: 0.015,
      coherenceTimeUs: 245.4,
      lastOutcome: null,
    });
  });

  it('anchors as a compact floating widget in the bottom-right corner (fixed bottom-4 right-4 z-20 w-80)', () => {
    render(<MathDock />);
    const dock = screen.getByTestId('math-dock');
    expect(dock.className).toContain('fixed');
    expect(dock.className).toContain('bottom-4');
    expect(dock.className).toContain('right-4');
    expect(dock.className).toContain('z-20');
    expect(dock.className).toContain('w-80');
  });

  it('displays Dirac state vector |ψ⟩ = α|0⟩ + β|1⟩ in high-rigor monospace text', () => {
    // Set to equal superposition state (|0⟩ + |1⟩)/√2 (θ = π/2)
    useQuantumStore.setState({
      theta: Math.PI / 2,
      phi: 0,
    });

    render(<MathDock />);
    const formula = screen.getByTestId('state-vector-formula');
    expect(formula.className).toContain('font-mono');
    expect(formula.textContent).toContain('|ψ⟩ = 0.707|0⟩ + 0.707|1⟩');
    expect(screen.getByText(/α = cos\(θ\/2\) = 0\.707/)).toBeDefined();
    expect(screen.getByText(/β = sin\(θ\/2\) = 0\.707/)).toBeDefined();
  });

  it('displays Born probabilities P(|0⟩) and P(|1⟩) synchronized with quantum state', () => {
    useQuantumStore.setState({
      theta: Math.PI / 2,
    });

    render(<MathDock />);
    expect(screen.getByText('P(|0⟩) [Born P₀]')).toBeDefined();
    expect(screen.getByText('P(|1⟩) [Born P₁]')).toBeDefined();
    // In equal superposition: 50.0% each
    const prob0Elements = screen.getAllByText(/50\.0%/);
    expect(prob0Elements.length).toBeGreaterThanOrEqual(2);
  });

  it('displays cryogenic T₂ decoherence readouts with high-rigor monospace units', () => {
    useQuantumStore.setState({
      temperatureK: 0.05,
      coherenceTimeUs: 234.8,
    });

    render(<MathDock />);
    expect(screen.getByText(/Coherence T₂\(T\)/)).toBeDefined();
    expect(screen.getByText('234.8')).toBeDefined();
    expect(screen.getAllByText(/50 mK/).length).toBeGreaterThanOrEqual(1);
  });

  it('toggles collapse and expand to allow full 3D viewport inspection', () => {
    render(<MathDock />);
    const toggleButton = screen.getByTestId('math-dock-toggle');
    expect(toggleButton).toBeDefined();
    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');

    // Content should be visible initially
    expect(screen.getByTestId('math-dock-content')).toBeDefined();

    // Click to collapse
    fireEvent.click(toggleButton);
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId('math-dock-content')).toBeNull();

    // Click to expand again
    fireEvent.click(toggleButton);
    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('math-dock-content')).toBeDefined();
  });

  it('supports defaultCollapsed prop', () => {
    render(<MathDock defaultCollapsed={true} />);
    const toggleButton = screen.getByTestId('math-dock-toggle');
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId('math-dock-content')).toBeNull();
  });

  it('triggers measurement collapse from the floating telemetry dock', () => {
    render(<MathDock />);
    const measureBtn = screen.getByRole('button', { name: /Measure State \(Collapse\)/i });
    fireEvent.click(measureBtn);
    const storeState = useQuantumStore.getState();
    expect(storeState.lastOutcome === 0 || storeState.lastOutcome === 1).toBe(true);
  });

  it('renders Born probabilities in a streamlined, compact single-line readout', () => {
    useQuantumStore.setState({
      theta: Math.PI / 2,
    });
    render(<MathDock />);
    const singleLineReadout = screen.getByTestId('born-probabilities-readout');
    expect(singleLineReadout).toBeDefined();
    expect(singleLineReadout.className).toContain('font-mono');
    expect(singleLineReadout.className).toContain('tabular-nums');
    expect(singleLineReadout.textContent).toContain('50.0%');
  });

  it('defaults to a collapsed state when entering active missions', () => {
    useQuantumStore.setState({
      appViewState: 'IN_MISSION',
    });
    render(<MathDock />);
    const toggleButton = screen.getByTestId('math-dock-toggle');
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId('math-dock-content')).toBeNull();

    // User can still expand on demand
    fireEvent.click(toggleButton);
    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('math-dock-content')).toBeDefined();
  });
});
