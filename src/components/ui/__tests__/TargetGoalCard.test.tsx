import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TargetGoalCard } from '../TargetGoalCard';
import { getObjectiveById } from '@/lib/quantum/objectivesConfig';
import * as soundEngineModule from '@/lib/audio/soundEngine';
import confetti from 'canvas-confetti';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('@/lib/audio/soundEngine', () => ({
  playCompletionTriad: vi.fn(),
}));

describe('TargetGoalCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when objective is not provided', () => {
    const { container } = render(<TargetGoalCard />);
    expect(container.firstChild).toBeNull();
  });

  it('renders objective details in IN PROGRESS state', () => {
    const objective = getObjectiveById('superposition');
    render(
      <TargetGoalCard
        objective={objective}
        isCompleted={false}
        progressText="0/1 gates"
      />
    );

    expect(screen.getByTestId('target-goal-card')).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('0/1 gates')).toBeInTheDocument();
    expect(soundEngineModule.playCompletionTriad).not.toHaveBeenCalled();
  });

  it('renders COMPLETED badge and triggers playCompletionTriad on transition', () => {
    const objective = getObjectiveById('superposition');
    const { rerender } = render(
      <TargetGoalCard objective={objective} isCompleted={false} />
    );

    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(soundEngineModule.playCompletionTriad).not.toHaveBeenCalled();

    // Transition to completed
    rerender(<TargetGoalCard objective={objective} isCompleted={true} />);

    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(soundEngineModule.playCompletionTriad).toHaveBeenCalledTimes(1);
    expect(confetti).toHaveBeenCalledTimes(1);
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 50,
        spread: 60,
      })
    );
  });

  it('renders localized criteria and status tags in Spanish', () => {
    localStorage.setItem('ql-lang', 'es');
    const objective = getObjectiveById('superposition');

    const { rerender } = render(
      <TargetGoalCard objective={objective} isCompleted={false} />
    );

    expect(screen.getByText('EN PROGRESO')).toBeInTheDocument();
    expect(
      screen.getByText('Prepara el estado |+⟩ en ≤ 2 compuertas (θ = π/2, φ = 0)')
    ).toBeInTheDocument();

    rerender(<TargetGoalCard objective={objective} isCompleted={true} />);
    expect(screen.getByText('COMPLETADO')).toBeInTheDocument();
  });
});
