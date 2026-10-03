import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import Tooltip from '@/components/ui/Tooltip';

describe('Phase 3 - Tooltip', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('does not render tooltip before delay elapses', () => {
    render(
      <Tooltip content="hello" delayDuration={200}>
        <button>trigger</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: /trigger/i }));
    act(() => { vi.advanceTimersByTime(199); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders tooltip after delay elapses', () => {
    render(
      <Tooltip content="hello" delayDuration={200}>
        <button>trigger</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: /trigger/i }));
    act(() => { vi.advanceTimersByTime(201); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('hello');
  });

  it('renders immediately when delayDuration=0', () => {
    render(
      <Tooltip content="instant" delayDuration={0}>
        <button>trigger</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: /trigger/i }));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('closes on mouse leave', () => {
    render(
      <Tooltip content="x" delayDuration={0}>
        <button>t</button>
      </Tooltip>
    );
    const btn = screen.getByRole('button', { name: /t/i });
    fireEvent.mouseEnter(btn);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.mouseLeave(btn);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(
      <Tooltip content="x" delayDuration={0}>
        <button>t</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: /t/i }));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('sets aria-describedby on the trigger when open', () => {
    render(
      <Tooltip content="desc" delayDuration={0}>
        <button>t</button>
      </Tooltip>
    );
    const btn = screen.getByRole('button', { name: /t/i });
    expect(btn.getAttribute('aria-describedby')).toBeNull();
    fireEvent.mouseEnter(btn);
    expect(btn.getAttribute('aria-describedby')).toBeTruthy();
  });
});
