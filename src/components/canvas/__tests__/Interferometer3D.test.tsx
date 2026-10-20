import { describe, it, expect } from "vitest";
import {
  computeInterferenceAmplitudes,
  createDualPathInterferometerGroup,
  createWaveInterferenceSystem,
} from "../Interferometer3D";

describe("Interferometer3D Math & Three.js Objects", () => {
  describe("computeInterferenceAmplitudes", () => {
    it("yields total constructive interference at φ = 0", () => {
      const amp = computeInterferenceAmplitudes(0);
      expect(amp.pConstructive).toBeCloseTo(1, 5);
      expect(amp.pDestructive).toBeCloseTo(0, 5);
      expect(amp.constructiveMagnitude).toBeCloseTo(1, 5);
      expect(amp.destructiveMagnitude).toBeCloseTo(0, 5);
      expect(amp.pConstructive + amp.pDestructive).toBeCloseTo(1, 5);
    });

    it("yields total destructive interference at constructive port for φ = π", () => {
      const amp = computeInterferenceAmplitudes(Math.PI);
      expect(amp.pConstructive).toBeCloseTo(0, 5);
      expect(amp.pDestructive).toBeCloseTo(1, 5);
      expect(amp.constructiveMagnitude).toBeCloseTo(0, 5);
      expect(amp.destructiveMagnitude).toBeCloseTo(1, 5);
      expect(amp.pConstructive + amp.pDestructive).toBeCloseTo(1, 5);
    });

    it("yields balanced 50/50 split at φ = π/2", () => {
      const amp = computeInterferenceAmplitudes(Math.PI / 2);
      expect(amp.pConstructive).toBeCloseTo(0.5, 5);
      expect(amp.pDestructive).toBeCloseTo(0.5, 5);
      expect(amp.constructiveMagnitude).toBeCloseTo(Math.SQRT1_2, 5);
      expect(amp.destructiveMagnitude).toBeCloseTo(Math.SQRT1_2, 5);
      expect(amp.pConstructive + amp.pDestructive).toBeCloseTo(1, 5);
    });

    it("satisfies probability conservation P_c + P_d = 1 across arbitrary phase values", () => {
      const testPhis = [0, 0.35, Math.PI / 4, 1.2, Math.PI, 4.5, 2 * Math.PI];
      for (const phi of testPhis) {
        const amp = computeInterferenceAmplitudes(phi);
        expect(amp.pConstructive + amp.pDestructive).toBeCloseTo(1, 5);
        expect(amp.pConstructive).toBeGreaterThanOrEqual(0);
        expect(amp.pDestructive).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("createDualPathInterferometerGroup", () => {
    it("creates beam splitters, mirrors, optical rails, and phase shifter with telemetry tags", () => {
      const ifm = createDualPathInterferometerGroup();

      expect(ifm.group.name).toBe("dual-path-interferometer-group");
      expect(ifm.bs1Mesh.userData.spatialId).toBe("interferometer-path");
      expect(ifm.bs2Mesh.userData.spatialId).toBe("interferometer-path");
      expect(ifm.path0Line.userData.spatialId).toBe("interferometer-path");
      expect(ifm.path1Line.userData.spatialId).toBe("interferometer-path");
      expect(ifm.phaseShifterMesh.userData.spatialId).toBe("phase-shifter");
      expect(ifm.detectorConstructive.userData.spatialId).toBe("interference-detector");
      expect(ifm.detectorDestructive.userData.spatialId).toBe("interference-detector");

      // Verify update rotates phase dial
      ifm.update(Math.PI / 2);
      expect(ifm.phaseDial.rotation.z).toBeCloseTo(Math.PI / 2, 5);

      expect(() => ifm.dispose()).not.toThrow();
    });
  });

  describe("createWaveInterferenceSystem", () => {
    it("creates constructive and destructive ripple systems that scale with interference probabilities", () => {
      const waveSys = createWaveInterferenceSystem();

      expect(waveSys.group.name).toBe("wave-interference-system");
      expect(waveSys.waveRipplesConstructive.length).toBeGreaterThanOrEqual(4);
      expect(waveSys.waveRipplesDestructive.length).toBeGreaterThanOrEqual(4);

      // At φ = 0: constructive ripples visible, destructive ripples invisible
      waveSys.update(0.1, 0);
      expect(waveSys.waveRipplesConstructive[0].visible).toBe(true);

      // At φ = π: constructive ripples hidden, destructive ripples visible
      waveSys.update(0.1, Math.PI);
      expect(waveSys.waveRipplesConstructive[0].visible).toBe(false);
      expect(waveSys.waveRipplesDestructive[0].visible).toBe(true);

      expect(() => waveSys.dispose()).not.toThrow();
    });
  });
});
