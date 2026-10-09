import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission5Gates from '@/features/missions/components/Mission5Gates';
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

describe('HU-22..HU-26 - Mission 5 Gates Component', () => {
  const onComplete = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts at intro and can navigate to the playground', () => {
    render(<Mission5Gates onComplete={onComplete} onBack={onBack} />);
    expect(screen.getByTestId('mission5-intro')).toBeInTheDocument();

    fireEvent.click(goToStep(2));
    expect(screen.getByText(/Playground de Compuertas/i)).toBeInTheDocument();
  });

  it('applies X gate and updates the state display', () => {
    render(<Mission5Gates onComplete={onComplete} onBack={onBack} />);
    fireEvent.click(goToStep(2));

    const display = screen.getByTestId('gate-state-display');
    expect(display).toHaveTextContent('|0>');

    fireEvent.click(screen.getByRole('button', { name: /X \(bit-flip\)/i }));
    expect(display).toHaveTextContent('|1>');
  });

  it('cycleSlot rotates through I -> X -> Z -> H', () => {
    render(<Mission5Gates onComplete={onComplete} onBack={onBack} />);
    fireEvent.click(goToStep(3));

    const slot0 = screen.getByTestId('circuit-slot-0');
    expect(slot0).toHaveTextContent('—');
    fireEvent.click(slot0);
    expect(slot0).toHaveTextContent('X');
    fireEvent.click(slot0);
    expect(slot0).toHaveTextContent('Z');
    fireEvent.click(slot0);
    expect(slot0).toHaveTextContent('H');
  });

  it('runCircuit produces a result', () => {
    render(<Mission5Gates onComplete={onComplete} onBack={onBack} />);
    fireEvent.click(goToStep(3));

    fireEvent.click(screen.getByTestId('circuit-slot-0'));
    fireEvent.click(screen.getByRole('button', { name: /Ejecutar circuito/i }));
    expect(screen.getByTestId('circuit-result')).toBeInTheDocument();
  });

  it('prepareBell shows the Bell state banner', () => {
    render(<Mission5Gates onComplete={onComplete} onBack={onBack} />);
    fireEvent.click(goToStep(4));

    fireEvent.click(screen.getByRole('button', { name: /Preparar Bell/i }));
    expect(screen.getByTestId('bell-state')).toBeInTheDocument();
  });

  it('correct quiz answer calls onComplete', () => {
    render(<Mission5Gates onComplete={onComplete} onBack={onBack} />);
    fireEvent.click(goToStep(5));

    fireEvent.click(screen.getByRole('button', { name: /superposicion perfecta/i }));
    expect(screen.getByText(/Correcto! H sobre/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Finalizar Entrenamiento/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
