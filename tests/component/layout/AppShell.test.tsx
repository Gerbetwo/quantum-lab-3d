import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { AppShell } from '@/components/layout/AppShell';

describe('AppShell Component', () => {
  test('renderiza el título y los hijos correctamente', () => {
    render(
      <AppShell title="QuantumLab Test" subtitle="Subtítulo de prueba">
        <div>Contenido Principal</div>
      </AppShell>
    );

    expect(screen.getByRole('banner')).toHaveTextContent('QuantumLab Test');
    expect(screen.getByRole('banner')).toHaveTextContent('Subtítulo de prueba');
    expect(screen.getByText('Contenido Principal')).toBeInTheDocument();
  });
});
