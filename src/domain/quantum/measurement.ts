export function measureQubit(theta: number, rng: () => number = Math.random): 0 | 1 {
  const prob0 = Math.pow(Math.cos(theta / 2), 2);
  return rng() < prob0 ? 0 : 1;
}
