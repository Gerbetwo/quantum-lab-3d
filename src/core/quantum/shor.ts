export interface ShorStepResult {
  N: number;
  base: number;
  period: number | null;
  modularSequence: { x: number; val: number }[];
  halfPowerVal: number | null;
  factors: [number, number] | null;
  isSuccess: boolean;
  explanation: string;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function factorizeShorN15(base: number): ShorStepResult {
  const N = 15;
  const validBases = [2, 7, 8, 11, 13];

  if (!validBases.includes(base)) {
    return {
      N,
      base,
      period: null,
      modularSequence: [],
      halfPowerVal: null,
      factors: null,
      isSuccess: false,
      explanation: `La base ${base} no es válida para la demostración. Elige una base coprima con 15 (2, 7, 8, 11, 13).`,
    };
  }

  const modularSequence: { x: number; val: number }[] = [];
  let period: number | null = null;

  let currentVal = 1;
  for (let x = 1; x <= 16; x++) {
    currentVal = (currentVal * base) % N;
    modularSequence.push({ x, val: currentVal });

    if (currentVal === 1 && period === null) {
      period = x;
      break;
    }
  }

  if (!period || period % 2 !== 0) {
    return {
      N,
      base,
      period,
      modularSequence,
      halfPowerVal: null,
      factors: null,
      isSuccess: false,
      explanation: `El período hallado (r=${period}) no es par. Se requiere un período par para derivar factores.`,
    };
  }

  const halfPowerVal = Math.pow(base, period / 2) % N;

  if ((halfPowerVal + 1) % N === 0) {
    return {
      N,
      base,
      period,
      modularSequence,
      halfPowerVal,
      factors: null,
      isSuccess: false,
      explanation: `a^(r/2) ≡ -1 (mod N). Esto produce factores triviales gcd(${halfPowerVal}-1, 15).`,
    };
  }

  const p = gcd(Math.pow(base, period / 2) - 1, N);
  const q = gcd(Math.pow(base, period / 2) + 1, N);

  const isSuccess = p * q === N && p > 1 && q > 1;

  return {
    N,
    base,
    period,
    modularSequence,
    halfPowerVal,
    factors: isSuccess ? [Math.min(p, q), Math.max(p, q)] : null,
    isSuccess,
    explanation: isSuccess
      ? `Factorización exitosa de N=15: Factores calculados [${Math.min(p, q)}, ${Math.max(p, q)}]. Comprobación: ${p} × ${q} = ${N}.`
      : 'No se pudieron extraer factores no triviales.',
  };
}
