import { describe, it, expect, vi } from "vitest";
import * as THREE from "three";
import {
  computeBornProbabilities,
  createMeasurementChamberGroup,
  createPoleDensityRingsGroup,
  createCollapseRaySystem,
  createSamplingHistogram3D,
} from "../MeasurementChamber3D";

describe("MeasurementChamber3D Math & Three.js Objects", () => {
  describe("computeBornProbabilities", () => {
    it("satisfies Born rule for |0⟩ ground state at θ = 0", () => {
      const { p0, p1 } = computeBornProbabilities(0);
      expect(p0).toBeCloseTo(1, 5);
      expect(p1).toBeCloseTo(0, 5);
      expect(p0 + p1).toBeCloseTo(1, 5);
    });

    it("satisfies Born rule for equal superposition at θ = π/2", () => {
      const { p0, p1 } = computeBornProbabilities(Math.PI / 2);
      expect(p0).toBeCloseTo(0.5, 5);
      expect(p1).toBeCloseTo(0.5, 5);
      expect(p0 + p1).toBeCloseTo(1, 5);
    });

    it("satisfies Born rule for |1⟩ excited state at θ = π", () => {
      const { p0, p1 } = computeBornProbabilities(Math.PI);
      expect(p0).toBeCloseTo(0, 5);
      expect(p1).toBeCloseTo(1, 5);
      expect(p0 + p1).toBeCloseTo(1, 5);
    });

    it("maintains probability normalization P₀ + P₁ = 1 across arbitrary angles", () => {
      const testThetas = [0.1, 0.45, 1.23, 2.1, 2.8, Math.PI - 0.05];
      for (const th of testThetas) {
        const { p0, p1 } = computeBornProbabilities(th);
        expect(p0 + p1).toBeCloseTo(1, 5);
        expect(p0).toBeGreaterThanOrEqual(0);
        expect(p1).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("createMeasurementChamberGroup", () => {
    it("creates enclosure mesh, emitter coils, and structural struts with telemetry tags", () => {
      const chamber = createMeasurementChamberGroup(1.45);

      expect(chamber.group.name).toBe("measurement-chamber-group");
      expect(chamber.chamberMesh.name).toBe("measurement-chamber-cage");
      expect(chamber.chamberMesh.userData.spatialId).toBe("measurement-chamber");

      expect(chamber.emitterNorth.name).toBe("emitter-north");
      expect(chamber.emitterNorth.position.y).toBeGreaterThan(1.0);

      expect(chamber.emitterSouth.name).toBe("emitter-south");
      expect(chamber.emitterSouth.position.y).toBeLessThan(-1.0);

      expect(() => chamber.dispose()).not.toThrow();
    });
  });

  describe("createPoleDensityRingsGroup", () => {
    it("creates North and South pole rings that dynamically scale with Born probabilities", () => {
      const poleRings = createPoleDensityRingsGroup(1.34);

      expect(poleRings.ringNorth.userData.spatialId).toBe("probability-p0");
      expect(poleRings.ringSouth.userData.spatialId).toBe("probability-p1");

      // Update to θ = 0 (|0⟩): North ring maximum, South ring minimum
      poleRings.update(0);
      expect(poleRings.ringNorth.scale.x).toBeCloseTo(1, 2);
      expect(poleRings.ringSouth.scale.x).toBeLessThan(0.1);

      // Update to θ = π (|1⟩): South ring maximum, North ring minimum
      poleRings.update(Math.PI);
      expect(poleRings.ringSouth.scale.x).toBeCloseTo(1, 2);
      expect(poleRings.ringNorth.scale.x).toBeLessThan(0.1);

      // Update to θ = π/2 (equal superposition): Both rings equal
      poleRings.update(Math.PI / 2);
      expect(poleRings.ringNorth.scale.x).toBeCloseTo(poleRings.ringSouth.scale.x, 2);

      expect(() => poleRings.dispose()).not.toThrow();
    });
  });

  describe("createCollapseRaySystem", () => {
    it("triggers projectile collapse ray animation and fires completion callback", () => {
      const collapseSys = createCollapseRaySystem(1.34, 1.52);
      const onComplete = vi.fn();

      collapseSys.triggerRay(0, onComplete);

      // Step animation forward
      collapseSys.update(0.1);
      collapseSys.update(0.2);
      collapseSys.update(0.2); // total 0.5s > duration 0.45s

      expect(onComplete).toHaveBeenCalledTimes(1);

      // Trigger ray for outcome 1
      collapseSys.triggerRay(1);
      collapseSys.update(0.5);

      expect(() => collapseSys.dispose()).not.toThrow();
    });
  });

  describe("createSamplingHistogram3D", () => {
    it("updates 3D columns based on accumulated shots and Born probabilities", () => {
      const histogram = createSamplingHistogram3D(new THREE.Vector3(2, 0, 0));

      expect(histogram.group.name).toBe("sampling-histogram-3d");
      expect(histogram.bar0.name).toBe("histogram-bar-0");
      expect(histogram.bar1.name).toBe("histogram-bar-1");

      // Update counts: 30 for outcome 0, 10 for outcome 1 (f0 = 0.75, f1 = 0.25)
      histogram.updateCounts(30, 10, 0.75, 0.25);

      // Bar 0 should be 3 times higher than Bar 1
      expect(histogram.bar0.scale.y).toBeCloseTo(histogram.bar1.scale.y * 3, 2);

      expect(() => histogram.dispose()).not.toThrow();
    });
  });
});
