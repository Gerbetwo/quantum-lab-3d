import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission3Decoherence from '@/features/missions/components/Mission3Decoherence';

describe('Mission 3 Decoherence Component', () => {
  const onComplete = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates through temperature control and completes quiz', () => {
    render(<Mission3Decoherence onComplete={onComplete} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));
    expect(screen.getByText('2. Control del Criostato de Dilución')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));
    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));

    const radioOption = screen.getByRole('radio', { name: /Para minimizar las excitaciones térmicas/i });
    fireEvent.click(radioOption);

    fireEvent.click(screen.getByRole('button', { name: /Validar Respuesta/i }));
    expect(screen.getByText(/✅ ¡Correcto!/i)).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
