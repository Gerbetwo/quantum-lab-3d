import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVectorKeyboardControl } from '../useVectorKeyboardControl';
import type { QubitState } from '@/core/qubitMath';

describe('useVectorKeyboardControl Hook', () => {
  let state: QubitState;
  let stateRef: { current: QubitState };

  beforeEach(() => {
    state = { theta: Math.PI / 2, phi: Math.PI };
    stateRef = { current: state };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('decreases theta on ArrowUp and KeyW/w', () => {
    const onStateChange = vi.fn();
    renderHook(() => useVectorKeyboardControl(stateRef, { step: 0.1, onStateChange }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    expect(onStateChange).toHaveBeenCalledWith({
      theta: Math.PI / 2 - 0.1,
      phi: Math.PI,
    });

    onStateChange.mockClear();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w', cancelable: true }));
    expect(onStateChange).toHaveBeenCalledWith({
      theta: Math.PI / 2 - 0.1,
      phi: Math.PI,
    });
  });

  it('increases theta on ArrowDown and KeyS/s clamped to π', () => {
    stateRef.current = { theta: Math.PI - 0.05, phi: 0 };
    const onStateChange = vi.fn();
    renderHook(() => useVectorKeyboardControl(stateRef, { step: 0.1, onStateChange }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    expect(onStateChange).toHaveBeenCalledWith({
      theta: Math.PI,
      phi: 0,
    });

    onStateChange.mockClear();
    stateRef.current = { theta: Math.PI - 0.05, phi: 0 };
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS', key: 's', cancelable: true }));
    expect(onStateChange).toHaveBeenCalledWith({
      theta: Math.PI,
      phi: 0,
    });
  });

  it('adjusts phi on ArrowLeft/KeyA and ArrowRight/KeyD with 2π wrap', () => {
    stateRef.current = { theta: Math.PI / 2, phi: 0.05 };
    const onStateChange = vi.fn();
    renderHook(() => useVectorKeyboardControl(stateRef, { step: 0.1, onStateChange }));

    // ArrowLeft wraps around 2π
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', key: 'a', cancelable: true }));
    expect(onStateChange).toHaveBeenCalledWith({
      theta: Math.PI / 2,
      phi: expect.closeTo(2 * Math.PI - 0.05, 5),
    });

    onStateChange.mockClear();
    // ArrowRight increments
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD', key: 'd', cancelable: true }));
    expect(onStateChange).toHaveBeenCalledWith({
      theta: Math.PI / 2,
      phi: expect.closeTo(0.15, 5),
    });
  });

  it('does NOT intercept keyboard when typing in input or with modifiers', () => {
    const onStateChange = vi.fn();
    renderHook(() => useVectorKeyboardControl(stateRef, { onStateChange }));

    // Modifier key: Ctrl+W or Alt+S
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyW', key: 'w', ctrlKey: true, cancelable: true })
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
