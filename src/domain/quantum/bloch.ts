export interface BlochVector {
  x: number;
  y: number;
  z: number;
}

export interface BlochProbabilities {
  alpha: number;
  beta: number;
  prob0: number;
  prob1: number;
}

export function calculateBlochVector(theta: number, phi: number = 0): BlochVector {
  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.sin(theta) * Math.sin(phi);
  const z = Math.cos(theta);
  return {
    x: Math.round(x * 1000) / 1000,
    y: Math.round(y * 1000) / 1000,
    z: Math.round(z * 1000) / 1000,
  };
}

export function calculateBlochProbabilities(theta: number): BlochProbabilities {
  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);
  const prob0 = Math.round(alpha * alpha * 100);
  const prob1 = 100 - prob0;
  return { alpha, beta, prob0, prob1 };
}

export function formatStateVector(theta: number, phi: number = 0): string {
  const cos = Math.round(Math.cos(theta / 2) * 100) / 100;
  const sin = Math.round(Math.sin(theta / 2) * 100) / 100;
  if (sin === 0) return `|ψ⟩ = ${cos}|0⟩`;
  if (cos === 0) return `|ψ⟩ = ${sin}|1⟩`;
  return `|ψ⟩ = ${cos}|0⟩ + ${sin}|1⟩`;
}
