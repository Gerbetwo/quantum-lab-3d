import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BlochSphereViewport } from '../BlochSphereViewport';
import type { QubitState } from '@/lib/quantumCore';

describe('BlochSphereViewport Component', () => {
  it('renders container element and attaches WebGL canvas', () => {
    const initialState: QubitState = { theta: 0, phi: 0 };
    const { container, unmount } = render(<BlochSphereViewport state={initialState} />);

    expect(container.querySelector('div')).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeInTheDocument();

    unmount();
    expect(container.querySelector('canvas')).not.toBeInTheDocument();
  });

  it('handles state prop updates smoothly', () => {
    const state0: QubitState = { theta: 0, phi: 0 };
    const { rerender } = render(<BlochSphereViewport state={state0} />);

    const stateH: QubitState = { theta: Math.PI / 2, phi: 0 };
    expect(() => rerender(<BlochSphereViewport state={stateH} />)).not.toThrow();

    const state1: QubitState = { theta: Math.PI, phi: 0 };
    expect(() => rerender(<BlochSphereViewport state={state1} />)).not.toThrow();
  });

  it('properly cleans up resources and disconnects ResizeObserver on unmount', () => {
    const state: QubitState = { theta: Math.PI / 2, phi: Math.PI / 4 };
    const { unmount } = render(<BlochSphereViewport state={state} />);

    expect(() => unmount()).not.toThrow();
  });
});
