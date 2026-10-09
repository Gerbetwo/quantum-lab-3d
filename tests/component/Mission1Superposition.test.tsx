import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission1Superposition from '@/features/missions/components/Mission1Superposition';

describe('Mission 1 Superposition Component', () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial step 0 correctly and navigates step by step', () => {
    render(<Mission1Superposition onComplete={onComplete} />);

    expect(screen.getByText('1. Qubit vs Bit Clásico')).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /Siguiente →/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText('2. Ángulo θ y Probabilidades')).toBeInTheDocument();

    const measureBtn = screen.getByRole('button', { name: /🎯 Disparar Medición/i });
    fireEvent.click(measureBtn);

    expect(screen.getByText(/Resultado del colapso:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));
    expect(screen.getByText('3. Análisis del Colapso')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));
    expect(screen.getByText('4. Evaluación de Superposición')).toBeInTheDocument();
  });

  it('completes the quiz and triggers onComplete', () => {
    render(<Mission1Superposition onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));
    fireEvent.click(screen.getByRole('button', { name: /🎯 Disparar Medición/i }));
    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));
    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));

    const radioOption = screen.getByRole('radio', { name: /Colapsa determinísticamente/i });
    fireEvent.click(radioOption);

    const validateBtn = screen.getByRole('button', { name: /Validar Respuesta/i });
    fireEvent.click(validateBtn);

    expect(screen.getByText(/✅ ¡Correcto!/i)).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
