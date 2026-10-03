export function correlateEntangledMeasurement(aliceOutcome: number): { alice: number; bob: number } {
  return {
    alice: aliceOutcome,
    bob: aliceOutcome,
  };
}
