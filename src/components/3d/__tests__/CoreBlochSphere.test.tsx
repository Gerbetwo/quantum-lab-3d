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

  it('responds to keyboard arrow and WASD navigation via onStateChange', () => {
    const onStateChange = vi.fn();
    render(
      <CoreBlochSphere
        state={{ theta: Math.PI / 2, phi: 0 }}
        interactive={true}
        onStateChange={onStateChange}
      />
    );

    // ArrowUp decreases theta toward |0⟩
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        theta: expect.closeTo(Math.PI / 2 - 0.08, 4),
      })
    );

    onStateChange.mockClear();
    // 'd' key increases phi
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', cancelable: true }));
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        phi: expect.closeTo(0.08, 4),
      })
    );
  });

  it('supports showGateRings, showMeasurementPlane, and thermalCollapse without recreating context', () => {
    const { container, rerender, unmount } = render(
      <CoreBlochSphere
        state={{ theta: Math.PI / 2, phi: 0 }}
        showGateRings={false}
        showMeasurementPlane={false}
        thermalCollapse={1.0}
      />
    );

    const initialCanvas = container.querySelector('canvas');
    expect(initialCanvas).toBeInTheDocument();

    // Toggle mission visual flags
    rerender(
      <CoreBlochSphere
        state={{ theta: Math.PI / 2, phi: 0 }}
        showGateRings={true}
        showMeasurementPlane={true}
        thermalCollapse={0.0}
        activeGate="H"
        lastOutcome={0}
      />
    );

    // Single WebGL context safety: canvas must be the exact same instance!
    const canvasAfterRerender = container.querySelector('canvas');
    expect(canvasAfterRerender).toBe(initialCanvas);

    unmount();
  });

  it('handles dynamic decoherence thermal parameters (temperature, purity, noiseIntensity) and resets gracefully', () => {
    const { container, rerender, unmount } = render(
      <CoreBlochSphere
        state={{ theta: Math.PI / 2, phi: 0 }}
        temperature={15}
        purity={1.0}
        thermalCollapse={1.0}
        noiseIntensity={1.0}
      />
    );

    const initialCanvas = container.querySelector('canvas');
    expect(initialCanvas).toBeInTheDocument();

    // Trigger high decoherence
    rerender(
      <CoreBlochSphere
        state={{ theta: Math.PI / 2, phi: 0 }}
        temperature={300}
        purity={0.4}
        thermalCollapse={0.1}
        noiseIntensity={2.0}
      />
    );

    // Canvas must remain singleton instance
    expect(container.querySelector('canvas')).toBe(initialCanvas);

    // Reset to cryo nominal
    rerender(
      <CoreBlochSphere
        state={{ theta: Math.PI / 2, phi: 0 }}
        temperature={15}
        purity={1.0}
        thermalCollapse={1.0}
        noiseIntensity={1.0}
      />
    );
    expect(container.querySelector('canvas')).toBe(initialCanvas);

    unmount();
  });
});
