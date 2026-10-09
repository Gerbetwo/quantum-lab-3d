import { describe, it, expect } from "vitest";
import {
  calculateBlochVector,
  calculateBlochProbabilities,
  formatStateVector,
} from '@/core/math/bloch';

describe("HU-06 — Bloch Probabilities Calculation", () => {
  it("calculates exact state amplitudes and probabilities for North Pole (|0⟩)", () => {
    const res = calculateBlochProbabilities(0);
    expect(res.alpha).toBeCloseTo(1);
    expect(res.beta).toBeCloseTo(0);
    expect(res.prob0).toBe(100);
    expect(res.prob1).toBe(0);
  });

  it("calculates equal probabilities for Equator superposition (|+⟩)", () => {
    const res = calculateBlochProbabilities(Math.PI / 2);
    expect(res.alpha).toBeCloseTo(Math.SQRT1_2);
    expect(res.beta).toBeCloseTo(Math.SQRT1_2);
    expect(res.prob0).toBe(50);
    expect(res.prob1).toBe(50);
  });

  it("calculates exact state amplitudes and probabilities for South Pole (|1⟩)", () => {
    const res = calculateBlochProbabilities(Math.PI);
    expect(res.alpha).toBeCloseTo(0);
    expect(res.beta).toBeCloseTo(1);
    expect(res.prob0).toBe(0);
    expect(res.prob1).toBe(100);
  });
});
describe("Bloch Sphere Domain Engine", () => {
  it("calcula el vector de Bloch para los estados |0⟩ y |1⟩", () => {
    // theta = 0 corresponde al estado |0>
    const vecZero = calculateBlochVector(0, 0);
    expect(vecZero.z).toBe(1);

    // theta = PI corresponde al estado |1>
    const vecOne = calculateBlochVector(Math.PI, 0);
    expect(vecOne.z).toBe(-1);
  });

  it("calcula las probabilidades de superposición", () => {
    const probs = calculateBlochProbabilities(0);
    expect(probs.prob0).toBe(100);
    expect(probs.prob1).toBe(0);
  });

  it("formatea correctamente la representación vectorial del estado", () => {
    const formatted = formatStateVector(0, 0);
    expect(formatted).toBe("|ψ⟩ = 1|0⟩");
  });
});
