import { StateVector } from '../statevector';

export interface QuantumAlgorithmStrategy<TInput, TOutput> {
  name: string;
  execute(params: TInput): TOutput;
  getCircuitState(): StateVector;
}
