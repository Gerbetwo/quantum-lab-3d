import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission3Decoherence from '@/components/missions/Mission3Decoherence';
import { goToStep } from '../helpers/queries';

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

describe('HU-14..HU-17 - Mission 3 Decoherence Component', () => {
  const onComplete = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('HU-14: thermal photon hit increments perturbation counter', () => {
    render(<Mission3Decoherence onComplete={onComplete} onBack={onBack} />);
    expect(screen.getByText('La Fragilidad Cuántica')).toBeInTheDocument();

    const counter = screen.getByTestId('photon-counter');
    expect(counter).toHaveTextContent('0');

    fireEvent.click(screen.getByRole('button', { name: /Disparar Fotón Térmico Parásito/i }));
    expect(counter).toHaveTextContent('1');
  });

  it('HU-15 & HU-16: temperature slider and cryo shield activation', () => {
    render(<Mission3Decoherence onComplete={onComplete} onBack={onBack} />);

    fireEvent.click(goToStep(2));
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '2000' } });
    expect(screen.getByText('Decoherencia Crítica')).toBeInTheDocument();

    fireEvent.click(goToStep(3));
    fireEvent.click(screen.getByRole('button', { name: /Activar Bombas Criogénicas/i }));
    expect(screen.getByText(/Temperatura: 15 mK/i)).toBeInTheDocument();
  });

  it('HU-17: quiz choice B completes stage', () => {
    render(<Mission3Decoherence onComplete={onComplete} onBack={onBack} />);

    fireEvent.click(goToStep(4));
    fireEvent.click(screen.getByRole('button', { name: /Para eliminar el calor y las vibraciones/i }));
    expect(screen.getByText(/Exacto! El calor ambiente introduce/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Pasar a Tarea 4/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
