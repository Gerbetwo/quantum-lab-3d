export function measureQubit(
  theta: number,
  rng: () => number = Math.random,
): 0 | 1 {
  const prob0 = Math.cos(theta / 2) ** 2;
  return rng() < prob0 ? 0 : 1;
}

export function calculateMeasurementDistribution(
  theta: number,
  samples: number = 1000,
  rng: () => number = Math.random,
): { zeros: number; ones: number } {
  let zeros = 0;
  let ones = 0;
  for (let i = 0; i < samples; i++) {
    if (measureQubit(theta, rng) === 0) zeros++;
    else ones++;
  }
  return { zeros, ones };
}
