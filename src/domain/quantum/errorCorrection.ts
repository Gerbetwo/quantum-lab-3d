/**
 * Quantum Error Correction (pure domain, no React / no Three.js)
 *
 * Three-qubit repetition code:
 *   - Encode: 0 -> [0,0,0], 1 -> [1,1,1]
 *   - Syndrome decoding: majority vote + error index detection
 *   - Single bit-flip errors are correctable; double errors are not.
 */

export type Bit = 0 | 1;
export type BitTriple = readonly [Bit, Bit, Bit];

export function bitFlipEncode(bit: Bit): BitTriple {
  return [bit, bit, bit] as const;
}

export function injectBitFlip(bits: BitTriple, index: 0 | 1 | 2): BitTriple {
  const copy: [Bit, Bit, Bit] = [bits[0], bits[1], bits[2]];
  copy[index] = (copy[index] === 0 ? 1 : 0) as Bit;
  return copy as BitTriple;
}

export function bitFlipDecode(bits: BitTriple): Bit {
  const sum = bits[0] + bits[1] + bits[2];
  return sum >= 2 ? 1 : 0;
}

export function detectBitFlipSyndrome(bits: BitTriple): {
  syndrome: number;
  corrected: BitTriple;
  errorIndex: number;
} {
  const majority = bitFlipDecode(bits);
  let errorIndex = -1;
  for (let i = 0; i < 3; i++) {
    if (bits[i] !== majority) { errorIndex = i; break; }
  }
  const syndrome = errorIndex === -1 ? 0 : errorIndex + 1;
  let corrected: BitTriple = bits;
  if (errorIndex !== -1) {
    const copy: [Bit, Bit, Bit] = [bits[0], bits[1], bits[2]];
    copy[errorIndex] = majority;
    corrected = copy as BitTriple;
  }
  return { syndrome, corrected, errorIndex };
}

/**
 * Phase-flip code: the logical qubit is encoded in the {|+>, |->} basis.
 * Returns the amplitudes of the state in that basis.
 */
export function phaseFlipEncode(alpha: number): { plus: number; minus: number } {
  const beta = Math.sqrt(Math.max(0, 1 - alpha * alpha));
  return {
    plus: (alpha + beta) / Math.SQRT2,
    minus: (alpha - beta) / Math.SQRT2,
  };
}

/**
 * Records which of the 3 physical qubits received a phase flip.
 * The abstract 2-amplitude representation is preserved for teaching.
 */
export function injectPhaseFlip(
  encoded: { plus: number; minus: number },
  index: 0 | 1 | 2
): { plus: number; minus: number; errorIndex: 0 | 1 | 2 } {
  return { plus: encoded.plus, minus: encoded.minus, errorIndex: index };
}

export function applyRepetitionCode3(
  bit: Bit,
  error: 'none' | 'bit' | 'phase'
): { corrected: Bit; detected: boolean; syndrome: number } {
  const encoded = bitFlipEncode(bit);
  if (error === 'none') return { corrected: bit, detected: false, syndrome: 0 };
  if (error === 'bit') {
    const corrupted = injectBitFlip(encoded, 1);
    const { corrected, syndrome } = detectBitFlipSyndrome(corrupted);
    return { corrected: bitFlipDecode(corrected), detected: true, syndrome };
  }
  // Phase errors are invisible in the computational basis.
  return { corrected: bit, detected: false, syndrome: 0 };
}
