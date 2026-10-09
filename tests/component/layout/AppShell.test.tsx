import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { AppShell } from '@/shared/layout/AppShell';

describe('AppShell Component', () => {
  test('renderiza el título y los hijos correctamente', () => {
    render(
      <AppShell title="QuantumLab Test" subtitle="Subtítulo de prueba">
        <div>Contenido Principal</div>
      </AppShell>
    );

    const headerEl = screen.getByTestId('app-shell-header');
    expect(headerEl).toHaveTextContent('QuantumLab Test');
    expect(headerEl).toHaveTextContent('Subtítulo de prueba');
    expect(screen.getByText('Contenido Principal')).toBeInTheDocument();
  });
});