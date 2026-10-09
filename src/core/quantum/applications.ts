/**
 * Dominio Cuántico: Algoritmo de Shor (Demostración didáctica N = 15)
 * Secuencia modular a^x mod 15, período r y extracción de factores.
 */

export interface ShorDemoResult {
  base: number;
  sequence: number[];
  period: number;
  factors: [number, number];
  explanation: string;
}

export function runShorDemo(base: number): ShorDemoResult {
  const validBases: Record<number, { seq: number[]; r: number; factors: [number, number] }> = {
    2: { seq: [1, 2, 4, 8], r: 4, factors: [3, 5] },
    7: { seq: [1, 7, 4, 13], r: 4, factors: [3, 5] },
    8: { seq: [1, 8, 4, 2], r: 4, factors: [3, 5] },
    11: { seq: [1, 11], r: 2, factors: [3, 5] },
    13: { seq: [1, 13, 4, 7], r: 4, factors: [3, 5] }
  };

  const demo = validBases[base] || validBases[2];
  return {
    base,
    sequence: demo.seq,
    period: demo.r,
    factors: demo.factors,
    explanation: `Para N = 15 y base a = ${base}, la secuencia modular revela un período r = ${demo.r}. Usando el cálculo cuántico de período, extraemos los factores primos ${demo.factors[0]} y ${demo.factors[1]}.`
  };
}
