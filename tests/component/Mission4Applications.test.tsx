import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission4Applications from '@/features/missions/components/Mission4Applications';

describe('Mission 4 Applications Component', () => {
  const onFinishAll = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes Shor demonstration for base selection and completes quiz', () => {
    render(<Mission4Applications onFinishAll={onFinishAll} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));
    expect(screen.getByText('2. Demostración Didáctica de Factorización (N = 15)')).toBeInTheDocument();

    const select = screen.getByLabelText(/Seleccionar base coprima con 15/i);
    fireEvent.change(select, { target: { value: '2' } });

    expect(screen.getByTestId('shor-summary')).toHaveTextContent('N = 15 | Base a = 2');

    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));
    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));

    const radioOption = screen.getByRole('radio', { name: /Reduce la complejidad de factorización/i });
    fireEvent.click(radioOption);

    fireEvent.click(screen.getByRole('button', { name: /Validar Respuesta/i }));
    expect(screen.getByText(/✅ ¡Correcto!/i)).toBeInTheDocument();
    expect(onFinishAll).toHaveBeenCalledTimes(1);
  });
});
