import { describe, it, expect, beforeEach } from 'vitest';
import { useSpatialTelemetryBridge, SPATIAL_TELEMETRY_MAP } from '../useSpatialTelemetryBridge';

describe('useSpatialTelemetryBridge', () => {
  beforeEach(() => {
    useSpatialTelemetryBridge.getState().clearFocus();
  });

  it('initializes with null focus and hoveredElement', () => {
    const state = useSpatialTelemetryBridge.getState();
    expect(state.activeFocusId).toBeNull();
    expect(state.hoveredElement).toBeNull();
  });

  it('updates hoveredElement when hovering a valid 3D spatial ID', () => {
    const bridge = useSpatialTelemetryBridge.getState();

    bridge.onPointerOver('state-vector');
    expect(useSpatialTelemetryBridge.getState().activeFocusId).toBe('state-vector');
    expect(useSpatialTelemetryBridge.getState().hoveredElement).toEqual(
      expect.objectContaining({
        id: 'state-vector',
        symbol: '|ψ⟩',
      })
    );

    bridge.onPointerOut('state-vector');
    expect(useSpatialTelemetryBridge.getState().activeFocusId).toBeNull();
    expect(useSpatialTelemetryBridge.getState().hoveredElement).toBeNull();
  });

  it('maps Hadamard gate axis to correct LaTeX formula', () => {
    const hMapping = SPATIAL_TELEMETRY_MAP['gate-axis-h'];
    expect(hMapping).toBeDefined();
    expect(hMapping.symbol).toBe('H');
    expect(hMapping.latex).toContain('\\frac{1}{\\sqrt{2}}');
  });

  it('maps Pauli-X gate axis to bit-flip description', () => {
    const xMapping = SPATIAL_TELEMETRY_MAP['gate-axis-x'];
    expect(xMapping).toBeDefined();
    expect(xMapping.symbol).toBe('X');
    expect(xMapping.description).toContain('Bit-flip');
  });
});
