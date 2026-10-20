import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import * as THREE from "three";
import {
  SpatialTooltipOverlay,
  project3DTo2D,
} from "../SpatialTooltipOverlay";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";

describe("SpatialTooltipOverlay", () => {
  beforeEach(() => {
    useSpatialTelemetryBridge.getState().clearFocus();
  });

  describe("project3DTo2D math function", () => {
    it("projects 3D center origin into the center of the 2D screen", () => {
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      const screenCoords = project3DTo2D(new THREE.Vector3(0, 0, 0), camera, 800, 600);
      expect(screenCoords.isVisible).toBe(true);
      expect(screenCoords.x).toBeCloseTo(400, 1);
      expect(screenCoords.y).toBeCloseTo(300, 1);
    });

    it("marks points behind the camera as not visible", () => {
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      // Point behind camera at (0, 0, 10)
      const screenCoords = project3DTo2D(new THREE.Vector3(0, 0, 10), camera, 800, 600);
      expect(screenCoords.isVisible).toBe(false);
    });
  });

  describe("Component Rendering", () => {
    it("renders children when visible and projected within viewport", () => {
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      const onProject = vi.fn();

      render(
        <SpatialTooltipOverlay
          position={new THREE.Vector3(0, 0, 0)}
          camera={camera}
          onProject={onProject}
        >
          <span data-testid="tooltip-content">θ = 45°</span>
        </SpatialTooltipOverlay>
      );

      expect(screen.getByTestId("tooltip-content")).toBeInTheDocument();
      expect(screen.getByTestId("spatial-tooltip-overlay")).toHaveStyle("z-index: 20");
    });

    it("returns null when visible prop is false", () => {
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      render(
        <SpatialTooltipOverlay
          position={new THREE.Vector3(0, 0, 0)}
          camera={camera}
          visible={false}
        >
          <span>Hidden Content</span>
        </SpatialTooltipOverlay>
      );

      expect(screen.queryByTestId("spatial-tooltip-overlay")).not.toBeInTheDocument();
    });

    it("highlights when activeFocusId matches spatialId", () => {
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      useSpatialTelemetryBridge.getState().setActiveFocusId("theta-arc");

      render(
        <SpatialTooltipOverlay
          position={new THREE.Vector3(0, 0, 0)}
          camera={camera}
          spatialId="theta-arc"
        >
          <span>Polar Arc Angle</span>
        </SpatialTooltipOverlay>
      );

      const overlay = screen.getByTestId("spatial-tooltip-overlay");
      expect(overlay).toHaveClass("scale-105");
    });
  });
});
