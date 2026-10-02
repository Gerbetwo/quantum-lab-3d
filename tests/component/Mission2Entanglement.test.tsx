import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission2Entanglement from '@/components/missions/Mission2Entanglement';

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

describe('HU-09..HU-13 — Mission 2 Entanglement Component', () => {
  const onComplete = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('HU-09: toggles independent qubits separately', () => {
    render(<Mission2Entanglement onComplete={onComplete} onBack={onBack} />);
    expect(screen.getByText('Dos Qubits Independientes')).toBeInTheDocument();

    const toggleAlice = screen.getByRole('button', { name: /Conmutar Alice/i });
    fireEvent.click(toggleAlice);
    expect(screen.getByText('|1⟩')).toBeInTheDocument();
  });

  it('HU-12 & HU-13: measures entangled pair and completes quiz option B', () => {
    render(<Mission2Entanglement onComplete={onComplete} onBack={onBack} />);

    // Step 4: Measurement
    const step4Btn = screen.getByTitle('Ir al paso 4');
    fireEvent.click(step4Btn);

    const measureBtn = screen.getByRole('button', { name: /Medir en Laboratorio de Alice/i });
    fireEvent.click(measureBtn);

    expect(screen.getByText(/¡Correlación Perfecta Instantánea!/i)).toBeInTheDocument();

    // Step 5: Quiz
    const step5Btn = screen.getByTitle('Ir al paso 5');
    fireEvent.click(step5Btn);

    const optionB = screen.getByRole('button', { name: /Instantáneamente el estado correlacionado/i });
    fireEvent.click(optionB);

    expect(screen.getByText(/¡Correcto! En un estado entrelazado/i)).toBeInTheDocument();

    const nextTaskBtn = screen.getByRole('button', { name: /Pasar a Tarea 3/i });
    fireEvent.click(nextTaskBtn);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
