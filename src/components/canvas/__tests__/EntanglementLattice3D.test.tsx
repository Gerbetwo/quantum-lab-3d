import { describe, it, expect, vi } from "vitest";
import {
  computeTwoQubitState,
  computeSteeredQubitB,
  createEntanglementLatticeGroup,
  createBlochSphereGroup,
} from "../EntanglementLattice3D";

describe("EntanglementLattice3D Math & Three.js Objects", () => {
  describe("computeTwoQubitState", () => {
    it("computes Bell state |Φ⁺⟩ with maximum entanglement entropy", () => {
      const state = computeTwoQubitState("phi_plus", 0, 0, 1.0);
      expect(state.bellType).toBe("phi_plus");
      expect(state.c00.prob).toBeCloseTo(0.5, 4);
      expect(state.c11.prob).toBeCloseTo(0.5, 4);
      expect(state.c01.prob).toBeCloseTo(0, 4);
      expect(state.c10.prob).toBeCloseTo(0, 4);
      expect(state.entropy).toBeCloseTo(1.0, 4);
      expect(state.c00.prob + state.c01.prob + state.c10.prob + state.c11.prob).toBeCloseTo(1.0, 4);
    });

    it("computes Bell singlet state |Ψ⁻⟩ with anti-correlated amplitudes", () => {
      const state = computeTwoQubitState("psi_minus", 0, 0, 1.0);
      expect(state.bellType).toBe("psi_minus");
      expect(state.c01.prob).toBeCloseTo(0.5, 4);
      expect(state.c10.prob).toBeCloseTo(0.5, 4);
      expect(state.c00.prob).toBeCloseTo(0, 4);
      expect(state.c11.prob).toBeCloseTo(0, 4);
      expect(state.c10.real).toBeLessThan(0); // -1/√2
      expect(state.entropy).toBeCloseTo(1.0, 4);
    });

    it("yields zero entanglement entropy for separable states", () => {
      const state = computeTwoQubitState("separable", 0, 0, 0);
      expect(state.entropy).toBe(0);
      expect(state.c00.prob).toBeCloseTo(1.0, 4);
    });
  });

  describe("computeSteeredQubitB", () => {
    it("steers Qubit B identically to Qubit A in Bell state |Φ⁺⟩", () => {
      const targetTheta = Math.PI / 3;
      const targetPhi = Math.PI / 4;
      const { thetaB, phiB } = computeSteeredQubitB("phi_plus", targetTheta, targetPhi, 1.0);

      expect(thetaB).toBeCloseTo(targetTheta, 4);
      expect(phiB).toBeGreaterThanOrEqual(0);
    });

    it("steers Qubit B antipodally in singlet state |Ψ⁻⟩", () => {
      const targetTheta = Math.PI / 4;
      const { thetaB } = computeSteeredQubitB("psi_minus", targetTheta, 0, 1.0);

      expect(thetaB).toBeCloseTo(Math.PI - targetTheta, 4);
    });

    it("decouples steering when entanglement entropy is zero", () => {
      const { thetaB, phiB } = computeSteeredQubitB("phi_plus", Math.PI / 2, Math.PI / 2, 0);
      expect(thetaB).toBe(0);
      expect(phiB).toBe(0);
    });
  });

  describe("createEntanglementLatticeGroup", () => {
    it("creates tensor lattice mesh and particle stream with spatial telemetry tags", () => {
      const lattice = createEntanglementLatticeGroup();

      expect(lattice.group.name).toBe("entanglement-lattice-group");
      expect(lattice.latticeMesh.name).toBe("entanglement-tensor-lattice");
      expect(lattice.latticeMesh.userData.spatialId).toBe("entanglement-lattice");
      expect(lattice.particles.name).toBe("entanglement-particles");

      // Verify ignition trigger
      expect(() => lattice.triggerIgnition("phi_plus")).not.toThrow();

      // Verify collapse shockwave trigger and callback
      const onComplete = vi.fn();
      lattice.triggerCollapseWave(0, onComplete);
      lattice.update(0.2, true);
      lattice.update(0.3, true); // Total 0.5s > 0.4s duration

      expect(onComplete).toHaveBeenCalledTimes(1);

      expect(() => lattice.dispose()).not.toThrow();
    });
  });

  describe("createBlochSphereGroup", () => {
    it("creates Alice and Bob sphere groups with arrow helper and tip handle", () => {
      const alice = createBlochSphereGroup(-2.2, 0.9, 0x00f3ff, "qubit-alice");
      expect(alice.group.position.x).toBe(-2.2);
      expect(alice.sphere.userData.spatialId).toBe("qubit-alice");
      expect(alice.tipHandle.userData.spatialId).toBe("qubit-alice");

      alice.updateVector(Math.PI / 2, 0);
      expect(alice.tipHandle.position.x).toBeCloseTo(0.9, 4);

      expect(() => alice.dispose()).not.toThrow();
    });
  });
});
