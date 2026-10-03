export interface EntangledPairOutcome {
  alice: 0 | 1;
  bob: 0 | 1;
}

export function correlateEntangledMeasurement(outcome: 0 | 1): EntangledPairOutcome {
  return {
    alice: outcome,
    bob: outcome,
  };
}

export function measureBellPair(
  random: () => number = Math.random
): EntangledPairOutcome {
  const aliceOutcome: 0 | 1 = random() < 0.5 ? 0 : 1;
  return correlateEntangledMeasurement(aliceOutcome);
}
