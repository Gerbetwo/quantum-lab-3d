import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBlochKeyboard } from '../useBlochKeyboard';
import type { QubitState } from '@/core/qubitMath';

describe('useBlochKeyboard Hook', () => {
  let state: QubitState;
  let stateRef: { current: QubitState };

  beforeEach(() => {
    state = { theta: Math.PI / 2, phi: Math.PI };
    stateRef = { current: state };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('decreases theta on ArrowUp and W', () => {
    const onStateChange = vi.fn();
    renderHook(() => useBlochKeyboard(stateRef, { step: 0.1, onStateChange }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    expect(onStateChange).toHaveBeenCalledWith({
      theta: Math.PI / 2 - 0.1,
      phi: Math.PI,
    });

    onStateChange.mockClear();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', cancelable: true }));
    expect(onStateChange).toHaveBeenCalledWith({
      theta: Math.PI / 2 - 0.1,
      phi: Math.PI,
    });
  });

  it('increases theta on ArrowDown and S clamped to π', () => {
    stateRef.current = { theta: Math.PI - 0.05, phi: 0 };
    const onStateChange = vi.fn();
    renderHook(() => useBlochKeyboard(stateRef, { step: 0.1, onStateChange }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    expect(onStateChange).toHaveBeenCalledWith({
      theta: Math.PI,
      phi: 0,
    });
  });

  it('adjusts phi on ArrowLeft/A and ArrowRight/D with 2π wrap', () => {
    stateRef.current = { theta: Math.PI / 2, phi: 0.05 };
    const onStateChange = vi.fn();
    renderHook(() => useBlochKeyboard(stateRef, { step: 0.1, onStateChange }));

    // ArrowLeft wraps around 2π
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }));
    expect(onStateChange).toHaveBeenCalledWith({
      theta: Math.PI / 2,
      phi: expect.closeTo(2 * Math.PI - 0.05, 5),
    });

    onStateChange.mockClear();
    // ArrowRight increments
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', cancelable: true }));
    expect(onStateChange).toHaveBeenCalledWith({
      theta: Math.PI / 2,
      phi: expect.closeTo(0.15, 5),
    });
  });

  it('does NOT intercept keyboard when typing in input or with modifiers', () => {
    const onStateChange = vi.fn();
    renderHook(() => useBlochKeyboard(stateRef, { onStateChange }));

    // Modifier key: Ctrl+W or Alt+S
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'w', ctrlKey: true, cancelable: true })
    );
    expect(onStateChange).not.toHaveBeenCalled();

    // Input target
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
    );
    expect(onStateChange).not.toHaveBeenCalled();
  });
});
