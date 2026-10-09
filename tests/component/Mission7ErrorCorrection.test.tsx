import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission7ErrorCorrection from '@/features/missions/components/Mission7ErrorCorrection';
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

describe('HU-32..HU-36 - Mission 7 Error Correction Component', () => {
  const onComplete = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts at intro', () => {
    render(<Mission7ErrorCorrection onComplete={onComplete} onBack={onBack} />);
    expect(screen.getByTestId('mission7-intro')).toBeInTheDocument();
  });

  it('flips qubit 0 and updates the pattern', () => {
    render(<Mission7ErrorCorrection onComplete={onComplete} onBack={onBack} />);
    fireEvent.click(goToStep(2));
    const pattern = screen.getByTestId('bit-pattern');
    expect(pattern).toHaveTextContent('[0, 0, 0]');
    fireEvent.click(screen.getByTestId('flip-qubit-0'));
    expect(pattern).toHaveTextContent('[1, 0, 0]');
  });

  it('decodes a single bit-flip and shows syndrome 1', () => {
    render(<Mission7ErrorCorrection onComplete={onComplete} onBack={onBack} />);
    fireEvent.click(goToStep(2));
    fireEvent.click(screen.getByTestId('flip-qubit-0'));
    fireEvent.click(screen.getByRole('button', { name: /Decodificar sindrome/i }));
    const display = screen.getByTestId('syndrome-display');
    expect(display).toHaveTextContent('Sindrome: 1');
  });

  it('phase-flip demo records selected qubit', () => {
    render(<Mission7ErrorCorrection onComplete={onComplete} onBack={onBack} />);
    fireEvent.click(goToStep(3));
    fireEvent.click(screen.getByTestId('phase-qubit-1'));
    expect(screen.getByTestId('phase-display')).toHaveTextContent(/qubit 2/i);
  });

  it('correct quiz answer triggers onComplete', () => {
    render(<Mission7ErrorCorrection onComplete={onComplete} onBack={onBack} />);
    fireEvent.click(goToStep(5));
    fireEvent.click(screen.getByRole('button', { name: /votacion mayoritaria/i }));
    expect(screen.getByText(/Correcto\. Tres copias/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Finalizar Entrenamiento/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
