'use client';

import { useEffect, useRef } from 'react';
import type { QubitState } from '@/core/qubitMath';

export interface UseBlochKeyboardOptions {
  enabled?: boolean;
  step?: number;
  onStateChange?: (state: QubitState) => void;
}

export function useBlochKeyboard(
  stateRef: React.RefObject<QubitState | null>,
  options: UseBlochKeyboardOptions = {}
) {
  const { enabled = true, step = 0.08, onStateChange } = options;
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when focusing input elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ignore if browser modifier keys are active (prevent breaking Ctrl+S, Cmd+W, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const current = stateRef.current ?? { theta: 0, phi: 0 };
      let { theta, phi } = current;
      let updated = false;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        theta = Math.max(0, theta - step);
        updated = true;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        theta = Math.min(Math.PI, theta + step);
        updated = true;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        phi = (phi - step + 2 * Math.PI) % (2 * Math.PI);
        updated = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        phi = (phi + step) % (2 * Math.PI);
        updated = true;
      }

      if (updated) {
        e.preventDefault();
        const newState = { theta, phi };
        onStateChangeRef.current?.(newState);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, step, stateRef]);
}

export default useBlochKeyboard;
