import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission6Grover from '@/features/missions/components/Mission6Grover';
import { goToStep } from '../helpers/queries';

vi.mock('@/shared/lib/sound', () => ({
  playButtonClick: vi.fn(),
  playChimeSuccess: vi.fn(),
  playLaserScan: vi.fn(),
}));

vi.mock('@/features/session/lib/cookies', () => ({
  saveCompletedMission: vi.fn(),
  updateStoredMetrics: vi.fn(),
}));

describe('HU-27..HU-31 - Mission 6 Grover Component', () => {
  const onComplete = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts at intro', () => {
    render(<Mission6Grover onComplete={onComplete} onBack={onBack} />);
    expect(screen.getByTestId('mission6-intro')).toBeInTheDocument();
  });

  it('shows classical N/2 comparison for N=4', () => {
    render(<Mission6Grover onComplete={onComplete} onBack={onBack} />);
    fireEvent.click(goToStep(2));
    expect(screen.getByTestId('grover-classical-cost')).toHaveTextContent('2');
  });

  it('runs one Grover iteration and updates the counter', () => {
    render(<Mission6Grover onComplete={onComplete} onBack={onBack} />);
    fireEvent.click(goToStep(3));
    fireEvent.click(screen.getByRole('button', { name: /Ejecutar una iteracion/i }));
    expect(screen.getByTestId('grover-iterations')).toHaveTextContent('1');
  });

  it('runs full algorithm and produces a measurement', () => {
    render(<Mission6Grover onComplete={onComplete} onBack={onBack} />);
    fireEvent.click(goToStep(4));
    fireEvent.click(screen.getByRole('button', { name: /Ejecutar algoritmo completo/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Medir$/i }));
    expect(screen.getByTestId('grover-measurement')).toBeInTheDocument();
  });

  it('correct quiz answer triggers onComplete', () => {
    render(<Mission6Grover onComplete={onComplete} onBack={onBack} />);
    fireEvent.click(goToStep(5));
    fireEvent.click(screen.getByRole('button', { name: /amplifican la amplitud del elemento marcado/i }));
    expect(screen.getByText(/Correcto\. Cada iteracion amplifica/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Finalizar Entrenamiento/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
