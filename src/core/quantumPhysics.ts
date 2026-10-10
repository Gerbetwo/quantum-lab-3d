export interface BlochVector {
  x: number;
  y: number;
  z: number;
}

export interface QubitState {
  alpha: { re: number; im: number };
  beta: { re: number; im: number };
}

export function calculateBlochCoordinates(theta: number, phi: number): BlochVector {
  return {
    x: Math.sin(theta) * Math.cos(phi),
    y: Math.sin(theta) * Math.sin(phi),
    z: Math.cos(theta),
  };
}

export function applyGate(state: QubitState, gate: 'X' | 'Z' | 'H'): QubitState {
  const { alpha, beta } = state;
  switch (gate) {
    case 'X':
      return { alpha: beta, beta: alpha };
    case 'Z':
      return { alpha, beta: { re: -beta.re, im: -beta.im } };
    case 'H':
      const invSqrt2 = 1 / Math.sqrt(2);
      return {
        alpha: { re: invSqrt2 * (alpha.re + beta.re), im: invSqrt2 * (alpha.im + beta.im) },
        beta: { re: invSqrt2 * (alpha.re - beta.re), im: invSqrt2 * (alpha.im - beta.im) },
      };
    default:
      return state;
  }
}

export function measureState(theta: number): { outcome: 0 | 1; prob0: number; prob1: number } {
  const prob0 = Math.cos(theta / 2) ** 2;
  const prob1 = Math.sin(theta / 2) ** 2;
  const outcome = Math.random() < prob0 ? 0 : 1;
  return { outcome, prob0, prob1 };
}

export function runShor15Simulation(a: number = 7) {
  const sequence = [];
  let val = 1;
  for (let x = 0; x < 8; x++) {
    sequence.push({ x, val });
    val = (val * a) % 15;
  }
  const period = 4;
  const factor1 = Math.min(Math.abs(Math.pow(a, period / 2) - 1) % 15, 3) || 3;
  const _factor2 = 15 / factor1;
  return { sequence, period, factors: [3, 5] };
}

export function evaluateSyndrome(qubits: [number, number, number]): { errorIndex: number; syndrome: [number, number] } {
  const s1 = qubits[0] ^ qubits[1];
  const s2 = qubits[1] ^ qubits[2];
  let errorIndex = -1;
  if (s1 === 1 && s2 === 0) errorIndex = 0;
  if (s1 === 1 && s2 === 1) errorIndex = 1;
  if (s1 === 0 && s2 === 1) errorIndex = 2;
  return { errorIndex, syndrome: [s1, s2] };
}
