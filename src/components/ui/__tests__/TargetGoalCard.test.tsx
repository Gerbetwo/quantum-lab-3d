import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TargetGoalCard } from '../TargetGoalCard';
import { getObjectiveById } from '@/lib/quantum/objectivesConfig';
import * as soundEngineModule from '@/lib/audio/soundEngine';

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
  });
});
