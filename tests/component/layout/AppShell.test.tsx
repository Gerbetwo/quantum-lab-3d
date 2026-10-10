import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { AppShell } from '@/shared/layout/AppShell';

vi.mock('@/features/session/components/SessionProvider', () => ({
  useSession: () => ({
    session: { userId: 'QL-ABCD', completed: [], missionState: {}, timerSeconds: 600, timerRunning: false },
    updateMissionState: vi.fn(),
    completeMission: vi.fn(),
    updateTimer: vi.fn(),
    toggleTimer: vi.fn(),
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AppShell Component', () => {
  test('renderiza el título y los hijos correctamente', () => {
    render(
      <AppShell title="QuantumLab Test" subtitle="Subtítulo de prueba">
        <div>Contenido Principal</div>
      </AppShell>
    );

    const mainEl = screen.getByRole('main');
    expect(mainEl).toHaveAttribute('title', 'QuantumLab Test');
    expect(mainEl).toHaveAttribute('subtitle', 'Subtítulo de prueba');
    expect(screen.getByText('Contenido Principal')).toBeInTheDocument();
  });
});
