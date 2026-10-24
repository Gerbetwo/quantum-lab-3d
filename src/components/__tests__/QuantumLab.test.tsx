import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuantumLab, WORKSHOP_TABS } from '../QuantumLab';

describe('QuantumLab Workspace Component', () => {
  it('renders initial state vector in superposition with Born probabilities', () => {
    render(<QuantumLab />);

    // Default state theta = PI/2, phi = 0 -> |+⟩ = 0.707|0⟩ + 0.707|1⟩
    expect(screen.getByText(/State Vector Readout/i)).toBeInTheDocument();
    expect(screen.getByText(/\|\s*ψ\s*⟩/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.707\|0⟩/)).toBeInTheDocument();
    expect(screen.getByText(/\+\s*0\.707\|1⟩/)).toBeInTheDocument();

    // Probability percentages
    expect(screen.getByText(/P\(\|0⟩\):\s*50\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/P\(\|1⟩\):\s*50\.0%/)).toBeInTheDocument();
  });

  it('applies Hadamard, Pauli-X, and Pauli-Z gates upon ribbon gate clicks', () => {
    render(<QuantumLab />);

    // Switch to Mission 2 where Phase 2 TRANSFORM gates are unlocked
    fireEvent.click(screen.getByTestId('mission-dropdown-trigger'));
    fireEvent.click(screen.getByRole('button', { name: '2. Gates' }));

    // Initial state is |+⟩. Applying H should yield |0⟩
    const hButton = screen.getByTestId('gate-button-H');
    fireEvent.click(hButton);

    expect(screen.getByText(/1\.000\|0⟩/)).toBeInTheDocument();
    expect(screen.getByText(/P\(\|0⟩\):\s*100\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/P\(\|1⟩\):\s*0\.0%/)).toBeInTheDocument();

    // Applying X to |0⟩ should yield |1⟩
    const xButton = screen.getByTestId('gate-button-X');
    fireEvent.click(xButton);

    expect(screen.getByText(/1\.000\|1⟩/)).toBeInTheDocument();
    expect(screen.getByText(/P\(\|0⟩\):\s*0\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/P\(\|1⟩\):\s*100\.0%/)).toBeInTheDocument();

    // Applying Z to |1⟩ should keep it in |1⟩
    const zButton = screen.getByTestId('gate-button-Z');
    fireEvent.click(zButton);
    expect(screen.getByText(/P\(\|1⟩\):\s*100\.0%/)).toBeInTheDocument();
  });

  it('performs measurement collapse and displays outcome badge', () => {
    render(<QuantumLab />);

    // Switch to Mission 3 where Phase 3 MEASURE collapse is unlocked
    fireEvent.click(screen.getByTestId('mission-dropdown-trigger'));
    fireEvent.click(screen.getByRole('button', { name: '3. Measurement' }));

    const measureButton = screen.getByTestId('measure-collapse-button');
    fireEvent.click(measureButton);

    // Collapsed outcome badge should be visible
    expect(screen.getAllByText(/\|(0|1)⟩/)[0]).toBeInTheDocument();
  });

  it('resets state to ground state |0> when preparing ground preset', () => {
    render(<QuantumLab />);

    // Initially |+⟩, click prepare ground |0⟩ preset
    const groundPreset = screen.getByRole('button', { name: /Prepare Ground \|0⟩/i });
    fireEvent.click(groundPreset);

    expect(screen.getByText(/1\.000\|0⟩/)).toBeInTheDocument();
    expect(screen.getByText(/P\(\|0⟩\):\s*100\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/P\(\|1⟩\):\s*0\.0%/)).toBeInTheDocument();
  });

  it('interacts with Tier 3 QuantumPipelineRibbon controls and gates', () => {
    render(<QuantumLab />);

    // Switch to Mission 3 where all phases (PREPARE, TRANSFORM, MEASURE) are unlocked
    fireEvent.click(screen.getByTestId('mission-dropdown-trigger'));
    fireEvent.click(screen.getByRole('button', { name: '3. Measurement' }));

    // Apply Hadamard via ribbon
    const ribbonHadamard = screen.getByRole('button', { name: /Apply Hadamard Gate/i });
    fireEvent.click(ribbonHadamard);
    expect(screen.getByText(/1\.000\|0⟩/)).toBeInTheDocument();

    // Prepare |1⟩ preset via ribbon
    const ribbonPreset1 = screen.getByRole('button', { name: /Prepare Excited \|1⟩/i });
    fireEvent.click(ribbonPreset1);
    expect(screen.getByText(/1\.000\|1⟩/)).toBeInTheDocument();

    // Measure via ribbon collapse button
    const ribbonCollapse = screen.getByTestId('measure-collapse-button');
    fireEvent.click(ribbonCollapse);
    expect(screen.getAllByText(/\|(0|1)⟩/)[0]).toBeInTheDocument();
  });

  it('opens mission dropdown menu and switches active mission views', () => {
    render(<QuantumLab />);

    // Trigger mission dropdown
    const dropdownTrigger = screen.getByTestId('mission-dropdown-trigger');
    expect(dropdownTrigger).toBeInTheDocument();
    fireEvent.click(dropdownTrigger);

    // Verify all 7 mission options are displayed in dropdown
    WORKSHOP_TABS.forEach((tab) => {
      expect(screen.getByRole('button', { name: tab })).toBeInTheDocument();
    });

    // Switch to Mission 2
    fireEvent.click(screen.getByRole('button', { name: '2. Gates' }));
    expect(screen.getByRole('heading', { name: /2\. Quantum Gates/i })).toBeInTheDocument();

    // Switch to Mission 3
    fireEvent.click(screen.getByTestId('mission-dropdown-trigger'));
    fireEvent.click(screen.getByRole('button', { name: '3. Measurement' }));
    expect(screen.getByRole('heading', { name: /3\. Measurement Collapse/i })).toBeInTheDocument();
  });

  it('interacts with Tab 4 (Entanglement): measures correlated Bell pair', () => {
    render(<QuantumLab />);

    fireEvent.click(screen.getByTestId('mission-dropdown-trigger'));
    fireEvent.click(screen.getByRole('button', { name: '4. Entanglement' }));
    expect(screen.getByRole('heading', { name: /4\. Entanglement/i })).toBeInTheDocument();
    expect(screen.getByText(/Correlated Pair Telemetry/i)).toBeInTheDocument();

    // Measure pair via ribbon
    const measureEntangledBtn = screen.getByRole('button', { name: /Measure Entangled Pair/i });
    fireEvent.click(measureEntangledBtn);

    // Should display either |00⟩ or |11⟩
    expect(screen.getAllByText(/Result:\s*\|(00|11)⟩/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Perfect Correlation:\s*\|(00|11)⟩/)).toBeInTheDocument();
  });

  it('interacts with Tab 5 (Decoherence): adjusts temperature slider and updates T2', () => {
    render(<QuantumLab />);

    fireEvent.click(screen.getByTestId('mission-dropdown-trigger'));
    fireEvent.click(screen.getByRole('button', { name: '5. Decoherence' }));
    expect(screen.getByRole('heading', { name: /5\. Decoherence/i })).toBeInTheDocument();
    expect(screen.getByText(/Decoherence Telemetry/i)).toBeInTheDocument();

    const slider = screen.getAllByRole('slider')[0];
    expect(slider).toBeInTheDocument();
    expect(screen.getAllByText(/245\.4\s*μs/)[0]).toBeInTheDocument();

    // Change temperature via slider
    fireEvent.change(slider, { target: { value: '300' } });

    // T2 at 300mK = 250 * exp(-300/800) = 171.8 μs
    expect(screen.getAllByText(/171\.8\s*μs/)[0]).toBeInTheDocument();
  });

  it('interacts with Tab 6 (Grover Search): selects target and runs diffusion step', () => {
    render(<QuantumLab />);

    fireEvent.click(screen.getByTestId('mission-dropdown-trigger'));
    fireEvent.click(screen.getByRole('button', { name: '6. Grover Search' }));
    expect(screen.getByRole('heading', { name: /6\. Grover Search/i })).toBeInTheDocument();
    expect(screen.getByText(/4-State Probability Distribution/i)).toBeInTheDocument();

    // Select target |10⟩ (index 2) via ribbon
    const targetButton = screen.getAllByRole('button', { name: '|10⟩' })[0];
    fireEvent.click(targetButton);

    // Run diffusion step via ribbon
    const runBtn = screen.getByRole('button', { name: /Run Diffusion Step/i });
    fireEvent.click(runBtn);

    // Target amplitude amplification to 100%
    expect(screen.getByText(/100\.0%/)).toBeInTheDocument();
  });

  it('interacts with Tab 7 (Error Correction): injects bit flip and runs syndrome correction', () => {
    render(<QuantumLab />);

    fireEvent.click(screen.getByTestId('mission-dropdown-trigger'));
    fireEvent.click(screen.getByRole('button', { name: '7. Error Correction' }));
    expect(screen.getByRole('heading', { name: /7\. Error Correction/i })).toBeInTheDocument();
    expect(screen.getByText(/\[q0, q1, q2\] = \[0, 0, 0\]/)).toBeInTheDocument();

    // Inject bit flip into qubit 1 via ribbon
    const injectBtn = screen.getByRole('button', { name: /Inject Bit Flip into Qubit 1/i });
    fireEvent.click(injectBtn);

    expect(screen.getByText(/\[q0, q1, q2\] = \[0, 1, 0\]/)).toBeInTheDocument();

    // Run syndrome correction via ribbon
    const correctBtn = screen.getByRole('button', { name: /Run Syndrome Correction/i });
    fireEvent.click(correctBtn);

    // Syndrome detection
    expect(screen.getByText(/Bit Flip Detected at Qubit 1!/i)).toBeInTheDocument();
    expect(screen.getByText(/Corrected State:\s*\[0, 0, 0\]/)).toBeInTheDocument();
    expect(screen.getByText(/\[q0, q1, q2\] = \[0, 0, 0\]/)).toBeInTheDocument();
  });

  it('dynamically switches language between EN and ES updating goal cards and tabs', () => {
    render(<QuantumLab />);

    // Initially in EN: superposition goal is completed at initial |+⟩ state
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText(/Prepare state \|\+⟩/i)).toBeInTheDocument();

    const langToggle = screen.getByTestId('language-toggle-button');
    expect(langToggle).toHaveTextContent('EN');

    // Switch to ES
    fireEvent.click(langToggle);
    expect(langToggle).toHaveTextContent('ES');

    // Goal card should update dynamically to Spanish
    expect(screen.getByText('COMPLETADO')).toBeInTheDocument();
    expect(screen.getByText(/Prepara el estado \|\+⟩/i)).toBeInTheDocument();

    // Mission dropdown should show Spanish tabs
    const dropdownTrigger = screen.getByTestId('mission-dropdown-trigger');
    expect(dropdownTrigger).toHaveTextContent('1. Superposición');
    fireEvent.click(dropdownTrigger);

    // Switch to Mission 2 (Gates) in Spanish
    fireEvent.click(screen.getByRole('button', { name: '2. Compuertas' }));
    expect(screen.getByText('EN PROGRESO')).toBeInTheDocument();
    expect(screen.getByText(/Ajusta la fase del brazo inferior/i)).toBeInTheDocument();

    // Switch back to EN
    fireEvent.click(langToggle);
    expect(langToggle).toHaveTextContent('EN');
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText(/Set lower-arm phase/i)).toBeInTheDocument();
  });
});
