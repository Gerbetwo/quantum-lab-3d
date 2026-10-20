import { describe, it, expect, beforeEach } from "vitest";
import {
  useSpatialTelemetryBridge,
  getTelemetrySymbol,
  getTelemetryMapping,
  SPATIAL_TELEMETRY_MAP,
} from "../useSpatialTelemetryBridge";

describe("useSpatialTelemetryBridge", () => {
  beforeEach(() => {
    useSpatialTelemetryBridge.getState().clearFocus();
  });

  it("initializes with activeFocusId as null", () => {
    const state = useSpatialTelemetryBridge.getState();
    expect(state.activeFocusId).toBeNull();
    expect(state.getActiveSymbol()).toBeNull();
    expect(state.getActiveMapping()).toBeNull();
  });

  it("sets activeFocusId and returns mapped symbol", () => {
    useSpatialTelemetryBridge.getState().setActiveFocusId("theta-arc");
    const state = useSpatialTelemetryBridge.getState();

    expect(state.activeFocusId).toBe("theta-arc");
    expect(state.getActiveSymbol()).toBe("θ");

    const mapping = state.getActiveMapping();
    expect(mapping).toBeDefined();
    expect(mapping?.symbol).toBe("θ");
    expect(mapping?.latex).toBe("\\theta");
    expect(mapping?.label).toBe("Polar Angle (θ)");
  });

  it("maps core spatial IDs accurately", () => {
    expect(getTelemetrySymbol("theta-arc")).toBe("θ");
    expect(getTelemetrySymbol("phase-disk")).toBe("φ");
    expect(getTelemetrySymbol("gate-axis-x")).toBe("X");
    expect(getTelemetrySymbol("gate-axis-y")).toBe("Y");
    expect(getTelemetrySymbol("gate-axis-z")).toBe("Z");
    expect(getTelemetrySymbol("state-vector")).toBe("|ψ⟩");
    expect(getTelemetrySymbol("probability-p0")).toBe("P(|0⟩)");
    expect(getTelemetrySymbol("probability-p1")).toBe("P(|1⟩)");
  });

  it("clears focus back to null", () => {
    useSpatialTelemetryBridge.getState().setActiveFocusId("phase-disk");
    expect(useSpatialTelemetryBridge.getState().activeFocusId).toBe("phase-disk");

    useSpatialTelemetryBridge.getState().clearFocus();
    expect(useSpatialTelemetryBridge.getState().activeFocusId).toBeNull();
    expect(useSpatialTelemetryBridge.getState().getActiveSymbol()).toBeNull();
  });

  it("handles unknown or null IDs gracefully", () => {
    expect(getTelemetrySymbol(null)).toBeNull();
    expect(getTelemetrySymbol("non-existent-id")).toBeNull();
    expect(getTelemetryMapping(null)).toBeNull();
    expect(getTelemetryMapping("non-existent-id")).toBeNull();
  });

  it("exposes all mapped entries in SPATIAL_TELEMETRY_MAP", () => {
    expect(Object.keys(SPATIAL_TELEMETRY_MAP).length).toBeGreaterThanOrEqual(10);
    for (const [id, mapping] of Object.entries(SPATIAL_TELEMETRY_MAP)) {
      expect(mapping.id).toBe(id);
      expect(mapping.symbol).toBeTruthy();
      expect(mapping.label).toBeTruthy();
    }
  });
});
