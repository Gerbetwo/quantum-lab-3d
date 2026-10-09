export type BitTriple = [0 | 1, 0 | 1, 0 | 1];

export function bitFlipEncode(bit: 0 | 1): BitTriple {
  return bit === 1 ? [1, 1, 1] : [0, 0, 0];
}

export function injectBitFlip(triple: BitTriple, index: 0 | 1 | 2): BitTriple {
  const copy: BitTriple = [...triple];
  copy[index] = copy[index] === 1 ? 0 : 1;
  return copy;
}

export function bitFlipDecode(triple: BitTriple): 0 | 1 {
  const sum = triple[0] + triple[1] + triple[2];
  return sum >= 2 ? 1 : 0;
}

export function detectBitFlipSyndrome(triple: BitTriple): {
  syndrome: number;
  errorIndex: number;
  corrected: BitTriple;
} {
  const [b0, b1, b2] = triple;
  let errorIndex = -1;
  const corrected: BitTriple = [...triple];

  if (b0 !== b1 && b0 !== b2) {
    errorIndex = 0;
    corrected[0] = (1 - b0) as 0 | 1;
  } else if (b1 !== b0 && b1 !== b2) {
    errorIndex = 1;
    corrected[1] = (1 - b1) as 0 | 1;
  } else if (b2 !== b0 && b2 !== b1) {
    errorIndex = 2;
    corrected[2] = (1 - b2) as 0 | 1;
  }

  const syndrome = errorIndex === 0 ? 1 : errorIndex === 1 ? 2 : errorIndex === 2 ? 3 : 0;

  return { syndrome, errorIndex, corrected };
}

export function phaseFlipEncode(alpha: number): { plus: number; minus: number } {
  const beta = Math.sqrt(Math.max(0, 1 - alpha * alpha));
  return {
    plus: (alpha + beta) / Math.SQRT2,
    minus: (alpha - beta) / Math.SQRT2,
  };
}

export function injectPhaseFlip(
  state: { plus: number; minus: number },
  errorIndex: number
): { plus: number; minus: number; errorIndex: number } {
  return { ...state, errorIndex };
}

export function applyRepetitionCode3(
  bit: 0 | 1,
  errorType: 'none' | 'bit' | 'phase'
): { corrected: 0 | 1; detected: boolean; syndrome: number } {
  if (errorType === 'none') {
    return { corrected: bit, detected: false, syndrome: 0 };
  }
  if (errorType === 'bit') {
    const encoded = bitFlipEncode(bit);
    const corrupted = injectBitFlip(encoded, 0);
    const syn = detectBitFlipSyndrome(corrupted);
    return { corrected: bitFlipDecode(syn.corrected), detected: true, syndrome: syn.syndrome };
  }
  return { corrected: bit, detected: false, syndrome: 0 };
}
