import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/shared/layout/Header';
import { vi, describe, it, expect } from 'vitest';

describe('Phase 4 - Header (memoization + a11y)', () => {
  it('renders formatted timer and user id', () => {
    render(<Header timeLeft={600} isRunning={false} onToggleTimer={vi.fn()} />);
    expect(screen.getByTestId('timer-display')).toHaveTextContent('10:00');
    expect(screen.getByTestId('user-id-value')).toBeInTheDocument();
  });

  it('formats sub-minute time correctly', () => {
    render(<Header timeLeft={45} isRunning={true} onToggleTimer={vi.fn()} />);
    expect(screen.getByTestId('timer-display')).toHaveTextContent('00:45');
  });

  it('invokes onToggleTimer when pause/play is clicked', () => {
    const onToggle = vi.fn();
    render(<Header timeLeft={600} isRunning={false} onToggleTimer={onToggle} />);
    const btn = screen.getByRole('button', { name: /Reanudar|Pausar/i });
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
