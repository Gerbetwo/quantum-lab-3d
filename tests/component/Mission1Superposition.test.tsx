import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission1Superposition from '@/components/missions/Mission1Superposition';
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

describe('HU-04..HU-08 - Mission 1 Superposition Component', () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('HU-04: toggles classical bit value from 0 to 1', () => {
    render(<Mission1Superposition onComplete={onComplete} />);

    const valueDisplay = screen.getByTestId('classic-bit-value');
    expect(valueDisplay).toHaveTextContent('0');
    expect(screen.getByText('0V (BAJO)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Tocar Interruptor/i }));

    expect(valueDisplay).toHaveTextContent('1');
    expect(screen.getByText('5V (ALTO)')).toBeInTheDocument();
  });

  it('HU-07 & HU-08: measures collapse and unlocks continuation on quiz B', () => {
    render(<Mission1Superposition onComplete={onComplete} />);

    fireEvent.click(goToStep(4));
    fireEvent.click(screen.getByRole('button', { name: /Disparar Detector Láser/i }));
    expect(screen.getByText(/Colapso Observado/i)).toBeInTheDocument();

    fireEvent.click(goToStep(5));
    fireEvent.click(screen.getByRole('button', { name: /Colapsa forzosamente/i }));
    expect(screen.getByText(/Correcto! La medición destruye/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Pasar a Tarea 2/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
