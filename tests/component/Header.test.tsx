import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Header from '@/shared/layout/Header';

vi.mock('@/shared/lib/sound', () => ({
  playButtonClick: vi.fn(),
}));

vi.mock('@/features/session/lib/cookies', () => ({
  getOrCreateUserId: vi.fn(() => 'QL-TEST'),
}));

import { getOrCreateUserId } from '@/features/session/lib/cookies';

describe('Phase 4 - Header (memoization + a11y)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrCreateUserId).mockReturnValue('QL-TEST');
  });

  it('renders formatted timer and user id', () => {
    render(<Header timeLeft={600} isRunning={false} onToggleTimer={vi.fn()} />);
    expect(screen.getByTestId('timer-display')).toHaveTextContent('10:00');
    expect(screen.getByTestId('user-id-value')).toHaveTextContent('QL-TEST');
  });

  it('formats sub-minute time correctly', () => {
    render(<Header timeLeft={45} isRunning={true} onToggleTimer={vi.fn()} />);
    expect(screen.getByTestId('timer-display')).toHaveTextContent('00:45');
  });

  it('renders skeleton with aria-busy while user id is loading', () => {
    vi.mocked(getOrCreateUserId).mockReturnValueOnce('');
    render(<Header timeLeft={600} isRunning={false} onToggleTimer={vi.fn()} />);
    expect(screen.getByTestId('user-id-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('user-id-skeleton').closest('[aria-busy]')).toHaveAttribute(
      'aria-busy',
      'true'
    );
  });

  it('invokes onToggleTimer when pause/play is clicked', () => {
    const onToggle = vi.fn();
    render(<Header timeLeft={600} isRunning={false} onToggleTimer={onToggle} />);
    const btn = screen.getByRole('button', { name: /Reanudar|Pausar/ });
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
