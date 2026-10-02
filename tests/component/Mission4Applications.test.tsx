import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission4Applications from '@/components/missions/Mission4Applications';

vi.mock('@/lib/sound', () => ({
  playButtonClick: vi.fn(),
  playChimeSuccess: vi.fn(),
  playLaserScan: vi.fn(),
}));

vi.mock('@/lib/cookies', () => ({
  saveCompletedMission: vi.fn(),
  updateStoredMetrics: vi.fn(),
}));

describe('HU-18..HU-21 — Mission 4 Applications Component', () => {
  const onFinishAll = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('HU-18: myth cards inspection', () => {
    render(<Mission4Applications onFinishAll={onFinishAll} onBack={onBack} />);
    expect(screen.getByText('¿Para qué NO sirve un Computador Cuántico?')).toBeInTheDocument();

    const mythCard = screen.getByText('Videojuegos, Navegar o YouTube');
    fireEvent.click(mythCard);
    expect(screen.getByText('Uso Inadecuado')).toBeInTheDocument();
  });

  it('HU-20: Shor algorithm simulation using fake timers', async () => {
    render(<Mission4Applications onFinishAll={onFinishAll} onBack={onBack} />);

    // Step 3: Shor Cryptography
    const step3Btn = screen.getByTitle('Ir al paso 3');
    fireEvent.click(step3Btn);

    const shorBtn = screen.getByRole('button', { name: /Probar Algoritmo de Shor Cuántico/i });
    fireEvent.click(shorBtn);

    expect(screen.getByText(/Procesando estados cuánticos en superposición/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByText(/¡Clave RSA factorizada en 0.42 segundos!/i)).toBeInTheDocument();
  });

  it('HU-21: quiz choice B triggers completion modal handler', () => {
    render(<Mission4Applications onFinishAll={onFinishAll} onBack={onBack} />);

    // Step 4: Quiz
    const step4Btn = screen.getByTitle('Ir al paso 4');
    fireEvent.click(step4Btn);

    const optionB = screen.getByRole('button', { name: /Simular moléculas complejas/i });
    fireEvent.click(optionB);

    expect(screen.getByText(/¡Excelente deducción! La computación cuántica/i)).toBeInTheDocument();

    const finishBtn = screen.getByRole('button', { name: /Finalizar Laboratorio/i });
    fireEvent.click(finishBtn);
    expect(onFinishAll).toHaveBeenCalledTimes(1);
  });
});
