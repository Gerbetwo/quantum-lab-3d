/**
 * Bell Pair Correlated Measurement Rules
 */

export interface CorrelatedMeasurement {
  alice: 0 | 1;
  bob: 0 | 1;
}

export function correlateEntangledMeasurement(outcome: 0 | 1): CorrelatedMeasurement {
  return {
    alice: outcome,
    bob: outcome,
  };
}
