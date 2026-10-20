import { describe, it, expect } from "vitest";
import {
  computeMeanAmplitude,
  applyOraclePhaseInversion,
  applyDiffusionReflection,
  computeGroverProbabilities,
  createAmplitudeBarGraphGroup,
  BASIS_LABELS_4,
} from "../AmplitudeBarGraph3D";

describe("AmplitudeBarGraph3D - Mathematics & 3D Scene Components", () => {
  it("calculates mean amplitude correctly for equal superposition and inverted state", () => {
    // Initial 2-qubit equal superposition: 1/√4 = 0.5
    const uniform = [0.5, 0.5, 0.5, 0.5];
    expect(computeMeanAmplitude(uniform)).toBeCloseTo(0.5, 5);

    // After Oracle phase marks state |10⟩ (index 2): [0.5, 0.5, -0.5, 0.5]
    const inverted = applyOraclePhaseInversion(uniform, 2);
    expect(inverted).toEqual([0.5, 0.5, -0.5, 0.5]);
    // Mean drops to (0.5 + 0.5 - 0.5 + 0.5)/4 = 1.0 / 4 = 0.25
    expect(computeMeanAmplitude(inverted)).toBeCloseTo(0.25, 5);
  });

  it("applies diffusion reflection across mean (inversion-about-the-mean)", () => {
    const inverted = [0.5, 0.5, -0.5, 0.5];
    const { amplitudes: reflected, mean } = applyDiffusionReflection(inverted);

    expect(mean).toBeCloseTo(0.25, 5);
    // Non-targets: 2*(0.25) - 0.5 = 0.5 - 0.5 = 0
    expect(reflected[0]).toBeCloseTo(0.0, 5);
    expect(reflected[1]).toBeCloseTo(0.0, 5);
    expect(reflected[3]).toBeCloseTo(0.0, 5);
    // Target state: 2*(0.25) - (-0.5) = 0.5 + 0.5 = 1.0 (100% amplification!)
    expect(reflected[2]).toBeCloseTo(1.0, 5);

    const probs = computeGroverProbabilities(reflected);
    expect(probs[2]).toBeCloseTo(1.0, 5);
    expect(probs[0]).toBeCloseTo(0.0, 5);
  });

  it("creates 3D AmplitudeBarGraphGroup with bars, mean reflection plane, and user metadata", () => {
    const groupResult = createAmplitudeBarGraphGroup(4, 2);

    expect(groupResult.group).toBeDefined();
    expect(groupResult.bars.length).toBe(4);
    expect(groupResult.barEdges.length).toBe(4);
    expect(groupResult.meanPlane).toBeDefined();
    expect(groupResult.meanPerimeter).toBeDefined();
    expect(groupResult.groundGrid).toBeDefined();

    // Check spatial telemetry user data
    expect(groupResult.meanPlane.userData.spatialId).toBe("mean-reflection-plane");
    expect(groupResult.bars[2].userData.spatialId).toBe("grover-amplitude-bar");
    expect(groupResult.bars[2].userData.stateIndex).toBe(2);
    expect(groupResult.bars[2].userData.label).toBe(BASIS_LABELS_4[2]);

    // Update with inverted amplitude and check updates
    groupResult.update(0.1, [0.5, 0.5, -0.5, 0.5], 2, true);
    expect(groupResult.meanPlane.position.y).toBeLessThan(0.5 * 2.4);

    // Trigger bounce pulse
    expect(() => groupResult.triggerBouncePulse()).not.toThrow();

    // Dispose
    expect(() => groupResult.dispose()).not.toThrow();
  });
});
