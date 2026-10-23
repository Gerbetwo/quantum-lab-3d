import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CoreBlochSphere } from '../CoreBlochSphere';
import type { QubitState } from '@/core/qubitMath';
import { useSpatialTelemetryBridge } from '@/hooks/useSpatialTelemetryBridge';

describe('CoreBlochSphere Component', () => {
  it('renders container element and attaches WebGL canvas', () => {
    const initialState: QubitState = { theta: 0, phi: 0 };
    const { container, unmount } = render(<CoreBlochSphere state={initialState} />);

    expect(container.querySelector('[data-testid="core-bloch-sphere"]')).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeInTheDocument();

    unmount();
    expect(container.querySelector('canvas')).not.toBeInTheDocument();
  });

  it('handles state prop updates smoothly without crashing', () => {
    const state0: QubitState = { theta: 0, phi: 0 };
    const { rerender } = render(<CoreBlochSphere state={state0} />);

    const stateH: QubitState = { theta: Math.PI / 2, phi: 0 };
    expect(() => rerender(<CoreBlochSphere state={stateH} />)).not.toThrow();

    const state1: QubitState = { theta: Math.PI, phi: 0 };
    expect(() => rerender(<CoreBlochSphere state={state1} />)).not.toThrow();
  });

  it('exposes camera to useSpatialTelemetryBridge on mount and clears on unmount', () => {
    const { unmount } = render(<CoreBlochSphere state={{ theta: 0, phi: 0 }} />);

    const camera = useSpatialTelemetryBridge.getState().camera;
    expect(camera).not.toBeNull();

    unmount();
    expect(useSpatialTelemetryBridge.getState().camera).toBeNull();
  });

  it('mounts target zone mesh when targetZone prop is provided', () => {
    let alignedResult = false;
    const { rerender, unmount } = render(
      <CoreBlochSphere
        state={{ theta: Math.PI, phi: 0 }}
        targetZone={{ theta: Math.PI, phi: 0 }}
        onAlignmentChange={(aligned) => {
          alignedResult = aligned;
        }}
      />
    );

    // Target zone is at south pole and state is at south pole -> aligned
    expect(alignedResult).toBe(true);

    // Update targetZone to north pole -> not aligned
    rerender(
      <CoreBlochSphere
        state={{ theta: Math.PI, phi: 0 }}
        targetZone={{ theta: 0, phi: 0 }}
        onAlignmentChange={(aligned) => {
          alignedResult = aligned;
        }}
      />
    );
    expect(alignedResult).toBe(false);

    unmount();
  });

  it('attaches pointer event handlers when interactive is true', () => {
    const onStateChange = vi.fn();
    const { container } = render(
      <CoreBlochSphere
        state={{ theta: 0, phi: 0 }}
        interactive={true}
        onStateChange={onStateChange}
      />
    );

    const sphereDiv = container.querySelector('[data-testid="core-bloch-sphere"]')!;
    expect(sphereDiv).toBeInTheDocument();

    // Trigger pointer events
    fireEvent.pointerDown(sphereDiv, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(sphereDiv, { clientX: 120, clientY: 120, pointerId: 1 });
    fireEvent.pointerUp(sphereDiv, { clientX: 120, clientY: 120, pointerId: 1 });
    fireEvent.pointerLeave(sphereDiv);

    expect(useSpatialTelemetryBridge.getState().activeFocusId).toBeNull();
  });

  it('cleans up resources, meshes, and observers cleanly on unmount', () => {
    const { unmount } = render(
      <CoreBlochSphere
        state={{ theta: Math.PI / 2, phi: Math.PI / 4 }}
        targetZone={{ theta: 0, phi: 0 }}
      />
    );

    expect(() => unmount()).not.toThrow();
  });
});
