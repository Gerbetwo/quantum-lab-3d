export * from './types';
export * from './gates';
export * from './measurement';
export * from './circuit';
export * from './presets';
export * from './decoherence';

export function createInitialState(nQubits: number = 1): unknown {
  if (nQubits === 3) {
    return [{ re: 1, im: 0 }, { re: 1, im: 0 }, { re: 1, im: 0 }];
  }
  const size = 1 << nQubits;
  return new Array(size).fill(0).map((_, i) => ({ re: i === 0 ? 1 : 0, im: 0 }));
}
