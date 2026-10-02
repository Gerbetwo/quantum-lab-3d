import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission3Decoherence from '@/components/missions/Mission3Decoherence';

vi.mock('@/lib/sound', () => ({
  playButtonClick: vi.fn(),
  playChimeSuccess: vi.fn(),
  playLaserScan: vi.fn(),
  playDecoherenceAlert: vi.fn(),
}));

vi.mock('@/lib/cookies', () => ({
  saveCompletedMission: vi.fn(),
  updateStoredMetrics: vi.fn(),
}));

describe('HU-14..HU-17 — Mission 3 Decoherence Component', () => {
  const onComplete = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('HU-14: thermal photon hit increments perturbation counter', () => {
    render(<Mission3Decoherence onComplete={onComplete} onBack={onBack} />);
    expect(screen.getByText('La Fragilidad Cuántica')).toBeInTheDocument();

    const photonBtn = screen.getByRole('button', { name: /Disparar Fotón Térmico Parásito/i });
    fireEvent.click(photonBtn);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('HU-15 & HU-16: temperature slider and cryo shield activation', () => {
    render(<Mission3Decoherence onComplete={onComplete} onBack={onBack} />);

    // Step 2: Temperature Slider
    const step2Btn = screen.getByTitle('Ir al paso 2');
    fireEvent.click(step2Btn);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '2000' } });
    expect(screen.getByText('Decoherencia Crítica')).toBeInTheDocument();

    // Step 3: Cryo Shield
    const step3Btn = screen.getByTitle('Ir al paso 3');
    fireEvent.click(step3Btn);

    const shieldBtn = screen.getByRole('button', { name: /Activar Bombas Criogénicas/i });
    fireEvent.click(shieldBtn);
    expect(screen.getByText(/Temperatura: 15 mK/i)).toBeInTheDocument();
  });

  it('HU-17: quiz choice B completes stage', () => {
    render(<Mission3Decoherence onComplete={onComplete} onBack={onBack} />);

    // Step 4: Quiz
    const step4Btn = screen.getByTitle('Ir al paso 4');
    fireEvent.click(step4Btn);

    const optionB = screen.getByRole('button', { name: /Para eliminar el calor y las vibraciones/i });
    fireEvent.click(optionB);

    expect(screen.getByText(/¡Exacto! El calor ambiente introduce/i)).toBeInTheDocument();

    const nextTaskBtn = screen.getByRole('button', { name: /Pasar a Tarea 4/i });
    fireEvent.click(nextTaskBtn);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
