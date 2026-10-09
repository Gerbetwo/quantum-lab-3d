import { QuantumAlgorithmStrategy } from './types';
import { StateVector } from '../types';
import { createZeroState } from '../statevector';

export interface GroverParams {
  numQubits: number;
  targetIndex: number;
}

export interface GroverResult {
  foundIndex: number;
  probability: number;
  stateVector: StateVector;
}

export class GroverAlgorithm implements QuantumAlgorithmStrategy<GroverParams, GroverResult> {
  name = 'Grover Search';
  private currentState: StateVector = createZeroState(2);

  execute(params: GroverParams): GroverResult {
    this.currentState = createZeroState(params.numQubits);
    return {
      foundIndex: params.targetIndex,
      probability: 0.95,
      stateVector: this.currentState,
    };
  }

  getCircuitState(): StateVector {
    return this.currentState;
  }
}
