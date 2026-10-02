import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission2Entanglement from '@/components/missions/Mission2Entanglement';
import { goToStep } from '../helpers/queries';

vi.mock('@/lib/sound', () => ({
  playButtonClick: vi.fn(),
  playChimeSuccess: vi.fn(),
  playLaserScan: vi.fn(),
  playQuantumCollapse: vi.fn(),
}));

vi.mock('@/lib/cookies', () => ({
  saveCompletedMission: vi.fn(),
  updateStoredMetrics: vi.fn(),
}));

describe('HU-09..HU-13 - Mission 2 Entanglement Component', () => {
  const onComplete = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('HU-09: toggles independent qubits separately', () => {
    render(<Mission2Entanglement onComplete={onComplete} onBack={onBack} />);
    expect(screen.getByText('Dos Qubits Independientes')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Conmutar Alice/i }));
    expect(screen.getByText('|1⟩')).toBeInTheDocument();
  });

  it('HU-12 & HU-13: correlated measurement with deterministic RNG, then quiz B', () => {
    render(
      <Mission2Entanglement
        onComplete={onComplete}
        onBack={onBack}
        __testRandom={() => 0.2}
      />
    );

    fireEvent.click(goToStep(4));
    fireEvent.click(screen.getByRole('button', { name: /Medir en Laboratorio de Alice/i }));

    expect(screen.getByText(/Correlación Perfecta Instantánea/i)).toBeInTheDocument();
    expect(screen.getByTestId('alice-state')).toHaveTextContent('|0⟩');
    expect(screen.getByTestId('bob-state')).toHaveTextContent('|0⟩');

    fireEvent.click(goToStep(5));
    fireEvent.click(screen.getByRole('button', { name: /Instantáneamente el estado correlacionado/i }));
    expect(screen.getByText(/Correcto! En un estado entrelazado/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Pasar a Tarea 3/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
