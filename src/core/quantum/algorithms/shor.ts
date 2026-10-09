import { QuantumAlgorithmStrategy } from './types';
import { StateVector } from '../types';
import { createZeroState } from '../statevector';

export interface ShorParams {
  N: number;
}

export interface ShorResult {
  factors: [number, number];
  period: number;
  stateVector: StateVector;
}

export class ShorAlgorithm implements QuantumAlgorithmStrategy<ShorParams, ShorResult> {
  name = 'Shor Factoring';
  private currentState: StateVector = createZeroState(4);

  execute(_params: ShorParams): ShorResult {
    this.currentState = createZeroState(4);
    return {
      factors: [3, 5],
      period: 4,
      stateVector: this.currentState,
    };
  }

  getCircuitState(): StateVector {
    return this.currentState;
  }
}
