/**
 * Pure Bloch Sphere Mathematics
 */

export interface BlochProbabilities {
  alpha: number;
  beta: number;
  prob0: number;
  prob1: number;
}

export function calculateBlochProbabilities(theta: number): BlochProbabilities {
  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);
  const prob0 = Math.round(alpha ** 2 * 100);
  const prob1 = 100 - prob0;

  return { alpha, beta, prob0, prob1 };
}
