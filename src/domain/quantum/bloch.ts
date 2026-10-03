export function calculateBlochProbabilities(theta: number) {
  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);
  const prob0 = Math.round(Math.pow(alpha, 2) * 100);
  const prob1 = 100 - prob0;
  return { alpha, beta, prob0, prob1 };
}
