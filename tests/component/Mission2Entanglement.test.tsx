import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Mission2Entanglement from '@/components/missions/Mission2Entanglement';

describe('Mission 2 Entanglement Component', () => {
  const onComplete = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers onBack when clicking Previous on step 0', () => {
    render(<Mission2Entanglement onComplete={onComplete} onBack={onBack} />);
    const prevBtn = screen.getByRole('button', { name: /← Anterior/i });
    fireEvent.click(prevBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('simulates Alice measurement and Bob correlation, then passes quiz', () => {
    render(
      <Mission2Entanglement
        onComplete={onComplete}
        onBack={onBack}
        __testRandom={() => 0.2}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));
    expect(screen.getByText('2. Estación Alice (Tierra)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /📡 Medir Qubit de Alice/i }));
    expect(screen.getByText(/Alice midió:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));
    expect(screen.getByText('3. Estación Bob (Andrómeda)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Siguiente →/i }));

    const radioOption = screen.getByRole('radio', { name: /100% de correlación instantánea/i });
    fireEvent.click(radioOption);

    fireEvent.click(screen.getByRole('button', { name: /Validar Respuesta/i }));
    expect(screen.getByText(/✅ ¡Correcto!/i)).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
