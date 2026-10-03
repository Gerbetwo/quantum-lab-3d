export function measureQubit(
  theta: number,
  random: () => number = Math.random
): 0 | 1 {
  const prob0 = Math.cos(theta / 2) ** 2;
  return random() < prob0 ? 0 : 1;
}

export function calculateMeasurementDistribution(
  theta: number,
  samples: number = 1000,
  random: () => number = Math.random
): { zeros: number; ones: number } {
  let zeros = 0;
  let ones = 0;
  for (let i = 0; i < samples; i++) {
    if (measureQubit(theta, random) === 0) {
      zeros++;
    } else {
      ones++;
    }
  }
  return { zeros, ones };
}
