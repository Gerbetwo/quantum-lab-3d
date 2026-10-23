import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuantumLab } from '../QuantumLab';

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

  it('applies Hadamard, Pauli-X, and Pauli-Z gates upon button clicks', () => {
    render(<QuantumLab />);

    // Initial state is |+⟩. Applying H should yield |0⟩
    const hButton = screen.getByRole('button', { name: /Hadamard/i });
    fireEvent.click(hButton);

    expect(screen.getByText(/1\.000\|0⟩/)).toBeInTheDocument();
    expect(screen.getByText(/P\(\|0⟩\):\s*100\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/P\(\|1⟩\):\s*0\.0%/)).toBeInTheDocument();

    // Applying X to |0⟩ should yield |1⟩
    const xButton = screen.getByRole('button', { name: /Pauli-X/i });
    fireEvent.click(xButton);

    expect(screen.getByText(/1\.000\|1⟩/)).toBeInTheDocument();
    expect(screen.getByText(/P\(\|0⟩\):\s*0\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/P\(\|1⟩\):\s*100\.0%/)).toBeInTheDocument();

    // Applying Z to |1⟩ should keep it in |1⟩
    const zButton = screen.getByRole('button', { name: /Pauli-Z/i });
    fireEvent.click(zButton);
    expect(screen.getByText(/P\(\|1⟩\):\s*100\.0%/)).toBeInTheDocument();
  });

  it('performs measurement collapse and displays outcome badge', () => {
    render(<QuantumLab />);

    const measureButton = screen.getByRole('button', { name: /Measure State/i });
    fireEvent.click(measureButton);

    // Collapsed outcome badge should be visible
    expect(screen.getByText(/Outcome:\s*\|(0|1)⟩/)).toBeInTheDocument();
  });

  it('resets state to ground state |0> when clicking Reset button', () => {
    render(<QuantumLab />);

    // Initially |+⟩, click reset
    const resetButton = screen.getByRole('button', { name: /Reset to \|0⟩/i });
    fireEvent.click(resetButton);

    expect(screen.getByText(/1\.000\|0⟩/)).toBeInTheDocument();
    expect(screen.getByText(/P\(\|0⟩\):\s*100\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/P\(\|1⟩\):\s*0\.0%/)).toBeInTheDocument();
  });
});
