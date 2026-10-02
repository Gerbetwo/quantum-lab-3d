/**
 * Deterministic Qubit Measurement with Injectable RNG
 */

export function measureQubit(
  theta: number,
  random: () => number = Math.random
): 0 | 1 {
  const probabilityZero = Math.cos(theta / 2) ** 2;
  return random() < probabilityZero ? 0 : 1;
}
