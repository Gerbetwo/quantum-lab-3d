import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission4Applications from '@/components/missions/Mission4Applications';
import { goToStep } from '../helpers/queries';

vi.mock('@/lib/sound', () => ({
  playButtonClick: vi.fn(),
  playChimeSuccess: vi.fn(),
  playLaserScan: vi.fn(),
}));

vi.mock('@/lib/cookies', () => ({
  saveCompletedMission: vi.fn(),
  updateStoredMetrics: vi.fn(),
}));

describe('HU-18..HU-21 - Mission 4 Applications Component', () => {
  const onFinishAll = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('HU-18: myth cards inspection toggles state', () => {
    render(<Mission4Applications onFinishAll={onFinishAll} onBack={onBack} />);
    expect(screen.getByText(/Desmitificando la Tecnología/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Videojuegos, Navegar o YouTube'));
    expect(screen.getByText('Uso Inadecuado')).toBeInTheDocument();
  });

  it('HU-20: Shor algorithm simulation using fake timers', () => {
    render(<Mission4Applications onFinishAll={onFinishAll} onBack={onBack} />);

    fireEvent.click(goToStep(3));
    fireEvent.click(screen.getByRole('button', { name: /Probar Algoritmo de Shor Cuántico/i }));

    expect(screen.getByTestId('shor-status')).toHaveTextContent(/Procesando estados cuánticos/i);

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByTestId('shor-status')).toHaveTextContent(/Algoritmo de Shor completado en 0.42 segundos/i);
  });

  it('HU-21: quiz choice B triggers completion handler', () => {
    render(<Mission4Applications onFinishAll={onFinishAll} onBack={onBack} />);

    fireEvent.click(goToStep(4));
    fireEvent.click(screen.getByRole('button', { name: /Simular moléculas complejas/i }));
    expect(screen.getByText(/Excelente deducción/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Finalizar Laboratorio/i }));
    expect(onFinishAll).toHaveBeenCalledTimes(1);
  });
});
