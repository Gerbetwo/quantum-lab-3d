/** Deterministic RNG for tests. Cycles through provided values. */
export function makeRng(...values: number[]): () => number {
  if (values.length === 0) throw new Error('makeRng requires at least one value');
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i += 1;
    return v;
  };
}
