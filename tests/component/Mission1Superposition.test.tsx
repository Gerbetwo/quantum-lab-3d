import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission1Superposition from '@/components/missions/Mission1Superposition';

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

describe('HU-04..HU-08 — Mission 1 Superposition Component', () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('HU-04: toggles classical bit value from 0V to 5V', () => {
    render(<Mission1Superposition onComplete={onComplete} />);
    expect(screen.getByText('VALOR:')).toBeInTheDocument();
    expect(screen.getByText('0V (BAJO)')).toBeInTheDocument();

    const toggleBtn = screen.getByRole('button', { name: /Tocar Interruptor/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText('5V (ALTO)')).toBeInTheDocument();
  });

  it('HU-07 & HU-08: measures qubit collapse and unlocks continuation on quiz B', () => {
    render(<Mission1Superposition onComplete={onComplete} />);

    // Step 4: Measurement
    const step4Btn = screen.getByTitle('Ir al paso 4');
    fireEvent.click(step4Btn);

    const measureBtn = screen.getByRole('button', { name: /Disparar Detector Láser/i });
    fireEvent.click(measureBtn);

    expect(screen.getByText(/¡Colapso Observado/i)).toBeInTheDocument();

    // Step 5: Quiz
    const step5Btn = screen.getByTitle('Ir al paso 5');
    fireEvent.click(step5Btn);

    const optionB = screen.getByRole('button', { name: /Colapsa forzosamente/i });
    fireEvent.click(optionB);

    expect(screen.getByText(/¡Correcto! La medición destruye/i)).toBeInTheDocument();

    const nextMissionBtn = screen.getByRole('button', { name: /Pasar a Tarea 2/i });
    fireEvent.click(nextMissionBtn);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
